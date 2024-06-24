import { NextFunction, Request, Response, Express } from "express";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import Product, { IProduct } from "../../models/product/product";
import Uploader from "../../utils/uploader";
import BaseController from "../helpers/base";
import AppError from "../../utils/error";
import sharp from "sharp";
import uploadImage from "../../utils/cloudinary-controller";

// Extend Express.Multer.File to allow partial modification
interface ModifiedFile extends Partial<Express.Multer.File> {
  buffer: Buffer;
  filename: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

class ProductController extends BaseController<IProduct> {
  constructor() {
    super(Product);
  }

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      delete req.body.ratingsQuantity;
      delete req.body.ratingsAverage;

      return await this.createOne(["cloudinaryPublicId"])(req, res, next);
    } catch (error) {
      next(error);
    }
  };
  getProducts = this.getAll(undefined, undefined, true); // enabling search to accept search text query
  getProduct = this.getOne();
  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      delete req.body.ratingsQuantity;
      delete req.body.ratingsAverage;

      return await this.updateOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return next(new AppError("No product found with that ID", 404));
      }

      // Delete images from Cloudinary
      await Promise.all(
        product.images.map(async (imgUrl: string) => {
          const publicIdMatch = imgUrl.match(/upload\/(?:v\d+\/)?([^\\.]+)/);
          if (publicIdMatch) {
            const publicIdToDelete = publicIdMatch[1];
            // Delete image from Cloudinary
            await cloudinary.uploader.destroy(publicIdToDelete as string);
          }
        }),
      );

      return await this.deleteOne()(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  uploadProductImages = new Uploader().upload.fields([
    { name: "image", maxCount: 8 },
  ]);

  resizeProductImages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Check if req.files exists and if req.files.image is an array
      if (req.files && Array.isArray((req as any).files.image)) {
        const id = req.body.publicId || uuidv4();
        const imageFiles = (req as any).files.image; // Type assertion not needed due to previous check

        await Promise.all(
          imageFiles.map(async (file: Express.Multer.File, i: number) => {
            const filename = `product-${id}-${i + 1}`; // Ensure a unique filename
            const resizedBuffer = await sharp(file.buffer)
              .resize(1000, 1000, {
                fit: "cover",
                position: "center",
              })
              .toFormat("jpeg")
              .jpeg({ quality: 90 })
              .toBuffer();

            // Create a modified file object with required properties
            const modifiedFile: ModifiedFile = {
              ...file, // Copy existing properties from original file
              buffer: resizedBuffer,
              filename: filename,
            };

            // Assign the modified file object back to req.files.image[i]
            (req as any).files.image[i] = modifiedFile;
          }),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Cloudinary Upload
  handleProductImagesUpload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.files || !(req as any).files.image) return next();

    try {
      const newImages: string[] = [];
      const newPublicIds: string[] = [];
      const oldImages = req.body.images || []; // Existing images from database

      await Promise.all(
        (req as any).files.image.map(async (image: Express.Multer.File) => {
          const { secure_url, public_id } = (await uploadImage(
            image,
            "e-buy/products",
          )) as UploadApiResponse;

          newImages.push(secure_url);

          newPublicIds.push(public_id);
        }),
      );

      // Delete old images from Cloudinary that are not in newPublicIds
      const imagesToDelete = oldImages.filter((img: string) => {
        const publicIdMatch = img.match(/upload\/(?:v\d+\/)?([^\\.]+)/);

        const existingPublicId = publicIdMatch ? publicIdMatch[1] : null;
        return existingPublicId && !newPublicIds.includes(existingPublicId);
      });

      await Promise.all(
        imagesToDelete.map(async (imgUrl: string) => {
          const publicIdMatch = imgUrl.match(/upload\/(?:v\d+\/)?([^\\.]+)/);
          const publicIdToDelete = publicIdMatch ? publicIdMatch[1] : null;
          if (publicIdToDelete) {
            // Delete image from Cloudinary
            await cloudinary.uploader.destroy(publicIdToDelete);
          }
        }),
      );

      // Update req.body with new images and publicIds
      req.body.images = newImages;
      const regex =
        /[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-4[0-9A-Za-z]{3}-[89ABab][0-9A-Za-z]{3}-[0-9A-Za-z]{12}/;

      // Use regex.exec to extract the UUID and assign it to the public id in DB
      req.body.cloudinaryPublicId = (
        regex.exec(newPublicIds[0]) as unknown as string
      )[0];

      next();
    } catch (error) {
      next(error);
    }
  };

  // this middleware will check if the product exist in case of creating and get the product id in case of updating
  // so we can use it on the image name
  checkProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If it's a POST request (creating a new product), return an error as the tour already exists
      if (req.method === "POST") {
        const product = await Product.findOne({ name: req.body.name });
        if (product)
          return next(
            new AppError("A product with this name already exists.", 400),
          );
      }

      if (["PUT", "PATCH"].includes(req.method)) {
        // Retrieve the product based on the provided product ID.
        const product = await Product.findById(req.params.id);

        if (!product) {
          // If Product does not exist, return an error
          return next(new AppError("Product not found.", 404));
        }

        // If it's a PUT request (updating a product), pass the cloudinary publicId to the next middleware
        req.body.publicId = product.cloudinaryPublicId;

        // pass the product images to handle consistency with cloudinary
        req.body.images = product.images;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default ProductController;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const uuid_1 = require("uuid");
const product_1 = __importDefault(require("../../models/product/product"));
const uploader_1 = __importDefault(require("../../utils/uploader"));
const base_1 = __importDefault(require("../helpers/base"));
const error_1 = __importDefault(require("../../utils/error"));
const sharp_1 = __importDefault(require("sharp"));
const cloudinary_controller_1 = __importDefault(require("../../utils/cloudinary-controller"));
class ProductController extends base_1.default {
    constructor() {
        super(product_1.default);
        this.createProduct = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                delete req.body.ratingsQuantity;
                delete req.body.ratingsAverage;
                return yield this.createOne(["cloudinaryPublicId"])(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.getProducts = this.getAll(undefined, undefined, true); // enabling search to accept search text query
        this.getProduct = this.getOne();
        this.updateProduct = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                delete req.body.ratingsQuantity;
                delete req.body.ratingsAverage;
                return yield this.updateOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteProduct = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield product_1.default.findById(req.params.id);
                if (!product) {
                    return next(new error_1.default("No product found with that ID", 404));
                }
                // Delete images from Cloudinary
                yield Promise.all(product.images.map((imgUrl) => __awaiter(this, void 0, void 0, function* () {
                    const publicIdMatch = imgUrl.match(/upload\/(?:v\d+\/)?([^\\.]+)/);
                    if (publicIdMatch) {
                        const publicIdToDelete = publicIdMatch[1];
                        // Delete image from Cloudinary
                        yield cloudinary_1.v2.uploader.destroy(publicIdToDelete);
                    }
                })));
                return yield this.deleteOne()(req, res, next);
            }
            catch (error) {
                next(error);
            }
        });
        this.uploadProductImages = new uploader_1.default().upload.fields([
            { name: "image", maxCount: 8 },
        ]);
        this.resizeProductImages = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if req.files exists and if req.files.image is an array
                if (req.files && Array.isArray(req.files.image)) {
                    const id = req.body.publicId || (0, uuid_1.v4)();
                    const imageFiles = req.files.image; // Type assertion not needed due to previous check
                    yield Promise.all(imageFiles.map((file, i) => __awaiter(this, void 0, void 0, function* () {
                        const filename = `product-${id}-${i + 1}`; // Ensure a unique filename
                        const resizedBuffer = yield (0, sharp_1.default)(file.buffer)
                            .resize(1000, 1000, {
                            fit: "cover",
                            position: "center",
                        })
                            .toFormat("jpeg")
                            .jpeg({ quality: 90 })
                            .toBuffer();
                        // Create a modified file object with required properties
                        const modifiedFile = Object.assign(Object.assign({}, file), { buffer: resizedBuffer, filename: filename });
                        // Assign the modified file object back to req.files.image[i]
                        req.files.image[i] = modifiedFile;
                    })));
                }
                next();
            }
            catch (error) {
                next(error);
            }
        });
        // Cloudinary Upload
        this.handleProductImagesUpload = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.files || !req.files.image)
                return next();
            try {
                const newImages = [];
                const newPublicIds = [];
                const oldImages = req.body.images || []; // Existing images from database
                yield Promise.all(req.files.image.map((image) => __awaiter(this, void 0, void 0, function* () {
                    const { secure_url, public_id } = (yield (0, cloudinary_controller_1.default)(image, "e-buy/products"));
                    newImages.push(secure_url);
                    newPublicIds.push(public_id);
                })));
                // Delete old images from Cloudinary that are not in newPublicIds
                const imagesToDelete = oldImages.filter((img) => {
                    const publicIdMatch = img.match(/upload\/(?:v\d+\/)?([^\\.]+)/);
                    const existingPublicId = publicIdMatch ? publicIdMatch[1] : null;
                    return existingPublicId && !newPublicIds.includes(existingPublicId);
                });
                yield Promise.all(imagesToDelete.map((imgUrl) => __awaiter(this, void 0, void 0, function* () {
                    const publicIdMatch = imgUrl.match(/upload\/(?:v\d+\/)?([^\\.]+)/);
                    const publicIdToDelete = publicIdMatch ? publicIdMatch[1] : null;
                    if (publicIdToDelete) {
                        // Delete image from Cloudinary
                        yield cloudinary_1.v2.uploader.destroy(publicIdToDelete);
                    }
                })));
                // Update req.body with new images and publicIds
                req.body.images = newImages;
                const regex = /[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-4[0-9A-Za-z]{3}-[89ABab][0-9A-Za-z]{3}-[0-9A-Za-z]{12}/;
                // Use regex.exec to extract the UUID and assign it to the public id in DB
                req.body.cloudinaryPublicId = regex.exec(newPublicIds[0])[0];
                next();
            }
            catch (error) {
                next(error);
            }
        });
        // this middleware will check if the product exist in case of creating and get the product id in case of updating
        // so we can use it on the image name
        this.checkProduct = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // If it's a POST request (creating a new product), return an error as the tour already exists
                if (req.method === "POST") {
                    const product = yield product_1.default.findOne({ name: req.body.name });
                    if (product)
                        return next(new error_1.default("A product with this name already exists.", 400));
                }
                if (["PUT", "PATCH"].includes(req.method)) {
                    // Retrieve the product based on the provided product ID.
                    const product = yield product_1.default.findById(req.params.id);
                    if (!product) {
                        // If Product does not exist, return an error
                        return next(new error_1.default("Product not found.", 404));
                    }
                    // If it's a PUT request (updating a product), pass the cloudinary publicId to the next middleware
                    req.body.publicId = product.cloudinaryPublicId;
                    // pass the product images to handle consistency with cloudinary
                    req.body.images = product.images;
                }
                next();
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = ProductController;

import { Express } from "express";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { UploadApiResponse } from "cloudinary";

const uploadImage = async (
  file: Express.Request["file"],
  folder: string,
): Promise<UploadApiResponse | undefined> => {
  if (!file) {
    throw new Error("No file provided");
  }

  return new Promise((resolve, reject) => {
    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // Use "auto" to automatically detect the type
        public_id: file.filename, // Use filename as public_id
      },
      (error, result) => {
        if (error) {
          reject(`Image upload failed: ${error}`);
        } else {
          resolve(result);
        }
      },
    );

    readableStream.pipe(uploadStream);
  });
};

export default uploadImage;

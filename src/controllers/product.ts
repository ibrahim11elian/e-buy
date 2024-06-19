import Product, { IProduct } from "../models/product/product";
import BaseController from "./base";

class ProductController extends BaseController<IProduct> {
  constructor() {
    super(Product);
  }

  createProduct = this.createOne;
  getProducts = this.getAll();
  getProduct = this.getOne();
  updateProduct = this.updateOne;
  deleteProduct = this.deleteOne;
}

export default ProductController;

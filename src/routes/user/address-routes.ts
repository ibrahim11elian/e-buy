import { Router } from "express";
import Authentication from "../../controllers/helpers/authentication";
import AddressController from "../../controllers/user/address";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const address = new AddressController();

router
  .route("/")
  .all(auth.protect)
  .post(address.createAddress)
  .get(address.getAddress)
  .delete(address.deleteAddress);

export default router;

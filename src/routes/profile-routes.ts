import { Router } from "express";
import Authentication from "../controllers/authentication";
import ProfileController from "../controllers/profile";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const profile = new ProfileController();

router
  .route("/")
  .all(auth.protect)
  .get(profile.getProfile)
  .patch(profile.updateProfile);

export default router;

import { Router } from "express";
import Authentication from "../../controllers/helpers/authentication";
import ProfileController from "../../controllers/user/profile";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const profile = new ProfileController();

router.route("/").all(auth.protect).get(profile.getProfile).patch(
  profile.uploadUserPhoto,
  profile.resizeUserPhoto,
  profile.handleUploadUserImage, // upload to cloudinary
  profile.updateProfile,
);

export default router;

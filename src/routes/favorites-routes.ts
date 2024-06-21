import { Router } from "express";
import Authentication from "../controllers/authentication";
import FavoritesController from "../controllers/favorites";

const router = Router({
  mergeParams: true,
});
const auth = new Authentication();
const favorite = new FavoritesController();

router.use(auth.protect);

router
  .route("/")
  .post(favorite.addFavorite)
  .get(favorite.getFavorites)
  .delete(favorite.deleteAllFavorites);

router.delete("/:productId", favorite.deleteFavorite);

export default router;

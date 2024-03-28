import {Router} from "express";
import {registerUser,loginUser,logoutUser} from "../controllers/user.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([{
        name: "image",
        maxCount:1
    }]),
    registerUser
)

router.route("/login").post(
    (req,res,next) =>{
        next();
    },
    loginUser
)

router.route("/logout").post(verifyJWT,logoutUser);

export default router
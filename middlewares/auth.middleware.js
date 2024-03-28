import  jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"

export const verifyJWT = async(req,_,next)=>{
    try {
       const token  =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
       if(!token){
        const error = new Error("Unauthorized request");
         error.status = 401;
        throw error;
       }

       const decodedToken =jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

       const user = await User.FindById(decodedToken?._id).select("-password -refreshToken")
      if(!user){
        const error = new Error("Invalid Access Token");
         error.status = 401;
        throw error;
      }

      req.user =user;
      next();
    } catch (error) {
        throw error;
    }
}
import {User} from "../models/user.model.js"
import {deleteFromCloudinary,uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import nodemailer from "nodemailer"



const app = express();

const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.USERNAME,
      pass: process.env.PASSWORD
    }
  });

const generateAccessandrefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        if(!user){
            const error = new Error("User Not Found");
            error.status = 404;
             throw error;  
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken,refreshToken};
    } catch (error) {
        throw error
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if ([name, email, password].some((field) => field?.trim() === "")) {
            throw new Error("All fields are required");
        }

        const existedUser = await User.findOne({ email });
        if (existedUser) {
            throw new Error("Email already registered.");
        }

        const imageLocalPath = req.files?.image[0]?.path;

        if (!imageLocalPath) {
            throw new Error("Image is required");
        }

        const image = await uploadOnCloudinary(imageLocalPath);

        if (!image) {
            throw new Error("Failed to upload image");
        }

        const user = await User.create({
            name,
            email,
            password,
            image: image.url,
            isverified: false
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new Error("Failed to create user");
        }

        const { accessToken, refreshToken } = await generateAccessandrefreshToken(user._id);

        const verificationLink = `/verify/${accessToken}`;
        await transporter.sendMail({
            from: 'pathakyashwardhan54@gmail.com',
            to: email,
            subject: 'Verify Your Email Address',
            html: `Click <a href="${verificationLink}">here</a> to verify your email address.`
        });

        res.status(200).json({ message: 'User registered successfully. Please verify your email address.' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Failed to register user.' });
    }
};



  app.get('/verify/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(404).json({ message: 'Invalid verification token.' });
      }
  
      // Update user's verified field and remove verification token
      user.isverified = true;
      user.accessToken = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Email verified successfully.' });
    } catch (err) {
      console.error('Error verifying email:', err);
      res.status(500).json({ message: 'Failed to verify email.' });
    }
  });

  const loginUser = async (req, res) => {
    
    const {email,password} = req.body

    
    if(!email){
        throw new Error(400, "email is required")
    }

   
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error(404, "User does not exist")
    }
    
    if (!user.isverified) {
        return res.status(401).json({ message: "Email not verified. Please verify your email address." });
    }

    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new Error(401, "Password invalid")
    }
    
    //access and refresh token generate
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //send cookie
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

}

const logoutUser= async(req,res)=>{
    await User.findByIdAndUpdate(
       req.user._id,
       {
           $unset: {
               refreshToken: 1
           }
       },
       {
           new: true
       }
     )
     const options = {
       httpOnly: true,
       secure: true
     }
   
     return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json({ status: 200, data: {}, message: "User logged out" });
    }
   

module.exports = { registerUser,loginUser,logoutUser };

    
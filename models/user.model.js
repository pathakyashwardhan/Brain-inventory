import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(

    {
      name: {
         type: String,
         required: true,
        trim: true,
        index:true
        } ,

    email:{
        type:String,
        required: true,
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true, 'password is required']
    },
    image:{
      type: String,
      required:true
    },
    refreshToken:{
        type:String
    },
    isverified:{
        type:Boolean,
        default:false
    }

    },{
        timestamps: true
    }
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
return jwt.sign({
    _id: this._id,
    email:this.email,
    name:this.name,
},
process.env.ACCESS_TOKEN_SECRET,
{
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
}

)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({

        _id:this._id,
    },
   process.env.REFRESH_TOKEN_SECRET,
   {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
   } 
    )
}

export const user = mongoose.model("User",userSchema)
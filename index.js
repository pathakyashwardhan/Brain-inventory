import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path: 'C:\Users\yashwardhan\Desktop\New folder\.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`server is starting at port : ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.log("MONOGODB connection is failed",err);
})
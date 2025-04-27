import { db } from "../libs/db.js";

import jwt from "jsonwebtoken";

import { ApiError } from "../utils/ApiError.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.jwt ||
            req.header("Authorization")?.replace("Bearer ", "")

            

        if(!token){
            throw new ApiError(401, "Invalid User Token")
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // console.log(`Hey this is User decodedToken: ${decodedToken}`);

        const user = await db.user.findUnique({
            where:{
                id:decodedToken.id
            },
            select:{
                id:true,
                image:true,
                name:true,
                email:true,
                role:true
            },
        })

        if(!user){
            throw new ApiError(404, "User not found")
        }
         req.user = user;

         next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid User Token")
    }

})


export { verifyJWT };
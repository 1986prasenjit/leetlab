import { asyncHandler } from "../utils/asyncHandler.js";

import { db } from "../libs/db.js";

import { ApiError } from "../utils/ApiError.js";


import { ApiResponse } from "../utils/ApiResponse.js"

import bcrypt from "bcryptjs";

import { UserRole } from "../generated/prisma/index.js";

import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
    //get the data from the req.body
    const { name, email, password } = req.body;

    //validate the data 
    if (
        [name, email, password].some((field) => field.trim() === "")
    ) {
        throw new ApiError(401, "All fields are required to proceed")
    }

    //check if the user already exits
    const existingUser = await db.user.findUnique({
        where: {
            email
        }
    })

    //if yes throw an error
    if (existingUser) {
        throw new ApiError(400, "Name or Email already exists")
    }

    // Hash the password before saving the user to db
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user in db
    const newUser = await db.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: UserRole.USER,
        }
    })

    //create a jwt token
    const token = jwt.sign(
        {
            id: newUser.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY
        }
    )

    //options for cookie Parse 
    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }

    res.cookie("jwt", token, options);


    res.status(201)
        .json(
            new ApiResponse(200, newUser, "User Registered Successfully")
        )

})

export { registerUser };


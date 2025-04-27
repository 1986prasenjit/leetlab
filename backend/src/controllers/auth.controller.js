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
            new ApiResponse(200,
                newUser,
                true,
                "User Registered Successfully")
        )

})

const loginUser = asyncHandler(async (req, res) => {
    //get the data from req.body
    const { email, password } = req.body;

    //verify the data 
    if (
        [email, password].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required to proceed")
    }

    //Check the user present in the db
    const user = await db.user.findUnique({
        where: {
            email
        }
    })

    if (!user) {
        throw new ApiError(401, "User credentials doesnot exits")
    }

    //match the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid User credentials")
    }

    const token = jwt.sign(
        {
            id: user.id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }

    res.cookie("jwt", token, options);

    res.status(200)
        .json(
            new ApiResponse(200,
                user,
                true,
                "User LoggedIn Successfully")
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("jwt", options)
            .json(
                new ApiResponse(200,"User Logged Out Successfully",{})
            )
    } catch (error) {
        throw new ApiError(401,false, error?.message || "Invalid User Credentials")
    }
})


export { registerUser, loginUser, logoutUser };


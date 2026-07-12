import { User } from "../model/user.model.js"
import jwt from "jsonwebtoken"

const registerUser = async (req,res) => {
    try {
        const {email,password,username,fullName,age} = req.body

        if(!email || !password || !username || !fullName || !age){
            return res.status(400).json({message: "Some of the required fields are missing!"})
        }

        const exist_email = await User.findOne({
            email: email.toLowerCase()
        })

        const exist_usr = await User.findOne({
            username: username.toLowerCase()
        })

        if(exist_email){
            return res.status(400).json({message: "Email already registerd!"})  
        }

        if(exist_usr){
            return res.status(400).json({message: "Username Already Taken!"})
        }

        const user = await User.create({
            username: username.toLowerCase(),
            password,
            role: "user",
            email: email.toLowerCase(),
            fullName: fullName,
            age: age
        })

        res.status(201).json({
            message: "User Registerd",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                username: user.username, 
                name: user.fullName,
                age: user.age
            }
        })
        
    } catch (error) {
        res.status(500).json({message: "Internal Server Error",error: error.message})
    }
}

const loginUser = async (req,res) => {
    try {
        const {email,password} = req.body

        const user = await User.findOne({
            email: email.toLowerCase()
        })

        if(!user){
            return res.status(404).json({message: "User not found!"})
        }

        const isMatch = await user.comparePassword(password)
        if(!isMatch){
            return res.status(401).json({message: "Invalid Credentials"})
        }

        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        }

        const token = jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '1h'
        })

        res.cookie('token',token,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000
        })

        res.status(200).json({message: "Login Successfull!",
            user: {id: user._id,email: user.email}
        })

    } catch (error) {
        res.status(500).json({message: "Internal Server Error",error: error.message})
    }

}

export {registerUser,loginUser}
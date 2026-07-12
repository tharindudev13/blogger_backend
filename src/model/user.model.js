import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minLength: 6,
            maxLength: 50
        },
        role:{
            type: String,
            required: true,
            lowercase: true
        },
        fullName: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true
        } 

    },{
        timestamps: true
    }
)

userSchema.pre("save", async function () {
    if(!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password,12)
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model("User",userSchema)
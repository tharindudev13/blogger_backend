import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
    {
        authorId: {
            type: String,
            required: true
        },
        authorName: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        likes: {
            type: Array,
            default: []
        },
        comments: {
            type: Array,
            default: []
        }
    },
    {
        timestamps:true
    }
)

export const Post = mongoose.model("Post",postSchema)
import { Post } from "../model/post.model.js"
import { User } from "../model/user.model.js"

const createPost = async (req, res) => {
    try {
        const { title, content } = req.body

        const author = await User.findById(req.user.id)
        const authorName = author.fullName

        if (!title || !content) {
            return res.status(400).json({ message: "Both title and content are required!" })
        }

        const post = await Post.create({
            title: title,
            content: content,
            authorId: req.user.id,
            authorName: authorName
        })

        res.status(201).json({
            message: "Post created!",
            post: {
                id: post._id,
                author: post.authorName,
                title: post.title,
                content: post.content
            }
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const likePost = async (req, res) => {
    try {
        const { postId } = req.params
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ message: "Post not found!" })
        }

        if (!post.likes.includes(req.user.id)) {
            post.likes.push(req.user.id)
        } else {
            post.likes = post.likes.filter(userId => userId !== req.user.id)
        }

        await post.save()

        res.status(200).json({
            message: "Post liked!"
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const commentPost = async (req, res) => {
    try {
        const { postId } = req.params
        const { comment } = req.body
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ message: "Post not found!" })
        }

        post.comments.push({
            userId: req.user.id,
            comment: comment,
            fullName: req.user.fullName
        })
        await post.save()

        res.status(200).json({
            message: "Comment added!"
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const deletePost = async (req, res) => {
    try {
        const { postId } = req.params

        const post = await Post.findById(postId)

        if (!post.authorId === req.user._id) {
            return res.status(403).json({ message: "You are not allowed to do this" })
        }
        await post.deleteOne()

        res.status(200).json({
            message: "Post deleted"
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
        res.status(200).json({
            message: "Posts retrieved!",
            posts: posts
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const getPostById = async (req, res) => {
    try {
        const { postId } = req.params
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ message: "Post not found!" })
        }
        res.status(200).json({
            message: "Post retrieved!",
            post: post
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const updatePost = async (req, res) => {
    try {
        const { postId } = req.params
        const { title, content } = req.body

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ message: "Post not found!" })
        }

        if (!post.authorId === req.user._id) {
            return res.status(403).json({ message: "You are not allowed to do this" })
        }

        post.title = title
        post.content = content

        await post.save()

        res.status(200).json({
            message: "Post updated!"
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const editcomment = async (req, res) => {
    try {
        const { postId, commentId } = req.params
        const { comment } = req.body

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ message: "Post not found!" })
        }

        const commentToUpdate = post.comments.id(commentId)

        if (!commentToUpdate) {
            return res.status(404).json({ message: "Comment not found!" })
        }

        if (!commentToUpdate.userId === req.user._id) {
            return res.status(403).json({ message: "You are not allowed to do this" })
        }

        commentToUpdate.comment = comment

        await post.save()

        res.status(200).json({
            message: "Comment updated!"
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const deletecomment = async (req, res) => {
    try {
        const { postId, commentId } = req.params
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ message: "Post not found!" })
        }

        const commentToDelete = post.comments.id(commentId)

        if (!commentToDelete) {
            return res.status(404).json({ message: "Comment not found!" })
        }

        if (!commentToDelete.userId === req.user._id) {
            return res.status(403).json({ message: "You are not allowed to do this" })
        }

        commentToDelete.remove()

        await post.save()

        res.status(200).json({
            message: "Comment deleted!"
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.body

        const posts = await Post.find({ authorId: userId })

        res.status(200).json({
            message: "Posts retrieved!",
            posts
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

export { createPost, likePost, commentPost, deletePost, getAllPosts, getPostById, updatePost, editcomment, deletecomment, getPostsByUser }
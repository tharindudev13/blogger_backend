import { Router } from "express";
import { commentPost, createPost, deletecomment, deletePost, editcomment, getAllPosts, getPostById, getPostsByUser, likePost, updatePost } from "../controller/post.controller.js";
import { authenticateToken } from "../middleware/authToken.js";
import { authorizeRoles } from "../middleware/authRoles.js";

const router = Router()

router.route('/create').post(
    authenticateToken,
    authorizeRoles('user'),
    createPost
)
router.route('/like/:postId').post(
    authenticateToken,
    authorizeRoles('user'),
    likePost
)
router.route('/comment/:postId').post(
    authenticateToken,
    authorizeRoles('user'),
    commentPost
)
router.route('/comment/:postId/:commentId').put(
    authenticateToken,
    authorizeRoles('user'),
    editcomment
)
router.route('/all').get(getAllPosts)

router.route('/post/:postId').get(
    authenticateToken,
    authorizeRoles('user'),
    getPostById
)

router.route('/update/:postId').put(
    authenticateToken,
    authorizeRoles('user'),
    updatePost
)

router.route('/delete/:postId').delete(
    authenticateToken,
    authorizeRoles('user'),
    deletePost
)

router.route('/comment/:postId/:commentId').put(
    authenticateToken,
    authorizeRoles('user'),
    editcomment
)

router.route('/comment/:postId/:commentId').delete(
    authenticateToken,
    authorizeRoles('user'),
    deletecomment
)

router.route('/user-posts').get(
    authenticateToken,
    authorizeRoles('user'),
    getPostsByUser
)

export default router
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { DB_NAME } from "../src/config/constants.js";
import { Post } from "../src/model/post.model.js";
import { User } from "../src/model/user.model.js";

const authState = vi.hoisted(() => ({
  user: null
}))

vi.mock("../src/middleware/authRoles.js", () => {
  return {
    authorizeRoles: () => {
      return (req, res, next) => {
        next();
      };
    }
  }
})

vi.mock("../src/middleware/authToken.js", () => {
  return {
    authenticateToken: (req, res, next) => {
      req.user = authState.user;
      next();
    }
  }
})

const { default: app } = await import("../src/app.js")

const DB_URI = process.env.MONGODB_URI
const TEST_TITLE_PREFIX = "POST_TEST_"
const TEST_EMAIL_SUFFIX = "@post-tests.local"

let primaryUser
let secondaryUser
let primaryPost
let secondaryPost
let commentPost
let commentId

const cleanupTestData = async () => {
  await Post.deleteMany({ title: { $regex: /^POST_TEST_/ } })
  await User.deleteMany({ email: { $regex: /@post-tests\.local$/ } })
}

const setActiveUser = (user) => {
  authState.user = {
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role
  }
}

const createTestUser = async (label, role = "user") => {
  const uniqueSuffix = randomUUID().replace(/-/g, "")

  return await User.create({
    username: `post_${label}_${uniqueSuffix}`,
    email: `post_${label}_${uniqueSuffix}${TEST_EMAIL_SUFFIX}`,
    password: "password123",
    role,
    fullName: `${label} User`,
    age: 25
  })
}

const seedFixtures = async () => {
  await cleanupTestData()

  primaryUser = await createTestUser("primary")
  secondaryUser = await createTestUser("secondary")
  setActiveUser(primaryUser)

  primaryPost = await Post.create({
    authorId: primaryUser._id.toString(),
    authorName: primaryUser.fullName,
    title: `${TEST_TITLE_PREFIX}PRIMARY`,
    content: "Primary content",
    likes: [],
    comments: []
  })

  secondaryPost = await Post.create({
    authorId: secondaryUser._id.toString(),
    authorName: secondaryUser.fullName,
    title: `${TEST_TITLE_PREFIX}SECONDARY`,
    content: "Secondary content",
    likes: [primaryUser._id.toString()],
    comments: []
  })

  commentId = new mongoose.Types.ObjectId()
  commentPost = await Post.create({
    authorId: primaryUser._id.toString(),
    authorName: primaryUser.fullName,
    title: `${TEST_TITLE_PREFIX}COMMENT`,
    content: "Comment content",
    likes: [],
    comments: [
      {
        _id: commentId,
        userId: primaryUser._id.toString(),
        fullName: primaryUser.fullName,
        comment: "Original comment"
      }
    ]
  })
}

describe("post controller routes", () => {
  beforeAll(async () => {
    await mongoose.connect(DB_URI, { dbName: DB_NAME })
  })

  beforeEach(async () => {
    await seedFixtures()
  })

  afterAll(async () => {
    try {
      await cleanupTestData()
    } finally {
      await mongoose.connection.close()
    }
  })

  describe("post/create", () => {
    it("creates a post when title and content are provided", async () => {
      const response = await request(app)
        .post("/api/v1/post/create")
        .send({
          title: `${TEST_TITLE_PREFIX}NEW`,
          content: "Test content"
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toMatch(/created/i)
      expect(response.body.post).toMatchObject({
        title: `${TEST_TITLE_PREFIX}NEW`,
        content: "Test content",
        author: primaryUser.fullName
      })
    })

    it("returns 400 when title is missing", async () => {
      const response = await request(app)
        .post("/api/v1/post/create")
        .send({
          content: "Test content"
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/required/i)
    })

    it("returns 400 when content is missing", async () => {
      const response = await request(app)
        .post("/api/v1/post/create")
        .send({
          title: `${TEST_TITLE_PREFIX}NO_CONTENT`
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/required/i)
    })
  })

  describe("post/like/:postId", () => {
    it("adds a like when the current user has not liked the post", async () => {
      const response = await request(app)
        .post(`/api/v1/post/like/${primaryPost._id}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/liked/i)

      const updatedPost = await Post.findById(primaryPost._id)
      expect(updatedPost.likes.map(String)).toContain(primaryUser._id.toString())
    })

    it("removes a like when the current user already liked the post", async () => {
      const response = await request(app)
        .post(`/api/v1/post/like/${secondaryPost._id}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/liked/i)

      const updatedPost = await Post.findById(secondaryPost._id)
      expect(updatedPost.likes.map(String)).not.toContain(primaryUser._id.toString())
    })

    it("returns 404 when the post does not exist", async () => {
      const response = await request(app)
        .post(`/api/v1/post/like/${new mongoose.Types.ObjectId()}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/found/i)
    })
  })

  describe("post/comment/:postId", () => {
    it("adds a comment when the post exists and comment text is provided", async () => {
      const response = await request(app)
        .post(`/api/v1/post/comment/${primaryPost._id}`)
        .send({
          comment: "TEST_COMMENT"
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/comment/i)

      const updatedPost = await Post.findOne({ title: primaryPost.title })
      expect(updatedPost.comments).toHaveLength(1)
      expect(updatedPost.comments[0].comment).toBe("TEST_COMMENT")
    })

    it("returns 404 when the post does not exist", async () => {
      const response = await request(app)
        .post(`/api/v1/post/comment/${new mongoose.Types.ObjectId()}`)
        .send({
          comment: "TEST_COMMENT"
        })

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/found/i)
    })

    it("returns 400 when comment text is empty", async () => {
      const response = await request(app)
        .post(`/api/v1/post/comment/${primaryPost._id}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/empty/i)
    })
  })

  describe("post/all", () => {
    it("returns all posts sorted by newest first", async () => {
      const response = await request(app)
        .get("/api/v1/post/all")

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/retrieved/i)

      const titles = response.body.posts.map(post => post.title)
      expect(titles).toEqual(expect.arrayContaining([
        primaryPost.title,
        secondaryPost.title,
        commentPost.title
      ]))

      for (let index = 1; index < response.body.posts.length; index += 1) {
        const previousCreatedAt = new Date(response.body.posts[index - 1].createdAt).getTime()
        const currentCreatedAt = new Date(response.body.posts[index].createdAt).getTime()

        expect(previousCreatedAt).toBeGreaterThanOrEqual(currentCreatedAt)
      }
    })
  })

  describe("post/post/:postId", () => {
    it("returns a post when the id exists", async () => {
      const response = await request(app)
        .get(`/api/v1/post/post/${primaryPost._id}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/retrieved/i)
      expect(response.body.post.title).toBe(primaryPost.title)
    })

    it("returns 404 when the post is missing", async () => {
      const response = await request(app)
        .get(`/api/v1/post/post/${new mongoose.Types.ObjectId()}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/found/i)
    })
  })

  describe("post/update/:postId", () => {
    it("updates the post when the current user is the owner", async () => {
      const response = await request(app)
        .put(`/api/v1/post/update/${primaryPost._id}`)
        .send({
          title: `${TEST_TITLE_PREFIX}UPDATED`,
          content: "Updated content"
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/updated/i)

      const updatedPost = await Post.findById(primaryPost._id)
      expect(updatedPost.title).toBe(`${TEST_TITLE_PREFIX}UPDATED`)
      expect(updatedPost.content).toBe("Updated content")
    })

    it("returns 403 when a different user tries to update the post", async () => {
      setActiveUser(secondaryUser)

      const response = await request(app)
        .put(`/api/v1/post/update/${primaryPost._id}`)
        .send({
          title: `${TEST_TITLE_PREFIX}SHOULD_NOT_SAVE`,
          content: "Nope"
        })

      expect(response.status).toBe(403)
      expect(response.body.message).toMatch(/allowed/i)

      const untouchedPost = await Post.findById(primaryPost._id)
      expect(untouchedPost.title).toBe(primaryPost.title)
    })

    it("returns 404 when the post does not exist", async () => {
      const response = await request(app)
        .put(`/api/v1/post/update/${new mongoose.Types.ObjectId()}`)
        .send({
          title: `${TEST_TITLE_PREFIX}MISSING`,
          content: "Missing"
        })

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/found/i)
    })
  })

  describe("post/comment/:postId/:commentId", () => {
    it("updates an existing comment when the author matches", async () => {
      const response = await request(app)
        .put(`/api/v1/post/comment/${commentPost._id}/${commentId}`)
        .send({
          comment: "Updated comment"
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/updated/i)

      const updatedPost = await Post.findById(commentPost._id)
      expect(updatedPost.comments[0].comment).toBe("Updated comment")
    })

    it("returns 404 when the comment does not exist", async () => {
      const response = await request(app)
        .put(`/api/v1/post/comment/${commentPost._id}/${new mongoose.Types.ObjectId()}`)
        .send({
          comment: "Updated comment"
        })

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/comment/i)
    })

    it("returns 403 when another user tries to edit the comment", async () => {
      setActiveUser(secondaryUser)

      const response = await request(app)
        .put(`/api/v1/post/comment/${commentPost._id}/${commentId}`)
        .send({
          comment: "Should not save"
        })

      expect(response.status).toBe(403)
      expect(response.body.message).toMatch(/allowed/i)

      const untouchedPost = await Post.findById(commentPost._id)
      expect(untouchedPost.comments[0].comment).toBe("Original comment")
    })
  })

  describe("post/delete/:postId", () => {
    it("deletes a post when the current user is the owner", async () => {
      const response = await request(app)
        .delete(`/api/v1/post/delete/${primaryPost._id}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/deleted/i)

      const deletedPost = await Post.findById(primaryPost._id)
      expect(deletedPost).toBeNull()
    })

    it("returns 403 when a different user tries to delete the post", async () => {
      setActiveUser(secondaryUser)

      const response = await request(app)
        .delete(`/api/v1/post/delete/${primaryPost._id}`)

      expect(response.status).toBe(403)
      expect(response.body.message).toMatch(/allowed/i)

      const untouchedPost = await Post.findById(primaryPost._id)
      expect(untouchedPost).not.toBeNull()
    })

    it("returns 404 when the post does not exist", async () => {
      const response = await request(app)
        .delete(`/api/v1/post/delete/${new mongoose.Types.ObjectId()}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/found/i)
    })
  })

  describe("post/comment/:postId/:commentId delete", () => {
    it("deletes a comment when the current user is the author", async () => {
      const originalPost = await Post.findById(commentPost._id)
      const originalCommentCount = originalPost.comments.length
      const response = await request(app)
        .delete(`/api/v1/post/comment/${commentPost._id}/${commentId}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/deleted/i)

      const updatedPost = await Post.findById(commentPost._id)
      expect(updatedPost.comments).toHaveLength(originalCommentCount - 1)
    })

    it("returns 403 when a different user tries to delete the comment", async () => {
      setActiveUser(secondaryUser)
      const originalPost = await Post.findById(commentPost._id)
      const originalCommentCount = originalPost.comments.length
      const response = await request(app)
        .delete(`/api/v1/post/comment/${commentPost._id}/${commentId}`)

      expect(response.status).toBe(403)
      expect(response.body.message).toMatch(/allowed/i)

      const untouchedPost = await Post.findById(commentPost._id)
      expect(untouchedPost.comments).toHaveLength(originalCommentCount)
    })

    it("returns 404 when the comment does not exist", async () => {
      const response = await request(app)
        .delete(`/api/v1/post/comment/${commentPost._id}/${new mongoose.Types.ObjectId()}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toMatch(/comment/i)
    })
  })

  describe("post/user-posts", () => {
    it("returns posts authored by the requested user", async () => {
      const response = await request(app)
        .get("/api/v1/post/user-posts")
        .send({
          userId: primaryUser._id.toString()
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toMatch(/retrieved/i)
      expect(response.body.posts).toHaveLength(2)
      expect(response.body.posts.every(post => post.authorId === primaryUser._id.toString())).toBe(true)
    })
  })
})


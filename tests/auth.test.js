import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import app from "../src/app"
import request from "supertest"
import { loginUser } from "../src/controller/auth.controller"
import mongoose from "mongoose"
import { DB_NAME } from "../src/config/constants"
import dotenv from 'dotenv'
import { User } from "../src/model/user.model"

dotenv.config()

const BACKEND_URL = 'http://localhost:4000'

describe('Auth/login', () => {

    beforeAll(async () => {
        const DB_URI = 'mongodb://vibedigitallk_db_user:uom0310kt@ac-mnaw8gp-shard-00-00.p1kgxhh.mongodb.net:27017,ac-mnaw8gp-shard-00-01.p1kgxhh.mongodb.net:27017,ac-mnaw8gp-shard-00-02.p1kgxhh.mongodb.net:27017/?ssl=true&replicaSet=atlas-pcgehc-shard-0&authSource=admin&appName=edusource'
        await mongoose.connect(`${DB_URI}`,{dbName: DB_NAME})
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })
    
  it('should respond with a 200 status code when email and password is correct', async () => {
    const response = await request(app)
        .post('/api/v1/auth/login').send({
        email: "tharindu@gmail.com",
        password: "dev813"
    })
    expect(response.status).toBe(200)
    expect(response.body.user).toHaveProperty('id')
    expect(response.body.user).toHaveProperty('email')
    expect(response.body.user).toHaveProperty('username')
  })

  it('should respond with a 404 status code when email is incorrect', async () => {
    const response = await request(app)
        .post('/api/v1/auth/login').send({
        email: "incorrect@gmail.com",
        password: "dev813"
    })
    expect(response.status).toBe(404)
    expect(response.body.message).toBe('User not found!')
  })

  it('should response with a 401 status code when password is incorrect',async () => {
    const response = await request(app)
     .post('/api/v1/auth/login').send({
        email: "tharindu@gmail.com",
        password: "dev81"
    })
    expect(response.status).toBe(401)
    expect(response.body.message).toMatch('Invalid Credentials')
  })

  it('should response with a 500 status code when password is not given', async () => {
    const response = await request(app)
     .post('/api/v1/auth/login').send({
        email: "tharindu@gmail.com"
    })

    expect(response.status).toBe(500)
    expect(response.body.error).toMatch(/required/i)
  })

  it('should response with a 500 status code when email is not given', async () => {
    const response = await request(app)
     .post('/api/v1/auth/login').send({
      password: "12345"
    })

    expect(response.status).toBe(500)
    expect(response.body.error).toMatch(/undefined/i)
  })

  it('should response with a 500 status code when email and password are not given', async () => {
    const response = await request(app)
     .post('/api/v1/auth/login').send({})

    expect(response.status).toBe(500)
    expect(response.body.error).toMatch(/undefined/i)
  })

})

describe('auth/register',() => {
  beforeAll(async () => {
        const DB_URI = 'mongodb://vibedigitallk_db_user:uom0310kt@ac-mnaw8gp-shard-00-00.p1kgxhh.mongodb.net:27017,ac-mnaw8gp-shard-00-01.p1kgxhh.mongodb.net:27017,ac-mnaw8gp-shard-00-02.p1kgxhh.mongodb.net:27017/?ssl=true&replicaSet=atlas-pcgehc-shard-0&authSource=admin&appName=edusource'
        await mongoose.connect(`${DB_URI}`,{dbName: DB_NAME})
        
    })

    afterAll(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@testmail\.com$/ } });
      console.log("🧹 Test users cleaned up successfully.");
    } catch (error) {
      console.error("❌ Failed to clean up test users:", error);
    } finally {
      await mongoose.connection.close();
    }
  })
  

  it('should create a new user when all fields are given', async () => {
    const response = await request(app)
     .post('/api/v1/auth/register').send({
        email: "tharindu@testmail.com",
        password: "testpassword",
        username: "testuser",
        fullName: "Test User",
        age: 20
    })

    expect(response.status).toBe(201)
    expect(response.body.user).toBeDefined()
    expect(response.body.user.role).toBe('user')
    expect(response.body.user.password).not.toBe("testpassword")
  })

  it('should response with a 400 status code when one required field is missing', async () => {
    const response = await request(app)
     .post('/api/v1/auth/register').send({
        email: "tharindu@testmail.com",
        password: "testpassword",
        username: "testuser",
        fullName: "Test User",
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/missing/i)
  })

  it('should response with a 400 status code when email is already registered', async () => {
    const response = await request(app)
     .post('/api/v1/auth/register').send({
        email: "tharindu@testmail.com",
        password: "testpassword",
        username: "testuser1",
        fullName: "Test User",
        age: 20
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/Email/i)
  })

  it('should response with a 400 status code when username is already taken', async () => {
    const response = await request(app)
     .post('/api/v1/auth/register').send({
        email: "testuser@testmail.com",
        password: "testpassword",
        username: "testuser",
        fullName: "Test User",
        age: 20
    })

    console.log(response.body.error);
    
    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/Username/i)
  })
})
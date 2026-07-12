import cookieParser from "cookie-parser"
import express from "express"
import authRouter from "./routes/auth.route.js"
import postRouter from "./routes/post.route.js"

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/post",postRouter)

export default app
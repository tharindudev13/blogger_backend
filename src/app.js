import cookieParser from "cookie-parser"
import express from "express"
import authRouter from "./routes/auth.route.js"
import postRouter from "./routes/post.route.js"
import cors from "cors"
import { FRONTEND_URL } from "./config/constants.js"

const app = express()

const corsOptions = {
    origin: FRONTEND_URL, 
    optionsSuccessStatus: 200,
    credentials: true 
};

app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/post",postRouter)

export default app
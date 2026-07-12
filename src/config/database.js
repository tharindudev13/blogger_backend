import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(
            `${process.env.MONGODB_URI}`,
            {dbName: DB_NAME}
        )
        console.log(`\n MongoDB Connected !!!
            \n${conn.connection.host}`)
    } catch (error) {
        console.log("MongoDb connection failed",error);
        process.exit(1)
    }
}

export default connectDb
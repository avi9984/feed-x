import "dotenv/config";
import app from "./app.js";
import connectDb from "./db/dbConfig.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    await connectDb();

    app.listen(PORT, () => {
        console.log(`Server listen on port http://localhost:${PORT}`);
    })
}

startServer();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';


const app = express();


app.use(express.json());
app.use(cors('*'));
app.use(morgan('dev'));
app.use(helmet());



// Health Check
app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Feed-X news api"
    });
});

export default app;
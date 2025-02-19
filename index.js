import 'dotenv/config'
import express from "express"
import passport from "passport";
import session from "express-session";
import { connectDB } from './config/dbConnection.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from "swagger-ui-express";
import swaggerData from "./swagger.json" assert { type: "json" };



// Middlewares
import errorMiddleware from './middleware/errorMiddleware.js';


// Routers
import authRoutes from './routes/authRoutes.js';
import urlRoutes from "./routes/urlRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// Controller
import { redirectToOriginalUrl } from './controllers/urlController.js';

// -----------defining port------------------
const port = process.env.PORT || 3001;


// -----------------Creating server-------------------
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

//------------------Connecting to DB------------------
connectDB();


// -----------------Application session--------------
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Secure: false for development
})
);

app.use(passport.initialize());
app.use(passport.session());


// Trust proxy in production
app.set('trust proxy', 1);


//----------------Routes------------------------
app.use("/auth", authRoutes);
app.use("/url", urlRoutes);
app.use("/analytics", analyticsRoutes);

// Redirect url
app.get("/:shortId", redirectToOriginalUrl);

app.get("/health/test", (req, res) => {
    res.json({
        message: "Every thing is working fine"
    })
})

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "This is an url-shortener backend application, developed by Abhishek Oraon."
    })
})


app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerData));

//--------------Error Middleware----------------
app.use(errorMiddleware);

//-------------Listening to server port---------------
app.listen(port, () => {
    console.log(`Application running on port: ${port}`);
})


import express from "express";
import { generateNewShortURL } from "../controllers/urlController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import { reteLimiting } from "../middleware/rateLimitingMiddleware.js";

const router = express.Router();

// generate short url route
router.post("/short", reteLimiting, isAuthenticated, generateNewShortURL);

// redirect route is in the index.




export default router;


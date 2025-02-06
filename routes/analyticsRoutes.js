import express from "express";
import { getAnayticsSpecificUrl, getOverallAnaytics, getTopicAnalytics } from "../controllers/analyticsController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";



const router = express.Router();


// Analytics for specific url
router.get("/:shortId", isAuthenticated, getAnayticsSpecificUrl);

// Analytics for specific topic
router.get("/topic/:topic", isAuthenticated, getTopicAnalytics);

// Analytics for overall urls
router.get("/overall/urldata", isAuthenticated, getOverallAnaytics);



export default router;
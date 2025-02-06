import express from "express";
import passport from "../controllers/authController.js";


const router = express.Router();


// Route to initiate google Oauth login
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"],
}));


// Google OAuth callback route
router.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "https://url-shortener-app-production.up.railway.app/auth/login-failed" }),
    (req, res) => {
        res.redirect("https://url-shortener-app-production.up.railway.app/auth/success");
    }
);


// Route for login success
router.get("/success", (req, res, next) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            message: "Login successful",
            user: req.user,
        });
        next(user)
    } else {
        res.status(401).json({
            success: false,
            message: "Unauthorized, login failed.",
        });
    }
});



// Route for login failed
router.get("/login-failed", (req, res) => {
    res.status(401).json({
        success: false,
        message: "Login failed.",
    });
});


router.get("/profile", (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            user: req.user, // Should contain the authenticated user
        });
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
});



// Route for logout
router.get("/logout", (req, res) => {
    // Ensure req.logout exists
    if (req.logout) {
        req.logout((error) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Logout failed.",
                });
            }
            req.session.destroy(() => {
                res.clearCookie("connect.sid"); // Clears the session cookie
                res.json({
                    success: true,
                    message: "Logout successful.",
                });
            });
        });
    } else {
        res.status(400).json({
            success: false,
            message: "User not logged in.",
        });
    }
});



export default router;
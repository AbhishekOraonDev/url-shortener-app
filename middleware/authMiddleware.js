// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
    // console.log("User: ",req.user);
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized: Please log in to access this resource." });
};

// Middleware to check if user is authorized (May add it later for roles)
export const isAuthorized = (roles) => {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Unauthorized: Please log in." });
        }

        // Assuming the user's role is stored in `req.user.role`
        if (roles.includes(req.user.role)) {
            return next();
        }

        res.status(403).json({ message: "Forbidden: You do not have the required permissions." });
    };
};

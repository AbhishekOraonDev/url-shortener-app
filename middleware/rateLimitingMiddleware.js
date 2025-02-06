import rateLimit from "express-rate-limit"

const reteLimiting = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: "Limit succeded! you can create 5 short URL in an hour."
    },
    headers: true
})

export { reteLimiting };
import Redis from "ioredis";
import dotenv from "dotenv"

dotenv.config();

const redisUrl = process.env.REDIS_URL;

// Redis client using the URL
const redisClient = new Redis(redisUrl, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
});


// Event Listeners
redisClient.on("connect", () => {
    console.log("✅ Redis: Connection established");
});

redisClient.on("ready", () => {
    console.log("✅ Redis: Client is ready");
});

redisClient.on("error", (err) => {
    console.error("❌ Redis Error:", err);
});

redisClient.on("close", () => {
    console.log("⚠️ Redis: Connection closed");
});

redisClient.on("reconnecting", () => {
    console.log("🔄 Redis: Reconnecting...");
});

// Test Connection
redisClient.ping()
    .then((result) => console.log("✅ Redis PING result:", result))
    .catch((err) => console.error("❌ Redis PING failed:", err));

export default redisClient;

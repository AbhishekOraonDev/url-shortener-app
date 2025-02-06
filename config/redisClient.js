import Redis from "ioredis";
import dotenv from "dotenv"

dotenv.config();

// Use the Redis service name from Docker Compose
const redisClient = new Redis({
    // username: 'default',
    // password: process.env.REDIS_PASSWORD, 
    // socket: {
    //     host: 'redis-14518.crce182.ap-south-1-1.ec2.redns.redis-cloud.com',
    //     port: 14518
    // },
    // host: "redis",  // Use service name instead of localhost
    host: process.env.REDIS_HOST,
    port: 6379,

    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    showFriendlyErrorStack: true
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

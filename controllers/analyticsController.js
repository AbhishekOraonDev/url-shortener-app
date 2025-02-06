import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import Analytics from "../models/analyticsModel.js";
import URL from "../models/UrlModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import redisClient from "../config/redisClient.js";

const CACHE_EXPIRY = 600;


// Get analytics as per specific url
const getAnayticsSpecificUrl = catchAsyncError(async (req, res, next) => {

    const userId = req.user._id;
    const { shortId } = req.params;
    if (!shortId) return next(new ErrorHandler("Short Id is required"));

    // console.log("userId : ", userId);
    // console.log("shortId : ", shortId);

    try {

        const cacheKey = `analytics:${shortId}`;

        // Check Redis cache first
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache Hit: getting url specific analysis data from redis.")
            return res.status(200).json(JSON.parse(cachedData));
        }

        // finding url in DB
        const url = await URL.findOne({ shortId: shortId });
        if (!url) return next(new ErrorHandler("Invalid URL.", 404));

        if (url.userId.toString() !== userId.toString()) {
            return next(new ErrorHandler("Unauthorized!", 403));
        }

        // find analytics data as per urlid
        const urlAnalytics = await Analytics.findOne({ urlId: url._id });

        if (!urlAnalytics) return next(new ErrorHandler("No analytics data found for this URL", 404));

        // Cache data in Redis
        await redisClient.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(urlAnalytics));

        console.log("Cache miss: getting url specific analysis data from db.")
        res.status(200).json({
            success: true,
            message: "Analytics fetched successfuly.",
            data: urlAnalytics
        });

    } catch (error) {
        console.error("Error fetching Analytics data", error);
        next(new ErrorHandler("Internal server error, error fetching url specific Analytics data", 500));
    }

});



// get overall analytics 
const getOverallAnaytics = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;

    const cacheKey = `analytics:overall:${userId}`;

    try {
        // Check if data is cached
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache Hit: getting overall analysis data from redis.")
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Fetch all the short URLs created by the user
        const urlData = await URL.find({ userId: userId });
        // console.log(urlData);

        if (!urlData.length) return next(new ErrorHandler("No URL found for this user", 404));

        // Extract URL IDs
        const urlIDs = urlData.map(url => url._id);
        // console.log("URL IDs: ", urlIDs);

        // Fetch analytics data for the URLs
        const analyticsDataOverall = await Analytics.find({ urlId: { $in: urlIDs } });
        // console.log("Analytics Data Overall: ", analyticsDataOverall);

        // Aggregate analytics for overall calculation
        let totalClicks = 0;
        let totalUniqueUsers = new Set();
        let clicksByDate = {};

        let osData = {};
        let deviceData = {};

        analyticsDataOverall.forEach(analytics => {
            // Aggregate total clicks
            totalClicks += analytics.totalClicks;

            // Aggregate unique users
            if (analytics.uniqueUsers?.uniqueUserIps) {
                analytics.uniqueUsers.uniqueUserIps.forEach(ip => {
                    if (ip) totalUniqueUsers.add(ip);
                });
            }

            // Aggregate clicks by date
            analytics.clicksByDate.forEach(entry => {
                const dateStr = entry.date.toISOString().split("T")[0];
                clicksByDate[dateStr] = (clicksByDate[dateStr] || 0) + entry.clicks;
            });

            // Aggregate OS data
            analytics.osType.forEach(os => {
                if (!osData[os.osName]) {
                    osData[os.osName] = { uniqueClicks: 0, uniqueUsers: new Set() };
                }
                osData[os.osName].uniqueClicks += os.uniqueClicks;
                if (os.uniqueUsers?.uniqueUserIps) {
                    os.uniqueUsers.uniqueUserIps.forEach(ip => osData[os.osName].uniqueUsers.add(ip));
                }
            });

            // Aggregate device data
            if (Array.isArray(analytics.deviceType)) {
                analytics.deviceType.forEach(device => {
                    if (device && device.deviceName) {
                        if (!deviceData[device.deviceName]) {
                            deviceData[device.deviceName] = {
                                uniqueClicks: 0,
                                uniqueUsers: {
                                    count: 0,
                                    uniqueUserIps: new Set()
                                }
                            };
                        }
                        deviceData[device.deviceName].uniqueClicks += device.uniqueClicks || 0;

                        if (device.uniqueUsers?.uniqueUserIps) {
                            device.uniqueUsers.uniqueUserIps.forEach(ip => {
                                if (ip) {
                                    deviceData[device.deviceName].uniqueUsers.uniqueUserIps.add(ip);
                                }
                            });
                            // Update the count of unique users
                            deviceData[device.deviceName].uniqueUsers.count = deviceData[device.deviceName].uniqueUsers.uniqueUserIps.size;
                        }
                    }
                });
            }
        });

        // Convert OS and device Sets to arrays
        const osDataArray = Object.entries(osData).map(([osName, data]) => ({
            osName,
            uniqueClicks: data.uniqueClicks,
            uniqueUsers: data.uniqueUsers.size,
        }));

        const deviceDataArray = Object.entries(deviceData).map(([deviceName, data]) => ({
            deviceName,
            uniqueClicks: data.uniqueClicks,
            uniqueUsers: {
                count: data.uniqueUsers.count,
                uniqueUserIps: Array.from(data.uniqueUsers.uniqueUserIps),
            },
        }));

        // Prepare the final response
        const data = {
            totalClicks,
            totalUniqueUsers: totalUniqueUsers.size,
            clicksByDate: Object.entries(clicksByDate).map(([date, clicks]) => ({ date, clicks })),
            osType: osDataArray,
            deviceType: deviceDataArray,
            urls: urlData.map(url => ({
                shortUrl: url.shortId,
                redirectionUrl: url.redirectURL,
                totalClicks: analyticsDataOverall.find(a => a.urlId.toString() === url._id.toString())?.totalClicks || 0,
                uniqueUsers: analyticsDataOverall.find(a => a.urlId.toString() === url._id.toString())?.uniqueUsers.count || 0,
            })),
        };

        // console.log("Data: ", data);

        // Cache the data in Redis
        await redisClient.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(data));

        console.log("Cache miss: getting overall analysis data from db.")
        // Send the response
        res.status(200).json({
            success: true,
            message: "Overall analytics fetched successfully.",
            data: data,
        });

    } catch (error) {
        console.error("Internal server error: ", error);
        next(new ErrorHandler("Internal server error, error fetching overall analytics data", 500));
    }
});



const getTopicAnalytics = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id; // Authenticated user ID
    const { topic } = req.params; // Extract topic from URL params

    if (!topic) {
        return next(new ErrorHandler("Topic is required", 400));
    }

    const cacheKey = `analytics:topic:${userId}:${topic}`;

    try {

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache Hit: getting topic specific analysis data from redis.")
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Find all URLs under the given topic created by the authenticated user
        const userUrls = await URL.find({ userId, topic });

        if (!userUrls.length) {
            return next(new ErrorHandler("No URLs found for this topic", 404));
        }

        // Extract URL IDs
        const urlIds = userUrls.map(url => url._id);

        // Fetch analytics for these URLs
        const analyticsData = await Analytics.find({ urlId: { $in: urlIds } });

        // Aggregate total clicks and unique users
        let totalClicks = 0;
        let totalUniqueUsers = new Set();
        let clicksByDate = {};

        const urlsAnalytics = analyticsData.map(analytics => {
            totalClicks += analytics.totalClicks;
            analytics.uniqueUsers.uniqueUsersIps.forEach(ip => totalUniqueUsers.add(ip));

            // Aggregate clicks by date
            analytics.clicksByDate.forEach(entry => {
                const dateStr = entry.date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
                clicksByDate[dateStr] = (clicksByDate[dateStr] || 0) + entry.clicks;
            });

            // Find the corresponding URL
            const url = userUrls.find(url => url._id.toString() === analytics.urlId.toString());

            return {
                shortUrl: url.shortId,
                totalClicks: analytics.totalClicks,
                uniqueUsers: analytics.uniqueUsers.count,
            };
        });

        let data = {
            totalClicks: totalClicks,
            uniqueUsers: totalUniqueUsers.size,
            clicksByDate: Object.entries(clicksByDate).map(([date, clicks]) => ({ date, clicks })),
            urls: urlsAnalytics,
        };

        await redisClient.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(data));

        console.log("Cache miss: getting topic specific analysis data from db.")
        res.status(200).json({
            success: true,
            message: "Topic wise analytics fetched successfuly.",
            data: data,
        });
    } catch (error) {
        console.error("Internal server error", 500);
        next(new ErrorHandler("Internal server error, error fetching topic specific Analytics data", 500));
    }
});



export { getAnayticsSpecificUrl, getOverallAnaytics, getTopicAnalytics };
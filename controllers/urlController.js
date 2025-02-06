import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { nanoid } from "nanoid";
import URL from "../models/UrlModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Analytics from "../models/analyticsModel.js";
import getOSName from "../utils/getOSName.js";
import getDeviceType from "../utils/getDeviceType.js";
import redisClient from "../config/redisClient.js";
import updateAnalytics from "../utils/updateAnalytics.js";


// Generate new short url
const generateNewShortURL = catchAsyncError(async (req, res, next) => {

    const { redirectURL, customAlias, topic } = req.body;
    const userId = req.user;

    try {
        // userId validation and check
        // console.log("userId: ", userId);
        if (!userId) {
            return next(new ErrorHandler("User id is required, please login and try again.", 400));
        }

        // check for redirectURL
        if (!redirectURL) {
            return next(new ErrorHandler("Redirect url is required.", 400));
        }

        // generate short unique Id
        // const shortId = nanoid(8);

        let shortId;


        if (customAlias) {
            // Validate custom alias
            const existingAlias = await URL.findOne({ shortId: customAlias });
            if (existingAlias) {
                return next(new ErrorHandler("Custom Alias is already in use, please choose the different one.", 400));
            }

            // If available, save customAlias as shortId
            shortId = customAlias;

        } else {
            shortId = nanoid(8)
        }


        // console.log("shortId: ", shortId);


        const urlData = await URL.create({
            userId: userId,
            shortId: shortId,
            redirectURL: redirectURL,
            topic: topic,
        });

        // Clear relevant caches
        // await redisClient.del(`topicAnalytics:${topic}`);
        // await redisClient.del(``)
        try {
            await redisClient.set(`shortUrl:${shortId}`, JSON.stringify(urlData), 'EX', 86400);
            await redisClient.del(`analytics:${shortId}`);
        } catch (error) {
            console.error("Redis error while setting short URL:", error);
        }

        res.status(201).json({
            success: true,
            message: `Short URL created successfully!`,
            data: {
                shortId,
                shortURL: `${req.protocol}://${req.get("host")}/${shortId}`,
            },
        });


    } catch (error) {
        console.error("Error : ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error, debug main block : generateNewShortURL",
        })
    }
});



// Redirect short url to the original url
const redirectToOriginalUrl = catchAsyncError(async (req, res, next) => {

    // check for shortId in the url
    const { shortId } = req.params
    if (!shortId) return next(new ErrorHandler("Error processing request, short Id not found.", 400));

    try {

        // Check Redis cache first
        let cachedUrl;
        let cachedAnalytics;
        try {
            cachedUrl = await redisClient.get(`shortUrl:${shortId}`);
            cachedAnalytics = await redisClient.get(`analytics:${shortId}`);
        } catch (error) {
            console.error("Redis error:", error);
        }

        if (cachedUrl) {
            cachedUrl = JSON.parse(cachedUrl)
            console.log("Cache Hit: Redirecting from Redis");
            // console.log("cachedUrl: ", cachedUrl);

            // Parse user agent and get IP
            const userAgent = req.headers["user-agent"];
            const userIP = req.headers['x-forwarded-for'] || req.ip;

            // Get analytics data from cache or database
            let analyticsData;
            if (cachedAnalytics) {
                analyticsData = JSON.parse(cachedAnalytics);
            } else {
                analyticsData = await Analytics.findOne({ urlId: cachedUrl._id });
                if (!analyticsData) {
                    analyticsData = new Analytics({
                        urlId: cachedUrl._id,
                        totalClicks: 0,
                        uniqueUsers: { count: 0, uniqueUserIps: [] },
                        clicksByDate: [],
                        osType: [],
                        deviceType: [],
                    });
                }
            }

            // Update analytics
            analyticsData = await updateAnalytics(analyticsData, userAgent, userIP);

            // Save to database and update cache
            if (analyticsData instanceof Analytics) {
                await analyticsData.save();
            } else {
                await Analytics.findOneAndUpdate(
                    { urlId: cachedUrl._id },
                    analyticsData,
                    { new: true, upsert: true }
                );
            }

            // Update Redis cache
            await redisClient.set(`analytics:${shortId}`, JSON.stringify(analyticsData), 'EX', 3600);
            await redisClient.expire(`shortUrl:${shortId}`, 86400); // Reset TTL

            return res.redirect(302, cachedUrl.redirectURL);
        }


        // Check for url data
        const urlData = await URL.findOne({ shortId: shortId });
        if (!urlData) return next(new ErrorHandler("Invalid URL.", 400));

        // Parse this to detect OS and device
        const userAgent = req.headers["user-agent"];

        // fetch analytics data
        let analyticsData = await Analytics.findOne({ urlId: urlData._id });

        if (!analyticsData) {

            // If analytics data is not present
            analyticsData = new Analytics({
                urlId: urlData._id,
                totalClicks: 0,
                uniqueUsers: { count: 0, uniqueUserIps: [] },
                clicksByDate: [],
                osType: [],
                deviceType: [],
            });
        }

        // Update total clicks (Using IP for now might change to UUID store cookie)
        analyticsData.totalClicks += 1;

        // update uniqueUsers
        const userIP = req.headers['x-forwarded-for'] || req.ip;

        if (!analyticsData.uniqueUsers.uniqueUsersIps.includes(userIP)) {
            analyticsData.uniqueUsers.count += 1;
            analyticsData.uniqueUsers.uniqueUsersIps.push(userIP);
        };


        // update clickByDates
        const todaysDate = new Date().toISOString().split("T")[0];      // Retrive the date only
        const dateEntry = analyticsData.clicksByDate.find(
            (entry) => new Date(entry.date).toISOString().split("T")[0] === todaysDate
        );

        if (dateEntry) {
            dateEntry.clicks += 1;
        } else {
            analyticsData.clicksByDate.push({ date: todaysDate, clicks: 1 });
        }


        // udpate osType
        const osName = getOSName(userAgent) || "Unknown OS";

        const osEntry = analyticsData.osType.find((entry) => entry.osName === osName);
        if (osEntry) {// if os exists
            // increment uniqueClicks
            osEntry.uniqueClicks += 1;
            // if ip unique
            if (!osEntry.uniqueUsers.uniqueUserIps.includes(userIP)) {
                osEntry.uniqueUsers.count += 1;
                osEntry.uniqueUsers.uniqueUserIps.push(userIP);
            }
        } else {// os doesn't exists
            // create ne os entry
            analyticsData.osType.push({
                osName: osName,
                uniqueClicks: 1,
                uniqueUsers: { count: 1, uniqueUserIps: [userIP] },
            })
        }


        // update device type
        const deviceName = getDeviceType(userAgent) || "Unknown Device";
        const deviceEntry = analyticsData.deviceType.find((entry) => entry.deviceName === deviceName);

        // device entry not found 
        if (!deviceEntry) {
            // new device entry
            analyticsData.deviceType.push({
                deviceName: deviceName,
                uniqueClicks: 1,
                uniqueUsers: { count: 1, uniqueUserIps: [userIP] },
            });
        } else {
            deviceEntry.uniqueClicks += 1;
            if (!deviceEntry.uniqueUsers.uniqueUserIps.includes(userIP)) {
                deviceEntry.uniqueUsers.count += 1,
                    deviceEntry.uniqueUsers.uniqueUserIps.push(userIP)
            }
        }

        // Save the updated analytics data
        await analyticsData.save();

        await redisClient.set(`analytics:${shortId}`, JSON.stringify(analyticsData), 'EX', 3600);

        // Cache the URL for future requests
        await redisClient.set(`shortUrl:${shortId}`, urlData.redirectURL, 'EX', 86400);

        console.log("Cache Miss: Redirecting from DB");

        // Redirect to original url
        return res.redirect(302, urlData.redirectURL)


    } catch (error) {
        console.error("Internal server error, debug the main block. Error: ", error);
        return next(new ErrorHandler("Internal server error.", 500));
    }
});


export { generateNewShortURL, redirectToOriginalUrl };

import getOSName from "../utils/getOSName.js";
import getDeviceType from "../utils/getDeviceType.js";


// Helper function to update analytics
const updateAnalytics = async (analyticsData, userAgent, userIP) => {
    // Update total clicks
    analyticsData.totalClicks += 1;

    // Update unique users
    if (!analyticsData.uniqueUsers.uniqueUsersIps.includes(userIP)) {
        analyticsData.uniqueUsers.count += 1;
        analyticsData.uniqueUsers.uniqueUsersIps.push(userIP);
    }

    // Update clicks by date
    const todaysDate = new Date().toISOString().split("T")[0];
    const dateEntry = analyticsData.clicksByDate.find(
        (entry) => new Date(entry.date).toISOString().split("T")[0] === todaysDate
    );

    if (dateEntry) {
        dateEntry.clicks += 1;
    } else {
        analyticsData.clicksByDate.push({ date: todaysDate, clicks: 1 });
    }

    // Update OS type
    const osName = getOSName(userAgent) || "Unknown OS";
    const osEntry = analyticsData.osType.find((entry) => entry.osName === osName);
    
    if (osEntry) {
        osEntry.uniqueClicks += 1;
        if (!osEntry.uniqueUsers.uniqueUserIps.includes(userIP)) {
            osEntry.uniqueUsers.count += 1;
            osEntry.uniqueUsers.uniqueUserIps.push(userIP);
        }
    } else {
        analyticsData.osType.push({
            osName: osName,
            uniqueClicks: 1,
            uniqueUsers: { count: 1, uniqueUserIps: [userIP] },
        });
    }

    // Update device type
    const deviceName = getDeviceType(userAgent) || "Unknown Device";
    const deviceEntry = analyticsData.deviceType.find((entry) => entry.deviceName === deviceName);

    if (!deviceEntry) {
        analyticsData.deviceType.push({
            deviceName: deviceName,
            uniqueClicks: 1,
            uniqueUsers: { count: 1, uniqueUserIps: [userIP] },
        });
    } else {
        deviceEntry.uniqueClicks += 1;
        if (!deviceEntry.uniqueUsers.uniqueUserIps.includes(userIP)) {
            deviceEntry.uniqueUsers.count += 1;
            deviceEntry.uniqueUsers.uniqueUserIps.push(userIP);
        }
    }

    return analyticsData;
};

export default updateAnalytics;
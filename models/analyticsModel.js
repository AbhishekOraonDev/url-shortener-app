import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    urlId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "URL",
        required: [true, "Url Id is required."],
    },
    totalClicks: {
        type: Number,
        default: 0,
        min: [0, "Total clicks cannot be negative."],
    },
    // uniqueUsers: {
    //     type: Number,
    //     default: 0,
    //     min: [0, "Unique users cannot be negative."],
    // },
    uniqueUsers: {
        count: { type: Number, default: 0 },
        uniqueUsersIps: [{ type: String }],
    }
    ,
    clicksByDate: [
        {
            date: { type: Date, required: true },
            clicks: { type: Number, default: 0 },
        },
    ],
    osType: [{
        osName: { type: String, required: true },
        uniqueClicks: { type: Number, default: 0, min: 0 },
        uniqueUsers: {
            count: { type: Number, default: 0 },
            uniqueUserIps: { type: [String], default: [] },
        },
    }],
    deviceType: [{
        deviceName: { type: String, required: true },
        uniqueClicks: { type: Number, default: 0, min: 0 },
        uniqueUsers: {
            count: { type: Number, default: 0 },
            uniqueUserIps: { type: [String], default: [] },
        },
    }]
}, { timestamps: true })


const Analytics = mongoose.model("analytics", analyticsSchema);

export default Analytics;
import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "User Id is required."],
        ref: "User"
    },
    shortId: {
        type: String,
        required: true,
        unique: true,
    },
    redirectURL: {
        type: String,
        required: true,
    },
    topic: {
        type: String,
        default: null,
    }

}, {timestamps: true});


const URL = mongoose.model("url", urlSchema);

export default URL;
//-------------------------------DB Connection module--------------------------


import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        // Connecting to mongoose db with uri
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'ShortenUrl'
        });
        console.log("Connected to the database...");

    }catch(error){
        console.error("Error connecting database, Error: ", error);
        throw error;
    }
}


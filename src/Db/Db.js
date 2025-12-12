import mongoose from "mongoose";
const DB_Connection = async (db_uri,db_name)=>{
    console.log("db url:",db_uri);
    console.log("db name:",db_name);
    try{
        const DB_Initialization = await mongoose.connect(`${db_uri}/${db_name}`);
        console.log(`\nMongo DB has connected successfully :) DB host: ${DB_Initialization.connection.host}`);
    }
    catch(err){
        console.error("Database connection failed:", err);
        process.exit(1); // Exit the process with failure
    }
}
export default DB_Connection;
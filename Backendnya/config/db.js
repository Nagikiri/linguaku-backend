// Backendnya/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔌 Attempting to connect to MongoDB...");
  
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri && mongoUri.includes('@')) {
    console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, "//****:****@")}`);
  } else {
    console.log(`📍 URI: ${mongoUri}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Socket timeout 45 seconds
      connectTimeoutMS: 30000, // Connection timeout 30 seconds
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });

    console.log("✅ MongoDB Connected Successfully!");
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌍 Host: ${conn.connection.host}`);
    
    // Return connection for chaining
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed!");
    console.error(`📛 Error: ${error.message}`);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check your internet connection");
    console.error("   2. Verify MongoDB Atlas is accessible");
    console.error("   3. Check if IP address is whitelisted in MongoDB Atlas");
    console.error("   4. Verify MONGODB_URI in .env file");
    console.error("   5. Check MongoDB Atlas cluster status");
    
    // Throw error to be caught by server startup
    throw error;
  }
};

module.exports = connectDB;

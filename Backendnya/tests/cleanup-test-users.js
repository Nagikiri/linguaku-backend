// ============================================
// FILE: tests/cleanup-test-users.js
// Purpose: Clean up test users - keep only production users
// ============================================

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Users to KEEP (production accounts)
const KEEP_EMAILS = [
  'test@linguaku.com',       // Main test account
  'gihon@mail.com'            // Production user
  // TODO: Add jecobi email when found
];

async function cleanupTestUsers() {
  try {
    console.log('🧹 Starting Test User Cleanup...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find({}).select('email name isEmailVerified createdAt');
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    // Find users to keep
    const usersToKeep = allUsers.filter(user => 
      KEEP_EMAILS.includes(user.email.toLowerCase())
    );
    console.log(`✅ Users to KEEP (${usersToKeep.length}):`);
    usersToKeep.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Verified: ${user.isEmailVerified}`);
    });
    console.log('');

    // Find users to delete
    const usersToDelete = allUsers.filter(user => 
      !KEEP_EMAILS.includes(user.email.toLowerCase())
    );
    
    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete. Database is clean!\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`🗑️  Users to DELETE (${usersToDelete.length}):`);
    usersToDelete.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Created: ${user.createdAt.toLocaleDateString()}`);
    });
    console.log('');

    // Ask for confirmation (in production, you'd want manual confirmation)
    console.log('⚠️  WARNING: About to delete these users permanently!');
    console.log('💡 Review the list above carefully.\n');

    // Delete users NOT in keep list
    const result = await User.deleteMany({
      email: { 
        $nin: KEEP_EMAILS.map(e => e.toLowerCase())
      }
    });

    console.log(`✅ Successfully deleted ${result.deletedCount} test users`);
    console.log(`✅ Kept ${KEEP_EMAILS.length} production users\n`);

    // Verify remaining users
    const remainingUsers = await User.find({}).select('email name');
    console.log(`📊 Remaining users in database: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`   ✓ ${user.email} (${user.name})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Cleanup complete! Database disconnected.');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Execute cleanup
cleanupTestUsers();

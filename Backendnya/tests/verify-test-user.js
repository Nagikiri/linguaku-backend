// ============================================
// FILE: verify-test-user.js
// Tujuan: Verify test user untuk testing tanpa email
// ============================================

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const verifyTestUser = async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ VERIFY TEST USER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    const testEmail = 'test@linguaku.com';

    // Find and verify user
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ Test user not found. Create one first with create-test-user.js');
      await mongoose.disconnect();
      return;
    }

    // Update user to verified status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('✅ Test user verified successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 VERIFIED TEST USER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`✅ Email Verified: ${user.isEmailVerified}`);
    console.log(`🔑 Password: Test123!@#`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Now you can login with these credentials!\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from database\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('👋 Disconnected from database\n');
    }
  }
};

verifyTestUser();

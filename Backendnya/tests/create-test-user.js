// ============================================
// FILE: create-test-user.js
// Tujuan: Create test user for API testing
// ============================================

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createTestUser = async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 CREATE TEST USER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const testEmail = 'test@linguaku.com';
    const testPassword = 'Test123!@#';

    // Check if user exists
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      console.log('⚠️  Test user already exists');
      console.log(`📧 Email: ${testEmail}`);
      console.log(`🔑 Password: ${testPassword}`);
      console.log(`\nUse these credentials for testing\n`);
      await mongoose.disconnect();
      return;
    }

    // Create new test user
    const testUser = await User.create({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      authProvider: 'email'
    });

    console.log('Test user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST USER CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log(`👤 Name: ${testUser.name}`);
    console.log(`🆔 User ID: ${testUser._id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Use these credentials to test API endpoints\n');

  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database\n');
  }
};

createTestUser();

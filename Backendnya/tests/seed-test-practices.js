// ============================================
// FILE: seed-test-practices.js
// Tujuan: Create sample practices for test user
// ============================================

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Material = require('../models/Material');
const Practice = require('../models/Practice');

const seedPractices = async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 SEED TEST PRACTICES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    // Get test user
    const testUser = await User.findOne({ email: 'test@linguaku.com' });
    if (!testUser) {
      console.log('Test user not found. Run: node create-test-user.js\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`👤 Test User: ${testUser.name} (${testUser.email})\n`);

    // Get some materials
    const materials = await Material.find().limit(10).lean();
    if (materials.length === 0) {
      console.log('No materials found. Run: node reset-materials.js\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`📚 Found ${materials.length} materials\n`);

    // Delete existing test user practices
    const deleted = await Practice.deleteMany({ userId: testUser._id });
    console.log(`🗑️  Deleted ${deleted.deletedCount} old practices\n`);

    // Create practices over last 30 days
    console.log('Creating practices...\n');
    const practices = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random number of practices per day (0-3)
      const practicesPerDay = Math.floor(Math.random() * 4);
      
      for (let j = 0; j < practicesPerDay; j++) {
        const material = materials[Math.floor(Math.random() * materials.length)];
        const practiceItem = material.items[Math.floor(Math.random() * material.items.length)];
        
        // Simulate score with slight improvement over time
        const baseScore = 60 + (30 - i) * 0.5; // Improves over time
        const randomVariation = Math.floor(Math.random() * 20) - 10;
        const score = Math.max(0, Math.min(100, Math.round(baseScore + randomVariation)));
        
        const totalWords = practiceItem.text.split(/\s+/).length;
        const correctWords = Math.round((score / 100) * totalWords);
        const wrongWords = totalWords - correctWords;
        
        // Generate feedback based on score
        let feedbackSummary;
        if (score >= 90) {
          feedbackSummary = 'Excellent pronunciation! Your clarity is outstanding.';
        } else if (score >= 75) {
          feedbackSummary = 'Good job! Minor improvements needed in a few words.';
        } else if (score >= 60) {
          feedbackSummary = 'Fair attempt. Focus on word stress and intonation.';
        } else {
          feedbackSummary = 'Needs practice. Review the material and try again.';
        }
        
        // Mistakes (if any)
        const mistakes = [];
        if (wrongWords > 0) {
          const words = practiceItem.text.split(/\s+/);
          const wrongIndices = new Set();
          while (wrongIndices.size < Math.min(wrongWords, 5)) {
            wrongIndices.add(Math.floor(Math.random() * words.length));
          }
          wrongIndices.forEach(idx => mistakes.push(words[idx]));
        }
        
        practices.push({
          userId: testUser._id,
          materialId: material._id,
          itemText: practiceItem.text,
          score,
          correctWords,
          wrongWords,
          totalWords,
          mistakes: mistakes.slice(0, 5),
          feedbackSummary,
          duration: Math.floor(Math.random() * 30) + 10,
          createdAt: date
        });
      }
    }

    // Insert all practices
    if (practices.length > 0) {
      await Practice.insertMany(practices);
      console.log(`Created ${practices.length} practices\n`);
      
      // Show distribution
      const distribution = {};
      practices.forEach(p => {
        const dateKey = p.createdAt.toISOString().split('T')[0];
        distribution[dateKey] = (distribution[dateKey] || 0) + 1;
      });
      
      console.log('📊 Practice Distribution (last 10 days):');
      Object.keys(distribution)
        .sort()
        .slice(-10)
        .forEach(date => {
          console.log(`  ${date}: ${distribution[date]} practices`);
        });
      
      // Calculate stats
      const avgScore = Math.round(
        practices.reduce((sum, p) => sum + p.score, 0) / practices.length
      );
      const maxScore = Math.max(...practices.map(p => p.score));
      const minScore = Math.min(...practices.map(p => p.score));
      
      console.log('\n📈 Practice Statistics:');
      console.log(`  Average Score: ${avgScore}%`);
      console.log(`  Highest Score: ${maxScore}%`);
      console.log(`  Lowest Score: ${minScore}%`);
      console.log(`  Total Practices: ${practices.length}`);
      
      console.log('\nTest practices seeded successfully!\n');
      console.log('Now run: node test-api-statistics.js\n');
    } else {
      console.log('⚠️  No practices created (all days had 0 practices)\n');
    }

  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database\n');
  }
};

seedPractices();

// ============================================
// FILE: reset-materials.js
// Tujuan: Drop old materials dan re-seed yang baru
// ============================================

const mongoose = require('mongoose');
require('dotenv').config();

const Material = require('./models/Material');

const resetMaterials = async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 RESET MATERIALS DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Database connected\n');

    // Count old materials
    const oldCount = await Material.countDocuments();
    console.log(`📊 Current materials in database: ${oldCount}`);

    // Drop collection
    console.log('🗑️  Dropping old materials collection...');
    await Material.collection.drop().catch(() => {
      console.log('ℹ️  Collection already empty or does not exist');
    });
    console.log('Old materials deleted\n');

    // Seed new materials
    console.log('🌱 Seeding new materials...');
    await Material.seedMaterials();
    
    // Count new materials
    const newCount = await Material.countDocuments();
    console.log(`\n📊 New materials count: ${newCount}`);

    // Show breakdown
    const beginnerCount = await Material.countDocuments({ level: 'Beginner' });
    const intermediateCount = await Material.countDocuments({ level: 'Intermediate' });
    const advancedCount = await Material.countDocuments({ level: 'Advanced' });

    console.log('\n📈 Breakdown by Level:');
    console.log(`   - Beginner: ${beginnerCount} categories`);
    console.log(`   - Intermediate: ${intermediateCount} categories`);
    console.log(`   - Advanced: ${advancedCount} categories`);

    // Count total items
    const allMaterials = await Material.find();
    let totalItems = 0;
    let longSentences = 0;
    
    allMaterials.forEach(material => {
      totalItems += material.items.length;
      material.items.forEach(item => {
        const wordCount = item.text.split(' ').length;
        if (wordCount >= 7) {
          longSentences++;
        }
      });
    });

    console.log('\n📝 Content Statistics:');
    console.log(`   - Total practice items: ${totalItems}`);
    console.log(`   - Long sentences (7+ words): ${longSentences}`);

    if (newCount >= 10 && totalItems >= 100) {
      console.log('\n🎉 SUCCESS! Materials seeded successfully!');
      console.log('Ready for production deployment!\n');
    } else {
      console.log('\n⚠️  Warning: Material count lower than expected');
      console.log('   Expected: 10+ categories, 100+ items');
      console.log(`   Got: ${newCount} categories, ${totalItems} items\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('   1. Check if MongoDB is running');
    console.log('   2. Verify MONGODB_URI in .env file');
    console.log('   3. Check network connection\n');
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database disconnected\n');
  }
};

// Run reset
resetMaterials();

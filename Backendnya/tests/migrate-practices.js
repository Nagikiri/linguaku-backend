// ============================================
// FILE: migrate-practices.js
// Tujuan: Migrate existing practices ke schema baru
// ============================================

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Practice = require('../models/Practice');

const migratePractices = async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 MIGRATE PRACTICES TO NEW SCHEMA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Connect
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Database connected\n');

    // Find practices without new fields
    const oldPractices = await Practice.find({
      $or: [
        { correctWords: { $exists: false } },
        { wrongWords: { $exists: false } },
        { totalWords: { $exists: false } }
      ]
    }).lean();

    console.log(`Found ${oldPractices.length} practices to migrate\n`);

    if (oldPractices.length === 0) {
      console.log('All practices already migrated!\n');
      await mongoose.disconnect();
      return;
    }

    console.log('Starting migration...\n');

    let updated = 0;
    let failed = 0;

    for (const practice of oldPractices) {
      try {
        // Calculate estimated values based on existing data
        const itemText = practice.itemText || '';
        const words = itemText.split(/\s+/).filter(w => w.length > 0);
        const totalWords = words.length || 10; // default 10 if no text
        
        // Estimate from score
        const score = practice.score || 0;
        const estimatedCorrect = Math.round((score / 100) * totalWords);
        const estimatedWrong = totalWords - estimatedCorrect;
        
        // Generate feedback summary from mistakes
        const mistakes = practice.mistakes || [];
        let feedbackSummary = '';
        if (mistakes.length > 0) {
          feedbackSummary = `Needs improvement: ${mistakes.slice(0, 3).join(', ')}`;
        } else if (score >= 80) {
          feedbackSummary = 'Excellent pronunciation! Keep it up!';
        } else if (score >= 60) {
          feedbackSummary = 'Good effort! Practice more for better results.';
        } else {
          feedbackSummary = 'Keep practicing. Focus on pronunciation clarity.';
        }

        // Update practice
        await Practice.updateOne(
          { _id: practice._id },
          {
            $set: {
              correctWords: estimatedCorrect,
              wrongWords: estimatedWrong,
              totalWords: totalWords,
              feedbackSummary: feedbackSummary.substring(0, 200)
            }
          }
        );

        updated++;
        
        if (updated % 10 === 0) {
          console.log(`  ✓ Migrated ${updated} practices...`);
        }

      } catch (error) {
        console.error(`  ✗ Failed to migrate practice ${practice._id}:`, error.message);
        failed++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Successfully migrated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`📊 Total processed: ${oldPractices.length}\n`);

    // Verify
    const practicesWithStats = await Practice.countDocuments({
      correctWords: { $exists: true },
      wrongWords: { $exists: true },
      totalWords: { $exists: true }
    });

    const totalPractices = await Practice.countDocuments();

    console.log('Verification:');
    console.log(`  Total practices: ${totalPractices}`);
    console.log(`  With statistics: ${practicesWithStats}`);
    
    if (practicesWithStats === totalPractices) {
      console.log('\n🎉 ALL PRACTICES MIGRATED SUCCESSFULLY!\n');
    } else {
      console.log(`\n⚠️  ${totalPractices - practicesWithStats} practices still need migration\n`);
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database disconnected\n');
  }
};

// Run migration
migratePractices();

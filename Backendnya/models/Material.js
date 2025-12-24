// ============================================
// FILE: models/Material.js
// Tujuan: Schema untuk materi latihan (kata/kalimat)
// ============================================

const mongoose = require('mongoose');

/**
 * Material Schema
 * Menyimpan daftar materi latihan
 */
const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true
  },
  
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: [true, 'Level is required'],
    default: 'Beginner'
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  
  items: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Index: Untuk filter cepat by level & category
 */
materialSchema.index({ level: 1, category: 1 });

/**
 * Static Method: Seed initial materials
 * Usage: Material.seedMaterials()
 */
materialSchema.statics.seedMaterials = async function() {
  try {
    // Set timeout for count operation
    const count = await this.countDocuments().maxTimeMS(5000);
    
    // Jika sudah ada data, skip seeding
    if (count > 0) {
      console.log('📚 Materials already seeded, skipping...');
      return;
    }
  } catch (error) {
    console.warn('Cannot check materials count:', error.message);
    console.log('📚 Skipping seeding due to database connection issue...');
    return;
  }
  
  // Data seed dari frontend - EXPANDED MATERIALS WITH LONG SENTENCES
  const materials = [
    // ========== BEGINNER LEVEL ==========
    {
      title: "Basic Greetings",
      level: "Beginner",
      category: "Daily Conversation",
      items: [
        { id: "bg-1", text: "Hello, how are you today?", difficulty: "easy" },
        { id: "bg-2", text: "Good morning, I hope you have a wonderful day!", difficulty: "easy" },
        { id: "bg-3", text: "Thank you very much for all of your help and support.", difficulty: "medium" },
        { id: "bg-4", text: "It's really nice to meet you here today.", difficulty: "easy" },
        { id: "bg-5", text: "See you later, goodbye and take care!", difficulty: "easy" },
        { id: "bg-6", text: "How have you been lately?", difficulty: "easy" },
        { id: "bg-7", text: "I'm doing great, thanks for asking!", difficulty: "medium" },
        { id: "bg-8", text: "Have a pleasant evening with your family.", difficulty: "medium" }
      ]
    },
    {
      title: "Common Words",
      level: "Beginner",
      category: "Vocabulary",
      items: [
        { id: "cw-1", text: "Beautiful", difficulty: "easy" },
        { id: "cw-2", text: "Necessary", difficulty: "medium" },
        { id: "cw-3", text: "Pronunciation", difficulty: "hard" },
        { id: "cw-4", text: "Comfortable", difficulty: "medium" },
        { id: "cw-5", text: "Important", difficulty: "easy" },
        { id: "cw-6", text: "Different", difficulty: "medium" },
        { id: "cw-7", text: "Environment", difficulty: "hard" },
        { id: "cw-8", text: "Opportunity", difficulty: "hard" },
        { id: "cw-9", text: "Technology", difficulty: "medium" },
        { id: "cw-10", text: "Communication", difficulty: "hard" }
      ]
    },
    {
      title: "Daily Activities",
      level: "Beginner",
      category: "Daily Conversation",
      items: [
        { id: "da-1", text: "I wake up at six o'clock every morning.", difficulty: "easy" },
        { id: "da-2", text: "She usually eats breakfast with her family.", difficulty: "medium" },
        { id: "da-3", text: "We go to school by bus every single day.", difficulty: "medium" },
        { id: "da-4", text: "He studies English for two hours after school.", difficulty: "medium" },
        { id: "da-5", text: "They like to play basketball in the afternoon.", difficulty: "easy" },
        { id: "da-6", text: "I always brush my teeth before going to bed.", difficulty: "medium" },
        { id: "da-7", text: "My mother cooks delicious dinner for us every evening.", difficulty: "hard" }
      ]
    },
    {
      title: "Numbers & Time",
      level: "Beginner",
      category: "Basic Skills",
      items: [
        { id: "nt-1", text: "Thirteen", difficulty: "medium" },
        { id: "nt-2", text: "Thirty", difficulty: "easy" },
        { id: "nt-3", text: "It's exactly half past three in the afternoon.", difficulty: "medium" },
        { id: "nt-4", text: "Twenty-one", difficulty: "easy" },
        { id: "nt-5", text: "What time is it right now?", difficulty: "easy" },
        { id: "nt-6", text: "The meeting starts at quarter to nine tomorrow morning.", difficulty: "hard" },
        { id: "nt-7", text: "I'll be there in fifteen minutes from now.", difficulty: "medium" }
      ]
    },
    {
      title: "Colors & Shapes",
      level: "Beginner",
      category: "Vocabulary",
      items: [
        { id: "cs-1", text: "Red", difficulty: "easy" },
        { id: "cs-2", text: "Blue", difficulty: "easy" },
        { id: "cs-3", text: "Circle", difficulty: "easy" },
        { id: "cs-4", text: "Square", difficulty: "easy" },
        { id: "cs-5", text: "Rectangle", difficulty: "medium" },
        { id: "cs-6", text: "The sky is bright blue today.", difficulty: "easy" },
        { id: "cs-7", text: "I like the green color of these leaves.", difficulty: "medium" }
      ]
    },
    {
      title: "Family Members",
      level: "Beginner",
      category: "Vocabulary",
      items: [
        { id: "fm-1", text: "Mother", difficulty: "easy" },
        { id: "fm-2", text: "Father", difficulty: "easy" },
        { id: "fm-3", text: "Brother", difficulty: "easy" },
        { id: "fm-4", text: "Sister", difficulty: "easy" },
        { id: "fm-5", text: "Grandmother", difficulty: "medium" },
        { id: "fm-6", text: "My family always spends time together on weekends.", difficulty: "medium" },
        { id: "fm-7", text: "I have two brothers and one younger sister.", difficulty: "hard" }
      ]
    },
    {
      title: "Food & Drinks",
      level: "Beginner",
      category: "Vocabulary",
      items: [
        { id: "fd-1", text: "I would like a cup of hot coffee, please.", difficulty: "medium" },
        { id: "fd-2", text: "This pizza tastes absolutely delicious!", difficulty: "medium" },
        { id: "fd-3", text: "Can I have a glass of cold water?", difficulty: "easy" },
        { id: "fd-4", text: "She loves eating fresh fruit for breakfast every morning.", difficulty: "hard" },
        { id: "fd-5", text: "We need to buy some vegetables at the market.", difficulty: "medium" }
      ]
    },
    
    // ========== INTERMEDIATE LEVEL ==========
    {
      title: "Shopping Phrases",
      level: "Intermediate",
      category: "Daily Conversation",
      items: [
        { id: "sp-1", text: "Excuse me, how much does this item cost?", difficulty: "medium" },
        { id: "sp-2", text: "I would really like to buy this beautiful shirt, please.", difficulty: "medium" },
        { id: "sp-3", text: "Do you accept credit cards or only cash payments?", difficulty: "medium" },
        { id: "sp-4", text: "Can I possibly get a discount if I buy two items?", difficulty: "hard" },
        { id: "sp-5", text: "Excuse me, where can I find the fitting room?", difficulty: "medium" },
        { id: "sp-6", text: "I'm looking for something in a smaller size, please.", difficulty: "hard" },
        { id: "sp-7", text: "Could you please wrap this as a gift for someone special?", difficulty: "hard" },
        { id: "sp-8", text: "Do you have this in a different color or style?", difficulty: "medium" }
      ]
    },
    {
      title: "Restaurant Conversations",
      level: "Intermediate",
      category: "Daily Conversation",
      items: [
        { id: "rc-1", text: "I would like to order the grilled chicken with vegetables, please.", difficulty: "hard" },
        { id: "rc-2", text: "Could I please see the menu before I decide what to order?", difficulty: "medium" },
        { id: "rc-3", text: "This meal tastes absolutely delicious and perfectly seasoned!", difficulty: "hard" },
        { id: "rc-4", text: "Excuse me, could I have the bill when you have a moment?", difficulty: "medium" },
        { id: "rc-5", text: "I have a reservation for two people under the name Smith.", difficulty: "hard" },
        { id: "rc-6", text: "What would you recommend from the daily specials menu?", difficulty: "hard" },
        { id: "rc-7", text: "Could we have a table near the window if possible?", difficulty: "hard" }
      ]
    },
    {
      title: "Workplace Communication",
      level: "Intermediate",
      category: "Professional",
      items: [
        { id: "wc-1", text: "I have an important meeting scheduled for three o'clock this afternoon.", difficulty: "hard" },
        { id: "wc-2", text: "Could you please send me that detailed report by email?", difficulty: "medium" },
        { id: "wc-3", text: "Please let me know if you need any assistance with the project.", difficulty: "hard" },
        { id: "wc-4", text: "I'll get back to you with more information by tomorrow morning.", difficulty: "hard" },
        { id: "wc-5", text: "The deadline for this assignment is next Friday afternoon.", difficulty: "medium" },
        { id: "wc-6", text: "We need to discuss the budget proposal in our next team meeting.", difficulty: "hard" },
        { id: "wc-7", text: "I've been working on this project for the past three weeks now.", difficulty: "hard" }
      ]
    },
    {
      title: "Travel & Directions",
      level: "Intermediate",
      category: "Daily Conversation",
      items: [
        { id: "td-1", text: "Excuse me, could you tell me where the nearest train station is located?", difficulty: "hard" },
        { id: "td-2", text: "How do I get to the international airport from here?", difficulty: "medium" },
        { id: "td-3", text: "You need to turn left at the next traffic light up ahead.", difficulty: "hard" },
        { id: "td-4", text: "It's approximately twenty minutes away by car or taxi.", difficulty: "hard" },
        { id: "td-5", text: "Can you please show me the location on this map?", difficulty: "medium" },
        { id: "td-6", text: "Is there a bus that goes directly to the city center?", difficulty: "hard" },
        { id: "td-7", text: "Walk straight for two blocks and then turn right at the corner.", difficulty: "hard" }
      ]
    },
    {
      title: "Making Plans",
      level: "Intermediate",
      category: "Daily Conversation",
      items: [
        { id: "mp-1", text: "Would you like to go to the movies with me this weekend?", difficulty: "medium" },
        { id: "mp-2", text: "Let's meet at the coffee shop at around three o'clock tomorrow.", difficulty: "hard" },
        { id: "mp-3", text: "I was thinking we could visit the museum on Saturday afternoon.", difficulty: "hard" },
        { id: "mp-4", text: "Are you free next Tuesday evening for dinner together?", difficulty: "medium" },
        { id: "mp-5", text: "We should plan our vacation trip well in advance this time.", difficulty: "hard" }
      ]
    },
    {
      title: "Health & Wellness",
      level: "Intermediate",
      category: "Daily Conversation",
      items: [
        { id: "hw-1", text: "I haven't been feeling very well for the past few days.", difficulty: "hard" },
        { id: "hw-2", text: "You should make an appointment with the doctor as soon as possible.", difficulty: "hard" },
        { id: "hw-3", text: "It's important to exercise regularly and eat healthy food every day.", difficulty: "hard" },
        { id: "hw-4", text: "I try to get at least eight hours of sleep every single night.", difficulty: "hard" },
        { id: "hw-5", text: "Drinking plenty of water throughout the day is essential for good health.", difficulty: "hard" }
      ]
    },
    
    // ========== ADVANCED LEVEL ==========
    {
      title: "Difficult Sounds",
      level: "Advanced",
      category: "Pronunciation Practice",
      items: [
        { id: "ds-1", text: "Thoroughly", difficulty: "hard" },
        { id: "ds-2", text: "She sells seashells by the seashore every single morning.", difficulty: "hard" },
        { id: "ds-3", text: "The sixth sick sheikh's sixth sheep's sick and needs medical attention.", difficulty: "hard" },
        { id: "ds-4", text: "Three free throws in a row for the championship game.", difficulty: "hard" },
        { id: "ds-5", text: "Irish wristwatch, Swiss wristwatch, which one do you prefer?", difficulty: "hard" },
        { id: "ds-6", text: "The rural juror's ruling was considered quite controversial.", difficulty: "hard" },
        { id: "ds-7", text: "Literally literary literature is particularly popular recently.", difficulty: "hard" }
      ]
    },
    {
      title: "Business Presentations",
      level: "Advanced",
      category: "Professional",
      items: [
        { id: "bp-1", text: "Let me present our quarterly results and financial performance to the board of directors.", difficulty: "hard" },
        { id: "bp-2", text: "This innovative strategy will significantly increase our operational efficiency and productivity.", difficulty: "hard" },
        { id: "bp-3", text: "I'd like to emphasize the critical importance of continuous innovation in our industry.", difficulty: "hard" },
        { id: "bp-4", text: "Our market share has grown by fifteen percent over the past fiscal quarter.", difficulty: "hard" },
        { id: "bp-5", text: "We need to implement these strategic changes immediately to remain competitive.", difficulty: "hard" },
        { id: "bp-6", text: "The data clearly demonstrates a significant improvement in customer satisfaction ratings.", difficulty: "hard" },
        { id: "bp-7", text: "Our comprehensive market analysis indicates substantial growth opportunities in emerging markets.", difficulty: "hard" }
      ]
    },
    {
      title: "Academic Discussions",
      level: "Advanced",
      category: "Professional",
      items: [
        { id: "ad-1", text: "The hypothesis requires further comprehensive investigation and empirical validation.", difficulty: "hard" },
        { id: "ad-2", text: "This particular phenomenon demonstrates remarkably complex and sophisticated behavior patterns.", difficulty: "hard" },
        { id: "ad-3", text: "The research methodology employed was quite sophisticated and methodologically sound.", difficulty: "hard" },
        { id: "ad-4", text: "According to recent research findings published in peer-reviewed journals last month.", difficulty: "hard" },
        { id: "ad-5", text: "We can confidently conclude that the experimental results are statistically significant.", difficulty: "hard" },
        { id: "ad-6", text: "The theoretical framework provides a comprehensive foundation for understanding complex systems.", difficulty: "hard" },
        { id: "ad-7", text: "Contemporary scholarly discourse emphasizes the interdisciplinary nature of modern research.", difficulty: "hard" }
      ]
    },
    {
      title: "Tongue Twisters",
      level: "Advanced",
      category: "Pronunciation Practice",
      items: [
        { id: "tt-1", text: "Peter Piper picked a peck of pickled peppers from the garden yesterday.", difficulty: "hard" },
        { id: "tt-2", text: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", difficulty: "hard" },
        { id: "tt-3", text: "Red lorry, yellow lorry, red lorry, yellow lorry speeding down the highway.", difficulty: "hard" },
        { id: "tt-4", text: "Unique New York, New York's unique, you know you need unique New York.", difficulty: "hard" },
        { id: "tt-5", text: "Toy boat, toy boat, toy boat floating in the bathtub.", difficulty: "hard" },
        { id: "tt-6", text: "Betty Botter bought some butter but she said the butter's bitter.", difficulty: "hard" },
        { id: "tt-7", text: "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.", difficulty: "hard" }
      ]
    },
    {
      title: "Complex Narratives",
      level: "Advanced",
      category: "Professional",
      items: [
        { id: "cn-1", text: "Despite the challenging circumstances, the team successfully completed the project ahead of schedule.", difficulty: "hard" },
        { id: "cn-2", text: "The conference provided an excellent opportunity to network with industry professionals from around the world.", difficulty: "hard" },
        { id: "cn-3", text: "Understanding cultural differences is essential for effective international business communication.", difficulty: "hard" },
        { id: "cn-4", text: "The implementation of new technologies has revolutionized the way we work and collaborate.", difficulty: "hard" },
        { id: "cn-5", text: "Environmental sustainability should be a primary consideration in all corporate decision-making processes.", difficulty: "hard" }
      ]
    },
    {
      title: "Philosophical Expressions",
      level: "Advanced",
      category: "Professional",
      items: [
        { id: "pe-1", text: "The fundamental question of existence has perplexed philosophers throughout human history.", difficulty: "hard" },
        { id: "pe-2", text: "Critical thinking skills are absolutely essential for analyzing complex arguments effectively.", difficulty: "hard" },
        { id: "pe-3", text: "Ethical considerations should guide our decisions in both personal and professional contexts.", difficulty: "hard" },
        { id: "pe-4", text: "The pursuit of knowledge requires intellectual curiosity and systematic investigation.", difficulty: "hard" },
        { id: "pe-5", text: "Perspective and context significantly influence how we interpret information and experiences.", difficulty: "hard" }
      ]
    },
    {
      title: "Technical Descriptions",
      level: "Advanced",
      category: "Professional",
      items: [
        { id: "tech-1", text: "The sophisticated algorithm processes vast amounts of data with remarkable efficiency and accuracy.", difficulty: "hard" },
        { id: "tech-2", text: "Cloud computing infrastructure enables seamless scalability and enhanced operational flexibility.", difficulty: "hard" },
        { id: "tech-3", text: "Artificial intelligence and machine learning are transforming numerous industries worldwide.", difficulty: "hard" },
        { id: "tech-4", text: "Cybersecurity measures must be continuously updated to protect against evolving threats.", difficulty: "hard" },
        { id: "tech-5", text: "The integration of blockchain technology offers unprecedented transparency and security.", difficulty: "hard" }
      ]
    }
  ];
  
  try {
    await this.insertMany(materials);
    console.info('Materials seeded successfully');
    console.log(`📚 Total materials: ${materials.length}`);
  } catch (error) {
    console.error('Error seeding materials:', error.message);
  }
};

module.exports = mongoose.model('Material', materialSchema);
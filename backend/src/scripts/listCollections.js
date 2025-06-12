const mongoose = require('mongoose');
const config = require('../config/config');

async function listCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\nAvailable Collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error listing collections:', error);
    process.exit(1);
  }
}

listCollections(); 
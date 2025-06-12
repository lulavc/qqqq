const { MongoClient } = require('mongodb');
const config = require('../config/config');

async function testConnection() {
  const client = new MongoClient(config.MONGODB_URI);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');

    const db = client.db('sample_mflix');
    const collections = await db.listCollections().toArray();
    
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

testConnection(); 
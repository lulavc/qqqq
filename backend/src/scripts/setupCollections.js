const mongoose = require('mongoose');
const config = require('../config/config');

// Define schemas
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  technologies: [{
    type: String,
    required: true
  }],
  image: {
    type: String,
    required: true
  },
  client: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'planned'],
    default: 'planned'
  },
  url: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  features: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const testimonialSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  clientPosition: {
    type: String,
    required: true
  },
  clientCompany: {
    type: String,
    required: true
  },
  testimonial: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

async function setupCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create collections
    await mongoose.connection.createCollection('projects');
    await mongoose.connection.createCollection('services');
    await mongoose.connection.createCollection('testimonials');
    await mongoose.connection.createCollection('team');
    await mongoose.connection.createCollection('contacts');

    // Create indexes
    await mongoose.connection.collection('projects').createIndex({ title: 1 });
    await mongoose.connection.collection('projects').createIndex({ status: 1 });
    await mongoose.connection.collection('services').createIndex({ name: 1 });
    await mongoose.connection.collection('testimonials').createIndex({ clientName: 1 });
    await mongoose.connection.collection('team').createIndex({ name: 1 });
    await mongoose.connection.collection('contacts').createIndex({ status: 1 });

    console.log('\nCollections created successfully:');
    console.log('- projects');
    console.log('- services');
    console.log('- testimonials');
    console.log('- team');
    console.log('- contacts');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up collections:', error);
    process.exit(1);
  }
}

setupCollections(); 
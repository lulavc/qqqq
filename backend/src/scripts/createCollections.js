const { MongoClient } = require('mongodb');
const config = require('../config/config');

async function createCollections() {
  const client = new MongoClient(config.MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('sample_mflix');

    // Insert sample data
    await db.collection('ainovar_projects').insertOne({
      title: 'Sample Project',
      description: 'This is a sample project',
      technologies: ['Node.js', 'React'],
      image: 'sample.jpg',
      client: 'Sample Client',
      startDate: new Date(),
      status: 'planned',
      createdAt: new Date()
    });
    console.log('Created ainovar_projects collection');

    await db.collection('ainovar_services').insertOne({
      name: 'Sample Service',
      description: 'This is a sample service',
      icon: 'service-icon.svg',
      features: ['Feature 1', 'Feature 2'],
      isActive: true,
      createdAt: new Date()
    });
    console.log('Created ainovar_services collection');

    await db.collection('ainovar_testimonials').insertOne({
      clientName: 'John Doe',
      clientPosition: 'CEO',
      clientCompany: 'Sample Company',
      testimonial: 'Great service!',
      rating: 5,
      isActive: true,
      createdAt: new Date()
    });
    console.log('Created ainovar_testimonials collection');

    await db.collection('ainovar_team').insertOne({
      name: 'John Doe',
      position: 'Developer',
      bio: 'Experienced developer',
      image: 'profile.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        twitter: 'https://twitter.com/johndoe'
      },
      isActive: true,
      createdAt: new Date()
    });
    console.log('Created ainovar_team collection');

    await db.collection('ainovar_contacts').insertOne({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Sample Subject',
      message: 'Sample message',
      status: 'new',
      createdAt: new Date()
    });
    console.log('Created ainovar_contacts collection');

    // Create indexes
    await db.collection('ainovar_projects').createIndex({ title: 1 });
    await db.collection('ainovar_projects').createIndex({ status: 1 });
    await db.collection('ainovar_services').createIndex({ name: 1 });
    await db.collection('ainovar_testimonials').createIndex({ clientName: 1 });
    await db.collection('ainovar_team').createIndex({ name: 1 });
    await db.collection('ainovar_contacts').createIndex({ status: 1 });
    console.log('Created indexes');

    console.log('\nAll collections and sample data created successfully!');
  } catch (error) {
    console.error('Error creating collections:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

createCollections(); 
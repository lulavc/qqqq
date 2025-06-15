console.log("Backend server script started...");

try {
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const config = require('./config/config');
  const routes = require('./routes');
  const { ensureUTF8Encoding, ensureUTF8Response } = require('./middleware/encodingMiddleware');

  // Create Express app
  const app = express();

  // Configure Node options if necessary (e.g., memory limit)
  // process.env.NODE_OPTIONS = '--max-old-space-size=4096'; // Example: Increase old space size

  // Middleware
  app.use(cors({
    origin: '*', // Allow any origin for development ease. Restrict in production.
    credentials: true
  }));

  // Configure JSON parser with UTF-8 support and body verification
  app.use(express.json({
    limit: '50mb', // Set request size limit
    verify: (req, res, buf) => {
      // Ensure buffer is treated as UTF-8
      if (buf && buf.length) {
        try {
          // Attempt to parse to ensure it's valid JSON before further processing
          JSON.parse(buf.toString('utf8'));
          req.rawBody = buf.toString('utf8');
        } catch (e) {
          // If parsing fails, it's not valid JSON or not UTF-8
          res.status(400).send({ success: false, message: 'Invalid JSON format or encoding. Please use UTF-8.' });
          throw new Error('Invalid JSON or encoding'); // Stop further processing
        }
      }
    }
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '50mb', // Set URL-encoded data size limit
    parameterLimit: 50000 // Set parameter limit
  }));

  // Apply UTF-8 encoding middleware to ensure request and response are UTF-8
  app.use(ensureUTF8Encoding); // Ensures incoming request data is handled as UTF-8
  app.use(ensureUTF8Response); // Ensures outgoing response data is UTF-8

  // Routes
  app.use('/api', routes); // Mount API routes

  // Test route to check if the server is running
  app.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  // Attempt to connect to MongoDB, continue even if it fails initially
  mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false, // Disable buffering, commands fail if not connected
    bufferMaxEntries: 0,   // Disable buffering for individual operations
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    socketTimeoutMS: 45000, // Timeout for socket inactivity
  })
    .then(() => {
      console.log('Connected to MongoDB');

      // Optional: Set parameters on MongoDB connection if needed
      // mongoose.connection.db.admin().command({ setParameter: 1, textSearchEnabled: true });
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
      console.log('Continuing without MongoDB connection for now...'); // Application might still run for routes not needing DB
    });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack for debugging
    res.status(500).json({
      success: false,
      message: 'Internal server error' // Generic error message for client
    });
  });

  // Start server
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

} catch (error) {
  console.error("--- UNHANDLED TOP-LEVEL EXCEPTION IN backend/src/server.js ---");
  console.error(error);
  console.error("--- END OF UNHANDLED TOP-LEVEL EXCEPTION ---");
  process.exit(1); // Exit with an error code
}

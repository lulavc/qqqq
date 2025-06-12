const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const routes = require('./routes');
const { ensureUTF8Encoding, ensureUTF8Response } = require('./middleware/encodingMiddleware');

// Create Express app
const app = express();

// Configure UTF-8 encoding for proper Portuguese support
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Middleware
app.use(cors({
  origin: '*', // Permitir qualquer origem para facilitar o desenvolvimento
  credentials: true
}));

// Configure JSON parser with UTF-8 support
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    // Ensure buffer is treated as UTF-8
    if (buf && buf.length) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '50mb',
  parameterLimit: 50000
}));

// Apply UTF-8 encoding middleware
app.use(ensureUTF8Encoding);
app.use(ensureUTF8Response);

// Routes
app.use('/api', routes);

// Rota de teste para verificar se o servidor está funcionando
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Tenta conectar ao MongoDB com configuração UTF-8, mas continua mesmo se falhar
mongoose.connect(config.MONGODB_URI, {
  // Configurações para suporte adequado a UTF-8
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  bufferMaxEntries: 0,
  // Configurar timeout e outras opções
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('Connected to MongoDB with UTF-8 support');
    
    // Configurar codificação UTF-8 no nível da conexão
    mongoose.connection.db.admin().command({ setParameter: 1, textSearchEnabled: true });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    console.log('Continuing without MongoDB connection...');
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
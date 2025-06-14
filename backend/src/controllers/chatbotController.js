/**
 * Controller to manage chatbot requests
 */

const { processMessage } = require('../services/chatbotService');
const { Readable } = require('stream');

/**
 * Processes a chat message and returns the response in streaming
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleChatMessage(req, res) {
  try {
    const { messages, conversationId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message format. An array of messages must be provided.'
      });
    }

    // Configure headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Process the message and get the response stream
    const stream = await processMessage(messages, { conversationId });

    // Pipe the stream directly to the response
    stream.on('data', (chunk) => {
      res.write(chunk);
    });

    stream.on('end', () => {
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Error in stream:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Stream error' });
      } else {
        res.write(`data: ${JSON.stringify({ role: 'system', content: 'An error occurred in the stream. Please try again.' })}

`);
        res.write('data: [DONE]

');
        res.end();
      }
    });
  } catch (error) {
    console.error('Error in chatbot controller:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Error processing chatbot message'
      });
    }

    res.write(`data: ${JSON.stringify({
      role: 'system',
      content: 'An error occurred while processing your message. Please try again.'
    })}

`);
    res.write('data: [DONE]

');
    res.end();
  }
}

/**
 * Gets information about the AI model used
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getModelInfo(req, res) {
  try {
    // Information about the AI model used
    const modelInfo = {
      name: 'AInovar Assistant',
      version: '1.0.0',
      baseModel: 'Gemma 7B Instruct',
      capabilities: [
        'Information about AInovar services',
        'Clarification of doubts about AI',
        'Solution suggestions based on use cases',
        'Initial service for potential clients'
      ],
      lastUpdated: '2025-04-02'
    };

    return res.json({ success: true, data: modelInfo });
  } catch (error) {
    console.error('Error obtaining model information:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obtaining model information'
    });
  }
}

module.exports = {
  handleChatMessage,
  getModelInfo
};

/**
 * Service to manage AInovar chatbot interactions
 */

const { SYSTEM_PROMPT } = require('../config/chatbotPrompt');
const { Readable } = require('stream');

/**
 * Prepares messages for sending to the AI model, including the system prompt
 * @param {Array} messages - User and assistant messages
 * @returns {Array} - Formatted messages including the system prompt
 */
function prepareMessages(messages) {
  // Adds the system prompt as the first message
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];
}

/**
 * Processes a user message and generates a response
 * @param {Array} messages - Conversation message history
 * @param {Object} options - Additional options like conversation ID
 * @returns {Promise<ReadableStream>} - Stream with the assistant's response
 */
async function processMessage(messages, options = {}) {
  try {
    const formattedMessages = prepareMessages(messages);

    // Temporary implementation for testing
    // Simulates a stream response
    return simulateStreamResponse(formattedMessages);
  } catch (error) {
    console.error('Error processing chatbot message:', error);
    throw error;
  }
}

/**
 * Temporary function to simulate streaming responses
 * Will be replaced by actual AI model integration
 */
function simulateStreamResponse(messages) {
  try {
    // Finds the last user message
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    console.log('User message:', userMessage);

    // Predefined responses based on keywords
    let response = '';

    if (userMessage.toLowerCase().includes('consulting')) {
      response = 'Our AI consulting offers viability analysis, process mapping, and opportunity identification for implementing Artificial Intelligence in your company. We can help identify the best use cases and calculate potential ROI. Would you like more information about a specific aspect of our consulting?';
    } else if (userMessage.toLowerCase().includes('development')) {
      response = 'AInovar offers custom AI solution development, including chatbots, predictive analysis systems, process automation, computer vision, and natural language processing. Our team of specialists works to create tailor-made solutions for your business\'s specific challenges. What type of solution are you interested in?';
    } else if (userMessage.toLowerCase().includes('price') || userMessage.toLowerCase().includes('cost') || userMessage.toLowerCase().includes('value')) {
      response = 'The prices of our solutions vary according to the complexity, scope, and specific needs of each project. To provide an accurate quote, we need to better understand your requirements. I recommend contacting us by email at luizvalois@ainovar.tech or filling out the form on our website to schedule a free initial consultation where we can discuss your project in detail.';
    } else if (userMessage.toLowerCase().includes('contact') || userMessage.toLowerCase().includes('talk')) {
      response = 'You can contact AInovar via email at luizvalois@ainovar.tech or by filling out the contact form on our website. Our team will respond as soon as possible, usually within 24 business hours. Would you like me to provide any other information?';
    } else if (userMessage.toLowerCase().includes('project') || userMessage.toLowerCase().includes('case')) {
      response = 'AInovar has several successful projects, such as the AInovar Platform (a complete AI platform for companies), intelligent chatbots with NLP for 24/7 service, and data analysis systems for demand forecasting and customer segmentation. Each project is customized to meet the specific needs of each client. Would you like to know more about any of these projects or do you have a specific challenge you would like to discuss?';
    } else if (userMessage.toLowerCase().includes('chatbot') || userMessage.toLowerCase().includes('chat bot') || userMessage.toLowerCase().includes('virtual assistant')) {
      response = 'AInovar develops intelligent chatbots and personalized virtual assistants that use natural language processing (NLP) and machine learning to offer natural and efficient interactions. Our chatbots can be integrated into websites, applications, WhatsApp, Telegram, and other platforms. They are capable of automating customer service, answering frequently asked questions, qualifying leads, scheduling appointments, and much more. Each solution is customized to meet the specific needs of your business, with training based on your content and integration with your existing systems. Would you like to know more about how a chatbot could benefit your company?';
    } else {
      response = 'Thank you for your contact! I am Gemma, AInovar\'s virtual assistant. We specialize in Artificial Intelligence solutions, including consulting, custom development, systems integration, and training. How can I help you today? If you have any questions about our services or how AI can benefit your company, I am at your disposal.';
    }

    console.log('Generated response:', response);

    // Creates a simulated stream with the response
    const stream = new Readable();
    stream._read = () => {}; // Necessary implementation of the _read method

    // Simulates sending the response in parts to mimic streaming
    const chunks = response.split(' ');
    let i = 0;

    const interval = setInterval(() => {
      if (i < chunks.length) {
        const chunk = chunks[i] + (i === chunks.length - 1 ? '' : ' '); // Add space except for the last chunk
        stream.push(`data: ${JSON.stringify({ role: 'assistant', content: chunk })}\n\n`);
        i++;
      } else {
        stream.push(`data: [DONE]\n\n`);
        stream.push(null); // Signals the end of the stream
        clearInterval(interval);
      }
    }, 50); // Interval in milliseconds to send chunks

    return stream;
  } catch (error) {
    console.error('Error simulating response:', error);
    // Creates an error stream
    const errorStream = new Readable();
    errorStream._read = () => {};
    errorStream.push(`data: ${JSON.stringify({ role: 'system', content: 'An error occurred while processing your message. Please try again.' })}\n\n`);
    errorStream.push(`data: [DONE]\n\n`);
    errorStream.push(null);
    return errorStream;
  }
}

module.exports = {
  processMessage,
  prepareMessages
};

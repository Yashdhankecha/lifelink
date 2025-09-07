import api from './api';

export const sendChatbotMessage = async (message) => {
  try {
    const response = await api.post('/chatbot', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chatbot message:', error);
    
    // Provide fallback response for network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        success: false,
        response: "I'm having trouble connecting right now. Please check your internet connection and try again. In the meantime, you can:\n\n• Check your dashboard for blood requests\n• Contact support directly\n• Try again in a few moments\n\nI'm here to help! 💙"
      };
    }
    
    throw error;
  }
};

export const getChatbotSuggestions = async () => {
  try {
    const response = await api.get('/chatbot/suggestions');
    return response.data;
  } catch (error) {
    console.error('Error getting chatbot suggestions:', error);
    
    // Return default suggestions if API fails
    return {
      success: true,
      suggestions: [
        "How to donate blood?",
        "Find nearby donors",
        "Create blood request",
        "Check donation eligibility",
        "Blood type compatibility",
        "Donation frequency",
        "What are the requirements?",
        "How often can I donate?",
        "Find donation centers",
        "Emergency blood request"
      ]
    };
  }
};

// Enhanced chatbot service with retry logic
export const sendChatbotMessageWithRetry = async (message, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await sendChatbotMessage(message);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Chatbot attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // All retries failed, return fallback response
  return {
    success: false,
    response: "I'm experiencing technical difficulties right now. Please try again later or contact our support team. I'm here to help with:\n\n• Blood donation information\n• Finding donors\n• Creating requests\n• Platform navigation\n\nThank you for your patience! 💙"
  };
};

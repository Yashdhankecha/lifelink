#!/usr/bin/env node

/**
 * Setup script for Groq API integration
 * This script helps you configure the Groq API key for the chatbot
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Life Link Chatbot - Groq AI Setup');
console.log('=====================================\n');

console.log('To use AI-powered responses in your chatbot, you need a Groq API key.');
console.log('Groq provides fast and affordable AI models for chatbots.\n');

console.log('Steps to get your Groq API key:');
console.log('1. Visit: https://console.groq.com/');
console.log('2. Sign up for a free account');
console.log('3. Go to API Keys section');
console.log('4. Create a new API key');
console.log('5. Copy the key and paste it below\n');

rl.question('Enter your Groq API key (or press Enter to skip): ', (apiKey) => {
  if (apiKey.trim()) {
    // Update the config.env file
    const configPath = path.join(__dirname, '..', 'config.env');
    
    try {
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // Replace the placeholder with the actual API key
      configContent = configContent.replace(
        'GROQ_API_KEY=your-groq-api-key-here',
        `GROQ_API_KEY=${apiKey.trim()}`
      );
      
      fs.writeFileSync(configPath, configContent);
      
      console.log('\n✅ Groq API key configured successfully!');
      console.log('Your chatbot will now use AI-powered responses.');
      console.log('\nTo test the chatbot:');
      console.log('1. Restart your server: npm start');
      console.log('2. Open the chatbot in your app');
      console.log('3. Try asking: "How to donate blood?"\n');
      
    } catch (error) {
      console.error('❌ Error updating config file:', error.message);
      console.log('\nPlease manually update your config.env file:');
      console.log(`GROQ_API_KEY=${apiKey.trim()}`);
    }
  } else {
    console.log('\n⏭️  Skipped API key setup.');
    console.log('The chatbot will use custom responses instead of AI.');
    console.log('You can run this script again later to set up AI responses.');
  }
  
  rl.close();
});

rl.on('close', () => {
  console.log('\n🚀 Happy coding!');
});

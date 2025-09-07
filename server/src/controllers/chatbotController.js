const Groq = require('groq-sdk');
const OpenAI = require('openai');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');

// Initialize AI services
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'your-groq-api-key-here'
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Custom knowledge base for blood donation
const bloodDonationKnowledge = {
  eligibility: {
    age: "You must be between 18-65 years old to donate blood",
    weight: "Minimum weight requirement is 50kg (110 lbs)",
    health: "You must be in good health, free from infections and diseases",
    medications: "Some medications may prevent donation - consult with medical staff",
    travel: "Recent travel to certain countries may affect eligibility",
    pregnancy: "Pregnant women cannot donate blood"
  },
  process: {
    registration: "1. Register and provide personal information\n2. Complete health questionnaire\n3. Medical screening (blood pressure, temperature, hemoglobin)\n4. Blood donation (10-15 minutes)\n5. Rest and refreshments",
    preparation: "Eat a healthy meal before donation, drink plenty of water, get good sleep",
    aftercare: "Rest for 15-20 minutes, drink extra fluids, avoid heavy lifting for 24 hours"
  },
  bloodTypes: {
    "O+": "Universal donor for positive blood types, can donate to O+, A+, B+, AB+",
    "O-": "Universal donor, can donate to all blood types",
    "A+": "Can donate to A+ and AB+",
    "A-": "Can donate to A+, A-, AB+, AB-",
    "B+": "Can donate to B+ and AB+",
    "B-": "Can donate to B+, B-, AB+, AB-",
    "AB+": "Universal recipient, can receive from all blood types",
    "AB-": "Can receive from A-, B-, AB-, O-"
  },
  frequency: {
    wholeBlood: "Every 56 days (8 weeks)",
    platelets: "Every 7 days, up to 24 times per year",
    plasma: "Every 28 days"
  }
};

// Function to generate AI response using Groq (with OpenAI fallback)
const generateAIResponse = async (message, userContext = {}) => {
  const systemPrompt = `You are a helpful and friendly AI assistant for Life Link, a blood donation platform. You help users with:

1. Blood donation information and eligibility requirements
2. Finding compatible donors and creating blood requests
3. General health and safety information about blood donation
4. Platform navigation and features
5. Emergency blood requests and urgent situations

User context: ${JSON.stringify(userContext)}

Blood donation knowledge:
- Eligibility: Age 18-65, weight 50kg+, good health, no recent illness
- Process: Registration → Health Screening → Donation (10-15 min) → Rest
- Blood types: O- (universal donor), O+ (universal donor for +), AB+ (universal recipient)
- Frequency: Whole blood every 56 days, platelets every 7 days
- Safety: Extremely safe with proper screening and sterile equipment

Guidelines:
- Be encouraging and supportive about blood donation
- Use emojis to make responses more engaging
- Provide clear, actionable information
- For emergencies, prioritize urgent actions
- If unsure about platform specifics, suggest contacting support
- Keep responses concise but informative
- Use markdown formatting for better readability

Always be helpful, accurate, and encouraging about blood donation. Remember that blood donation saves lives!`;

  // Try Groq first (faster and cheaper)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here') {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama3-8b-8192", // Fast and efficient model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error);
      // Fall through to OpenAI or custom response
    }
  }

  // Try OpenAI as fallback
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fall through to custom response
    }
  }

  // Use custom responses as final fallback
  console.log('Using custom responses - no AI API keys configured');
  return generateCustomResponse(message, userContext);
};

// Custom response system (fallback when AI is not available)
const generateCustomResponse = (message, userContext) => {
  const lowerMessage = message.toLowerCase();

  // Blood donation eligibility
  if (lowerMessage.includes('eligib') || lowerMessage.includes('can i donate') || lowerMessage.includes('requirements')) {
    return `🩸 **Blood Donation Eligibility Requirements**

To donate blood, you need to meet these requirements:

**Basic Requirements:**
• **Age**: 18-65 years old
• **Weight**: At least 50kg (110 lbs)
• **Health**: Good health, no infections or diseases
• **Medications**: Some medications may prevent donation
• **Travel**: Recent travel restrictions may apply
• **Pregnancy**: Not pregnant or breastfeeding

**Health Conditions:**
• No recent illness or infection
• Blood pressure within normal range
• Hemoglobin level adequate (12.5g/dL for women, 13.0g/dL for men)
• No history of certain diseases (hepatitis, HIV, etc.)

I recommend consulting with our medical staff for a complete eligibility assessment. Would you like me to help you find nearby donation centers? 🏥`;
  }

  // Blood donation process
  if (lowerMessage.includes('process') || lowerMessage.includes('how to donate') || lowerMessage.includes('steps')) {
    return `🩸 **Complete Blood Donation Process**

**Step-by-Step Process:**
1. **Registration** 📝: Provide personal information and valid ID
2. **Health Screening** 🩺: Complete questionnaire and medical check
3. **Donation** 💉: The actual donation takes 10-15 minutes
4. **Rest & Refreshments** ☕: Relax for 15-20 minutes with snacks

**Before Donating (Preparation):**
• Eat a healthy meal 2-3 hours before
• Drink plenty of water (at least 16oz)
• Get good sleep the night before
• Avoid alcohol 24 hours before
• Bring a valid ID

**After Donating (Recovery):**
• Rest for 15-20 minutes
• Drink extra fluids for 24 hours
• Avoid heavy lifting for 24 hours
• Keep the bandage on for 4-6 hours
• Eat iron-rich foods

**What to Expect:**
• Total time: 45-60 minutes
• Blood drawn: 1 pint (450ml)
• Pain level: Minimal (like a small pinch)

Ready to make a difference? I can help you find nearby donation centers! 🏥✨`;
  }

  // Blood types
  if (lowerMessage.includes('blood type') || lowerMessage.includes('compatible') || lowerMessage.includes('o+') || lowerMessage.includes('a+') || lowerMessage.includes('b+') || lowerMessage.includes('ab+')) {
    return `🩸 **Blood Type Compatibility Guide**

**Universal Donors (Most Needed!):**
• **O-** 🟢: Can donate to ALL blood types (Universal donor)
• **O+** 🟡: Can donate to O+, A+, B+, AB+ (Most common)

**Universal Recipients:**
• **AB+** 🔵: Can receive from ALL blood types (Universal recipient)
• **AB-** 🟣: Can receive from A-, B-, AB-, O-

**Other Blood Types:**
• **A+** 🟠: Can donate to A+, AB+
• **A-** 🔴: Can donate to A+, A-, AB+, AB-
• **B+** 🟤: Can donate to B+, AB+
• **B-** ⚫: Can donate to B+, B-, AB+, AB-

**Your Blood Type:** ${userContext.bloodGroup || 'Not specified in your profile'}

**Fun Facts:**
• O- is the most needed blood type (only 7% of population)
• AB+ is the rarest blood type (only 3% of population)
• One donation can save up to 3 lives!

Would you like to know more about your specific blood type or find compatible donors? 🔍`;
  }

  // Finding donors
  if (lowerMessage.includes('find donor') || lowerMessage.includes('nearby donor') || lowerMessage.includes('search donor')) {
    return `🔍 **Find Blood Donors - Step by Step**

**How to Find Donors:**
1. **Location Search** 📍: Find donors in your area
2. **Blood Type Filter** 🩸: Match compatible blood types
3. **Availability Check** ✅: See who's currently available
4. **Direct Contact** 💬: Send messages to potential donors

**Quick Actions I Can Help With:**
• 🔍 Search for donors in your area
• 📝 Create a blood request
• 🔔 Set up notifications for new donors
• 📊 Check donor availability
• 🏥 Find nearby donation centers

**Your Location:** ${userContext.location ? `${userContext.location.city}, ${userContext.location.state}` : 'Not specified'}

**Pro Tips:**
• O- and O+ donors are most versatile
• Check donor's last donation date
• Look for donors with recent activity

What blood type are you looking for? I can help you search right now! 🚀`;
  }

  // Creating requests
  if (lowerMessage.includes('create request') || lowerMessage.includes('request blood') || lowerMessage.includes('need blood')) {
    return `🆘 **Create Blood Request - Emergency Ready**

**Required Information:**
• **Blood Type** 🩸: Specific type needed (A+, B-, O+, etc.)
• **Units Required** 📊: Number of blood units needed
• **Hospital/Location** 🏥: Where the blood is needed
• **Urgency Level** ⚡: Emergency, Urgent, or Normal
• **Contact Information** 📞: Phone number for coordination
• **Patient Details** 👤: Name and condition (optional)

**Simple Steps:**
1. 📝 Go to "Create Request" in your dashboard
2. ✍️ Fill in the required details
3. 📤 Submit your request
4. 🔔 Donors will be notified automatically
5. 💬 Coordinate with matching donors

**Emergency Features:**
• 🚨 Priority notification for urgent cases
• 📍 Location-based donor matching
• ⏰ Real-time availability updates
• 💬 Direct messaging with donors

I can guide you through the process step by step. What blood type do you need? 🩸`;
  }

  // Donation frequency
  if (lowerMessage.includes('how often') || lowerMessage.includes('frequency') || lowerMessage.includes('when can i donate again')) {
    return `⏰ **Blood Donation Frequency Guide**

**Donation Intervals:**
• **Whole Blood** 🩸: Every 56 days (8 weeks)
• **Platelets** 🧬: Every 7 days (up to 24 times per year)
• **Plasma** 💧: Every 28 days
• **Double Red Cells** 🔴: Every 112 days (16 weeks)

**Your Donation History:**
• **Last Donation**: ${userContext.lastDonationDate ? new Date(userContext.lastDonationDate).toLocaleDateString() : 'Not recorded'}
• **Next Eligible**: ${userContext.lastDonationDate ? new Date(new Date(userContext.lastDonationDate).getTime() + 56 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'Not available'}

**Health Benefits of Regular Donation:**
• 🩺 Free health screening
• ❤️ Reduces risk of heart disease
• 🔄 Stimulates blood cell production
• 🧠 May reduce risk of certain cancers

**Pro Tips:**
• Set calendar reminders for your next donation
• Track your donation history in your profile
• Consider platelet donation for more frequent giving

I can help you track your donation history and remind you when you're eligible to donate again! 📅✨`;
  }

  // General help
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `🤖 **Hi! I'm your Life Link Assistant** - Your Blood Donation Companion!

I'm here to help you with everything related to blood donation and the Life Link platform:

🩸 **Blood Donation Information**
• ✅ Eligibility requirements & health screening
• 📋 Complete donation process guide
• 🩸 Blood type compatibility charts
• ⏰ Donation frequency & scheduling
• 🏥 Finding donation centers

🔍 **Finding & Connecting**
• 👥 Search for compatible donors
• 📝 Create emergency blood requests
• 📍 Location-based donor matching
• 💬 Direct messaging with donors
• 🔔 Real-time notifications

📱 **Platform Features**
• 🏠 Dashboard navigation & shortcuts
• 📊 Request management & tracking
• 📈 Donation history & statistics
• ⚙️ Profile management
• 🔐 Account security

💡 **Try These Quick Commands:**
• "How to donate blood?"
• "Find nearby donors"
• "Create blood request"
• "Check donation eligibility"
• "Blood type compatibility"
• "When can I donate again?"

**Your Profile:** ${userContext.name ? `Welcome back, ${userContext.name}!` : 'Welcome to Life Link!'}

What would you like to know more about? I'm here to help! 💙`;
  }

  // Emergency/urgent requests
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('critical')) {
    return `🚨 **EMERGENCY BLOOD REQUEST - PRIORITY ASSISTANCE**

I understand this is urgent! Here's how to get help quickly:

**Immediate Actions:**
1. 🆘 Create an emergency blood request NOW
2. 📞 Contact local blood banks directly
3. 🔔 Enable urgent notifications
4. 📍 Search for nearby donors immediately

**Emergency Features:**
• ⚡ Priority notification to all compatible donors
• 📱 Real-time alerts and updates
• 🏥 Direct hospital coordination
• 💬 Instant messaging with available donors

**Quick Emergency Commands:**
• "Create emergency request"
• "Find urgent donors"
• "Contact blood bank"
• "Emergency blood type [your type]"

**Your Location:** ${userContext.location ? `${userContext.location.city}, ${userContext.location.state}` : 'Please update your location for faster matching'}

**Blood Type:** ${userContext.bloodGroup || 'Please specify your blood type'}

I'm here to help you get the blood you need as quickly as possible! 🚨💙`;
  }

  // Health and safety questions
  if (lowerMessage.includes('safe') || lowerMessage.includes('risk') || lowerMessage.includes('side effect') || lowerMessage.includes('pain')) {
    return `🛡️ **Blood Donation Safety & Health Information**

**Is Blood Donation Safe?**
✅ **YES!** Blood donation is extremely safe when done at licensed centers.

**Safety Measures:**
• 🩺 Professional medical staff supervision
• 🧼 Sterile, single-use equipment
• 🔬 Rigorous health screening
• 📋 Comprehensive medical history review
• 🧪 Blood testing for infections

**Common Side Effects (Mild & Temporary):**
• 💫 Lightheadedness (15-20 minutes)
• 🩸 Minor bruising at needle site
• 😴 Mild fatigue (few hours)
• 🥶 Feeling cold (normal)

**Rare Complications:**
• Fainting (less than 1% of donors)
• Nausea (very rare)
• Allergic reactions (extremely rare)

**Prevention Tips:**
• 🍎 Eat a good meal 2-3 hours before
• 💧 Drink plenty of water
• 😴 Get adequate sleep
• 🚫 Avoid alcohol 24 hours before

**Your Health:** The screening process ensures your safety and the safety of recipients.

Need more specific health information? I'm here to help! 🏥✨`;
  }

  // Default response
  return `🤔 **I understand you're asking about "${message}"**

I'm your Life Link assistant, specialized in blood donation information and platform navigation. 

**I can help you with:**
• 🩸 Blood donation eligibility & requirements
• 🔍 Finding compatible donors in your area
• 📝 Creating emergency blood requests
• 🩸 Understanding blood type compatibility
• ⏰ Donation frequency & scheduling
• 🏥 Finding nearby donation centers
• 📱 Platform features & navigation

**Try asking me:**
• "How to donate blood?"
• "Find nearby donors"
• "Create blood request"
• "Check donation eligibility"
• "Blood type compatibility"
• "When can I donate again?"

**Your Profile:** ${userContext.name ? `Hi ${userContext.name}!` : 'Welcome!'} ${userContext.bloodGroup ? `Your blood type is ${userContext.bloodGroup}.` : ''}

I'm here to assist you with all your blood donation needs! 💙✨`;
};

// Main chatbot controller
const handleChatbotMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user context for personalized responses
    let userContext = {};
    if (userId) {
      try {
        const user = await User.findById(userId).select('name bloodGroup lastDonationDate location');
        if (user) {
          userContext = {
            name: user.name,
            bloodGroup: user.bloodGroup,
            lastDonationDate: user.lastDonationDate,
            location: user.location
          };
        }
      } catch (error) {
        console.error('Error fetching user context:', error);
      }
    }

    // Generate AI response
    const response = await generateAIResponse(message, userContext);

    // Log the conversation (optional)
    console.log(`Chatbot - User: ${userId || 'anonymous'}, Message: ${message}, Response: ${response.substring(0, 100)}...`);

    res.status(200).json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get chatbot suggestions
const getChatbotSuggestions = async (req, res) => {
  try {
    const suggestions = [
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
    ];

    res.status(200).json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
};

module.exports = {
  handleChatbotMessage,
  getChatbotSuggestions
};

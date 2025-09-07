const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if email configuration is properly set
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please check your environment variables.');
  }

  // Check if using placeholder values
  if (process.env.EMAIL_USER.includes('your-email') || process.env.EMAIL_PASS.includes('your-app-password')) {
    throw new Error('Please update your email credentials in config.env file.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection configuration
  await transporter.verify();

  const message = {
    from: `Life Link <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html || options.message,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
  return info;
};

// Send OTP email
const sendOTPEmail = async (email, otp, userType) => {
  const subject = 'Verify Your Email - Life Link';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; margin: 0;">🩸 Life Link</h1>
        <p style="color: #666; margin: 5px 0;">Blood Donation Platform</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">Email Verification Required</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Thank you for registering as a <strong>${userType}</strong> on Life Link! 
          To complete your registration, please verify your email address using the OTP below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #dc2626; color: white; font-size: 32px; font-weight: bold; 
                      padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6;">
          <strong>Important:</strong>
        </p>
        <ul style="color: #4b5563; line-height: 1.6;">
          <li>This OTP is valid for 10 minutes only</li>
          <li>Do not share this OTP with anyone</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p>This email was sent by Life Link Blood Donation Platform</p>
        <p>© 2024 Life Link. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject,
    html
  });
};

module.exports = { sendEmail, sendOTPEmail };

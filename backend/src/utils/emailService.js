import nodemailer from 'nodemailer';

// Generate a 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a transporter using system Gmail credentials from .env
const getSystemTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email service is not configured. Please add EMAIL_USER and EMAIL_PASSWORD to .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send verification email using system Gmail account
export const sendVerificationEmail = async (userEmail, verificationCode) => {
  try {
    const transporter = getSystemTransporter();

    // Test the connection first
    await transporter.verify();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Email Verification Code - KARMIN\'S DORMITORY',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
          <p style="color: #666; margin-bottom: 15px;">Thank you for registering with KARMIN'S DORMITORY.</p>
          <p style="color: #666; margin-bottom: 20px;">Please use the verification code below to verify your email address:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
          </div>
          
          <p style="color: #666; margin-bottom: 10px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this verification code, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">KARMIN'S DORMITORY © 2025</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Verification email sent to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send verification email:', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send account created email using system Gmail account
export const sendAccountCreatedEmail = async (userEmail, name) => {
  try {
    const transporter = getSystemTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Account Created Successfully - KARMIN\'S DORMITORY',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to KARMIN'S DORMITORY</h2>
          <p style="color: #666; margin-bottom: 15px;">Hi ${name},</p>
          <p style="color: #666; margin-bottom: 15px;">Your account has been successfully created and verified. You can now log in to the system using your email and password.</p>
          
          <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; border-radius: 5px; margin: 20px 0;">
            <p style="color: #155724; margin: 0;">✓ Email verified successfully</p>
          </div>
          
          <p style="color: #666; margin-bottom: 20px;">You can now:</p>
          <ul style="color: #666; margin-bottom: 20px;">
            <li>Browse available rooms</li>
            <li>Submit room assignment requests</li>
            <li>View your assignments</li>
            <li>Manage your profile</li>
          </ul>
          
          <p style="color: #666; margin-bottom: 20px;">If you have any questions, please contact our support team.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">KARMIN'S DORMITORY © 2025</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Account created email sent to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send account created email:', error.message);
    // Don't throw - welcome email is not critical
    return true;
  }
};

// Send password reset email using system Gmail account
export const sendPasswordResetEmail = async (userEmail, resetCode) => {
  try {
    const transporter = getSystemTransporter();

    // Test the connection first
    await transporter.verify();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Password Reset Code - KARMIN\'S DORMITORY',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #666; margin-bottom: 15px;">We received a request to reset your password for KARMIN'S DORMITORY.</p>
          <p style="color: #666; margin-bottom: 20px;">Please use the code below to reset your password:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #dc3545; letter-spacing: 5px; margin: 0;">${resetCode}</h1>
          </div>
          
          <p style="color: #666; margin-bottom: 10px;">This code will expire in 5 minutes.</p>
          <p style="color: #999; font-size: 12px;"><strong>Important:</strong> If you did not request a password reset, please ignore this email. Your account is secure.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">KARMIN'S DORMITORY © 2025</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send password reset email:', error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

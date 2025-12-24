// ============================================
// FILE: config/emailService.js
// Purpose: Email service using SendGrid API
// ============================================

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log('[EMAIL] SendGrid initialized');
console.log('[EMAIL] From:', process.env.EMAIL_FROM);

// ==========================================
// EMAIL TEMPLATES
// ==========================================

// Template: Email Verification (Gmail-Optimized with Inline CSS)
const getVerificationEmailTemplate = (userName, verificationUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - LinguaKu</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;line-height:1.6;">
  <!-- Preheader text for inbox preview -->
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Verify your LinguaKu account to get started with language learning
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:600px;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#667eea;padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;letter-spacing:0.5px;">LinguaKu</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:18px;color:#1a1a1a;margin:0 0 16px 0;font-weight:500;">Hello, ${userName}</p>
              
              <p style="font-size:15px;color:#4a4a4a;margin:0 0 12px 0;">Thank you for signing up for LinguaKu. To complete your registration and start learning languages, please verify your email address.</p>
              
              <p style="font-size:15px;color:#4a4a4a;margin:0 0 28px 0;">Click the button below to verify your account:</p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display:inline-block;padding:14px 32px;background-color:#667eea;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;font-family:Arial,sans-serif;">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="margin:32px 0;height:1px;background-color:#e0e0e0;"></div>
              
              <!-- Alternative Link -->
              <div style="padding:20px;background-color:#f8f9fa;border-radius:6px;border:1px solid #e9ecef;">
                <p style="font-size:13px;color:#6c757d;margin:0 0 8px 0;font-weight:500;">If the button doesn't work, copy and paste this link into your browser:</p>
                <a href="${verificationUrl}" style="color:#667eea;font-size:13px;word-break:break-all;text-decoration:none;">${verificationUrl}</a>
              </div>
              
              <!-- Info Box -->
              <div style="margin-top:24px;padding:16px;background-color:#fff8e1;border-left:3px solid #ffc107;border-radius:4px;">
                <p style="font-size:13px;color:#7d6608;margin:4px 0;"><strong>Important:</strong> This verification link will expire in 24 hours.</p>
                <p style="font-size:13px;color:#7d6608;margin:4px 0;">If you didn't create an account with LinguaKu, please ignore this email.</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;background-color:#fafafa;border-top:1px solid #e0e0e0;">
              <p style="font-size:13px;color:#9e9e9e;margin:6px 0;">This is an automated email. Please do not reply.</p>
              <p style="font-size:13px;color:#9e9e9e;margin:6px 0;">&copy; 2024 LinguaKu. All rights reserved.</p>
              <p style="font-size:13px;color:#9e9e9e;margin:6px 0;">
                LinguaKu Language Learning Platform
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Template: Password Reset (Gmail-Optimized with Inline CSS)
const getResetPasswordEmailTemplate = (userName, resetUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - LinguaKu</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;line-height:1.6;">
  <!-- Preheader text -->
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Reset your LinguaKu password - link expires in 10 minutes
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:600px;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#dc3545;padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;letter-spacing:0.5px;">LinguaKu</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:18px;color:#1a1a1a;margin:0 0 16px 0;font-weight:500;">Hello, ${userName}</p>
              
              <p style="font-size:15px;color:#4a4a4a;margin:0 0 12px 0;">We received a request to reset the password for your LinguaKu account.</p>
              
              <p style="font-size:15px;color:#4a4a4a;margin:0 0 28px 0;">Click the button below to create a new password:</p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background-color:#dc3545;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;font-family:Arial,sans-serif;">Reset Password</a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="margin:32px 0;height:1px;background-color:#e0e0e0;"></div>
              
              <!-- Alternative Link -->
              <div style="padding:20px;background-color:#f8f9fa;border-radius:6px;border:1px solid #e9ecef;">
                <p style="font-size:13px;color:#6c757d;margin:0 0 8px 0;font-weight:500;">If the button doesn't work, copy and paste this link into your browser:</p>
                <a href="${resetUrl}" style="color:#dc3545;font-size:13px;word-break:break-all;text-decoration:none;">${resetUrl}</a>
              </div>
              
              <!-- Warning Box -->
              <div style="margin-top:24px;padding:16px;background-color:#fff5f5;border-left:3px solid #dc3545;border-radius:4px;">
                <p style="font-size:13px;color:#c53030;margin:4px 0;"><strong>Important:</strong> This password reset link will expire in 10 minutes.</p>
                <p style="font-size:13px;color:#c53030;margin:4px 0;"><strong>Note:</strong> This link can only be used once.</p>
              </div>
              
              <!-- Security Box -->
              <div style="margin-top:16px;padding:16px;background-color:#e6f7ff;border-left:3px solid #1890ff;border-radius:4px;">
                <p style="font-size:13px;color:#0050b3;margin:4px 0;"><strong>Security Notice:</strong></p>
                <ul style="margin:8px 0 0 0;padding-left:20px;">
                  <li style="font-size:13px;color:#0050b3;margin:4px 0;">If you didn't request a password reset, please ignore this email</li>
                  <li style="font-size:13px;color:#0050b3;margin:4px 0;">Never share this link with anyone</li>
                  <li style="font-size:13px;color:#0050b3;margin:4px 0;">After resetting your password, you'll need to log in again</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;background-color:#fafafa;border-top:1px solid #e0e0e0;">
              <p style="font-size:13px;color:#9e9e9e;margin:6px 0;">This is an automated email. Please do not reply.</p>
              <p style="font-size:13px;color:#9e9e9e;margin:6px 0;">&copy; 2024 LinguaKu. All rights reserved.</p>
              <p style="font-size:13px;color:#9e9e9e;margin:6px 0;">
                LinguaKu Language Learning Platform
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// ==========================================
// SEND VERIFICATION EMAIL
// ==========================================
const sendVerificationEmail = async (email, token, userName) => {
  try {
    console.log('[EMAIL] Preparing verification email for:', email);
    
    // Build verification URL - Use HTTP/HTTPS for Gmail compatibility
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    
    console.log('[EMAIL] Verification URL:', verificationUrl);
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'LinguaKu Support <pembasmitugaskebutsemalam@gmail.com>',
      subject: 'Verify Your Email - LinguaKu',
      html: getVerificationEmailTemplate(userName, verificationUrl)
    };

    console.log('[EMAIL] Sending via SendGrid to:', email);
    const response = await sgMail.send(msg);
    
    console.log('[EMAIL] ✅ Verification email sent successfully');
    console.log('[EMAIL] Status:', response[0].statusCode);
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send verification email');
    console.error('[EMAIL ERROR] Error:', error.message);
    if (error.response) {
      console.error('[EMAIL ERROR] Response body:', error.response.body);
    }
    throw new Error('Failed to send verification email: ' + error.message);
  }
};

// ==========================================
// SEND PASSWORD RESET EMAIL
// ==========================================
const sendResetPasswordEmail = async (email, token, userName) => {
  try {
    console.log('[EMAIL] Preparing reset password email for:', email);
    
    // Build reset URL - Use HTTP/HTTPS for Gmail compatibility
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const resetUrl = `${baseUrl}/api/auth/reset-password/${token}`;
    
    console.log('[EMAIL] Reset URL:', resetUrl);
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'LinguaKu Support <pembasmitugaskebutsemalam@gmail.com>',
      subject: 'Reset Your Password - LinguaKu',
      html: getResetPasswordEmailTemplate(userName, resetUrl)
    };

    console.log('[EMAIL] Sending via SendGrid to:', email);
    const response = await sgMail.send(msg);
    
    console.log('[EMAIL] ✅ Reset password email sent successfully');
    console.log('[EMAIL] Status:', response[0].statusCode);
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send reset password email');
    console.error('[EMAIL ERROR] Error:', error.message);
    if (error.response) {
      console.error('[EMAIL ERROR] Response body:', error.response.body);
    }
    throw new Error('Failed to send reset password email: ' + error.message);
  }
};

// ==========================================
// TEST SENDGRID CONNECTION
// ==========================================
const testEmailConnection = async () => {
  try {
    console.log('[EMAIL] Testing SendGrid connection...');
    // SendGrid doesn't have a direct verify method, so we'll just check if API key is set
    if (process.env.SENDGRID_API_KEY) {
      console.log('[EMAIL] SendGrid API key configured ✅');
      return true;
    } else {
      console.error('[EMAIL ERROR] SendGrid API key not found');
      return false;
    }
  } catch (error) {
    console.error('[EMAIL ERROR] SendGrid connection test failed:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  testEmailConnection
};

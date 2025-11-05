// sendOtp.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY || !process.env.SENDER_EMAIL) {
  console.warn('⚠️ Missing SENDGRID_API_KEY or SENDER_EMAIL in environment. Emails will not be sent.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid configured successfully');
}

const sendOtp = async (email, otp) => {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDER_EMAIL) {
      console.warn('SendGrid not configured. Skipping email send.');
      return { skipped: true };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>OTP Verification</h2>
        <p>Your one-time password is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #007BFF;">${otp}</p>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `;

    const msg = {
      to: email,
      from: process.env.SENDER_EMAIL, // Must be a verified sender in SendGrid
      subject: 'Your OTP for Verification',
      text: `Your one-time password is: ${otp}. This OTP is valid for 5 minutes.`,
      html,
    };

    const response = await sgMail.send(msg);
    console.log(`📧 OTP email sent to ${email}. SendGrid Response:`, response[0].statusCode);
    return { success: true, status: response[0].statusCode };
  } catch (err) {
    console.error('❌ Error sending OTP via SendGrid:', err.message || err);
    throw err;
  }
};

export default sendOtp;

const nodemailer = require("nodemailer");
const { success, error } = require("../utils/response");

const sendContactEmail = async (req, res, next) => {
  try {
    const { fname, lname, email, phone, subject, message } = req.body;

    if (!fname || !email || !subject || !message) {
      return error(res, "First name, email, subject, and message are required", 400);
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.error("SMTP not configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env");
      return error(res, "Email service is not configured. Please contact the administrator.", 500);
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
    });

    const recipient = process.env.CONTACT_RECIPIENT || "igiraneza029@gmail.com";
    const fullName = `${fname}${lname ? ` ${lname}` : ""}`;

    await transporter.sendMail({
      from: `"${fullName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      replyTo: email,
      to: recipient,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a4a2e;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Name:</td><td style="padding: 8px;">${fullName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${email}</td></tr>
            ${phone ? `<tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${phone}</td></tr>` : ""}
            <tr><td style="padding: 8px; font-weight: bold;">Subject:</td><td style="padding: 8px;">${subject}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <h3 style="margin: 0 0 8px; color: #333;">Message:</h3>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #e0e0e0;" />
          <p style="color: #888; font-size: 12px;">Sent from Muganga SACCO Contact Form</p>
        </div>
      `,
    });

    console.log(`Contact email sent from ${email} about "${subject}"`);

    return success(res, null, "Your message has been sent successfully. We'll respond within 24 hours.");
  } catch (err) {
    console.error("Contact email error:", err.message);
    return error(res, "Failed to send message. Please try again later.", 500);
  }
};

module.exports = { sendContactEmail };

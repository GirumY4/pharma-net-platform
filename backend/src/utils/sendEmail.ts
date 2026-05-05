// src/utils/sendEmail.ts
import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // 1. Create a transporter (Using ethereal.email for fake dev emails, or your own SMTP)
  // For local development, using a generic test setup or simply logging the link is common.
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || "test_user",
      pass: process.env.SMTP_PASSWORD || "test_pass",
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || "Pharma-Net Admin"} <${process.env.FROM_EMAIL || "noreply@pharmanet.com"}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // In a real production app, this sends the email.
  // For development, if SMTP isn't set up, we will just log the message to the console.
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    console.log("\n--- 📧 EMAIL MOCK (Dev Mode) ---");
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.message}`);
    console.log("--------------------------------\n");
    return;
  }

  await transporter.sendMail(message);
};

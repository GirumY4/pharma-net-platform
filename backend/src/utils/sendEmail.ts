// src/utils/sendEmail.ts
import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromName = process.env.FROM_NAME || "Pharma-Net Admin";
  const fromEmail = process.env.FROM_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\n--- EMAIL MOCK (Dev Mode) ---");
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.message}`);
      if (options.html) {
        console.log(`HTML Content: [Present]`);
      }
      console.log("-----------------------------\n");
      return;
    }

    throw new Error(
      "SMTP configuration is incomplete. Check SMTP_HOST, SMTP_EMAIL, SMTP_PASSWORD, and FROM_EMAIL.",
    );
  }

  // Explicitly typing the config to avoid "No overload matches this call" error
  const transportConfig: any = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort === 587,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    family: 4,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  };

  try {
    const transporter = nodemailer.createTransport(transportConfig);

    const message = {
      from: `${fromName} <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    await transporter.sendMail(message);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️ SMTP email sending failed. Falling back to Mock console log in Dev Mode.");
      console.error("SMTP Error Details:", error);
      console.log("\n--- EMAIL MOCK (Dev Mode) ---");
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.message}`);
      if (options.html) {
        console.log(`HTML Content: [Present]`);
      }
      console.log("-----------------------------\n");
      return;
    }
    throw error;
  }
};

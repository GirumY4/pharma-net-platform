import type { NextFunction, Request, Response } from "express";
import { sendEmail } from "../../utils/sendEmail.js";

const SUPPORT_EMAIL = "groomyas8@gmail.com";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const sendContactMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name || !email || !message) {
      const error = new Error(
        "VALIDATION_ERROR: Name, email, and message are required.",
      ) as any;
      error.statusCode = 400;
      return next(error);
    }

    if (!isEmail(email)) {
      const error = new Error(
        "VALIDATION_ERROR: Please provide a valid email address.",
      ) as any;
      error.statusCode = 400;
      return next(error);
    }

    const submittedAt = new Date().toISOString();
    const textBody = `New Alyah Pharma Net contact message

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Submitted: ${submittedAt}

Message:
${message}`;

    const htmlBody = `
<!doctype html>
<html lang="en">
  <body style="margin:0; padding:24px; background:#F8FAFC; font-family:Arial, sans-serif; color:#17231F;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:16px; overflow:hidden;">
      <tr>
        <td style="background:#0F5E4D; padding:24px 28px;">
          <h1 style="margin:0; color:#FFFFFF; font-size:24px;">New contact message</h1>
          <p style="margin:6px 0 0; color:rgba(255,255,255,0.74); font-size:14px;">Alyah Pharma Net support form</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 10px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 10px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 10px;"><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
          <p style="margin:0 0 18px;"><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
          <div style="padding:18px; border-left:4px solid #DDAA4A; background:#FFFBEB; border-radius:12px;">
            <p style="margin:0; white-space:pre-line; line-height:1.65;">${escapeHtml(message)}</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await sendEmail({
      email: SUPPORT_EMAIL,
      subject: `Alyah Pharma Net support message from ${name}`,
      message: textBody,
      html: htmlBody,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
      data: { deliveredTo: SUPPORT_EMAIL },
    });
  } catch (error) {
    next(error);
  }
};

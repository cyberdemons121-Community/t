import nodemailer from "nodemailer";
import { config, missingEnv } from "./config.js";

let transporter;

function client() {
  const required = missingEnv(["smtpUser", "smtpAppPassword"]);
  if (required.length) {
    throw new Error(`Missing email config: ${required.join(", ")}`);
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.smtpUser, pass: config.smtpAppPassword },
    });
  }
  return transporter;
}

function baseUrl() {
  if (config.appUrl) return config.appUrl.replace(/\/$/, "");
  return `http://localhost:${config.port}`;
}

export async function sendVerificationMail({ to, eventName, uniqueId, token, details, files, attachments }) {
  const url = `${baseUrl()}/api/verify?token=${encodeURIComponent(token)}`;
  const rows = Object.entries(details)
    .map(([key, value]) => `<tr><td style="padding:4px 8px;color:#9aa4b2">${escapeHtml(key)}</td><td style="padding:4px 8px">${escapeHtml(String(value))}</td></tr>`)
    .join("");
  const fileList = files.length
    ? files.map((file) => `<li>${escapeHtml(file)}</li>`).join("")
    : "<li>None</li>";

  await client().sendMail({
    from: config.fromEmail,
    to: config.adminEmail,
    replyTo: to,
    subject: `[VERIFY ${uniqueId}] ${eventName} registration`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>New registration: ${escapeHtml(eventName)}</h2>
        <p><strong>Unique ID:</strong> ${escapeHtml(uniqueId)}<br/><strong>Reply-to:</strong> ${escapeHtml(to)}</p>
        <table style="border-collapse:collapse;margin:16px 0">${rows}</table>
        <p><strong>Attachments:</strong></p><ul>${fileList}</ul>
        <p>Click the button below to approve this registration. The participant will be emailed their login credentials automatically.</p>
        <p><a href="${url}" style="background:#e01b2e;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block;border-radius:4px">Mark verified &amp; send credentials</a></p>
        <p style="font-size:12px;color:#777">Or open: ${url}</p>
      </div>
    `,
    attachments,
  });
}

export async function sendConfirmationMail({ to, name, uniqueId, password, eventName }) {
  const loginUrl = `${baseUrl()}/login.html`;
  await client().sendMail({
    from: config.fromEmail,
    to,
    subject: `You're verified — ${eventName} login credentials`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>Registration verified</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your ${escapeHtml(eventName)} registration has been verified. Use the credentials below to log in.</p>
        <p style="background:#f4f4f5;padding:16px;border:1px solid #ddd">
          <strong>Unique ID:</strong> ${escapeHtml(uniqueId)}<br/>
          <strong>Password:</strong> ${escapeHtml(password)}
        </p>
        <p><a href="${loginUrl}" style="background:#111;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block;border-radius:4px">Go to login</a></p>
        <p style="font-size:12px;color:#777">Keep this mail private. If you did not register, contact ${escapeHtml(config.adminEmail)}.</p>
      </div>
    `,
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const handler = {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const expected = process.env.MAIL_RELAY_SECRET || "";
    const supplied = request.headers.get("x-relay-secret") || "";
    if (!expected || supplied !== expected) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    if (!smtpUser || !smtpPass) {
      return json({ ok: false, error: "SMTP not configured" }, 500);
    }

    let payload: MailPayload;
    try {
      payload = (await request.json()) as MailPayload;
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    if (!payload.to || !payload.subject) {
      return json({ ok: false, error: "to and subject are required" }, 400);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });

    try {
      const info = await transporter.sendMail({
        from: smtpUser,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return json({ ok: true, messageId: info.messageId || null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Gmail relay send failed:", message);
      return json({ ok: false, error: message }, 502);
    }
  },
};

export default handler;

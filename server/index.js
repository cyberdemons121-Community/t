import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import {
  appendRegistration,
  findByToken,
  findByIdentifier,
  markVerified,
} from "./sheets.js";
import { sendConfirmationMail, sendVerificationMail } from "./mail.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

app.use(express.json({ limit: "1mb" }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function uniqueId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CDH-${time}-${random}`;
}

function displayName(details) {
  return (
    details.captain ||
    details.teamName ||
    details.handle ||
    details.email ||
    "Participant"
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/api/register",
  upload.fields([
    { name: "ppt", maxCount: 1 },
    { name: "paymentScreenshot", maxCount: 1 },
  ]),
  asyncRoute(async (req, res) => {
    const { eventName, eventId, ...details } = req.body;
    if (!eventName || !details.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      return res.status(400).json({ ok: false, error: "A valid event and email are required." });
    }

    const uploads = req.files || {};
    const files = Object.values(uploads).flat();
    const eventType = String(eventId || "").toLowerCase() === "ctf" ? "ctf" : "hackathon";
    const id = uniqueId();
    const token = crypto.randomBytes(24).toString("hex");
    const to = String(details.email).trim();

    await appendRegistration({
      timestamp: new Date().toISOString(),
      event: eventType,
      eventName,
      teamName: details.teamName || details.handle || "",
      captainName: details.captain || details.handle || "",
      teamSize: details.teamSize || "1 (solo)",
      ppt: (uploads.ppt || [])[0]?.originalname || "",
      paymentScreenshot: (uploads.paymentScreenshot || [])[0]?.originalname || "",
      uniqueId: id,
      name: displayName(details),
      email: to,
      token,
      details,
      files: files.map((file) => file.originalname),
    });

    await sendVerificationMail({
      to,
      eventName,
      uniqueId: id,
      token,
      details,
      files: files.map((file) => file.originalname),
      attachments: files.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      })),
    });

    res.status(201).json({ ok: true, uniqueId: id });
  }),
);

app.get(
  "/api/verify",
  asyncRoute(async (req, res) => {
    const token = String(req.query.token || "");
    const row = token ? await findByToken(token) : undefined;

    if (!row) {
      return res.status(404).type("html").send(page("Invalid link", "This verification link is not valid."));
    }

    if (row.get("status") === "verified") {
      return res.type("html").send(page("Already verified", "This registration has already been verified."));
    }

    const password = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);
    await markVerified(row, passwordHash);

    const details = JSON.parse(row.get("details") || "{}");
    await sendConfirmationMail({
      to: row.get("email"),
      name: displayName(details),
      uniqueId: row.get("uniqueId"),
      password,
      eventName: row.get("event"),
    });

    res.type("html").send(
      page(
        "Verified",
        `Registration ${row.get("uniqueId")} is verified. Login credentials have been emailed to the participant.`,
      ),
    );
  }),
);

app.post(
  "/api/login",
  asyncRoute(async (req, res) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ ok: false, error: "Identifier and password are required." });
    }

    const row = await findByIdentifier(String(identifier));
    const hash = row?.get("passwordHash") || "";
    const valid =
      row &&
      row.get("status") === "verified" &&
      hash &&
      (await bcrypt.compare(String(password), hash));

    if (!valid) {
      return res.status(401).json({ ok: false, error: "Access pending or credentials not recognized." });
    }

    res.json({ ok: true, uniqueId: row.get("uniqueId"), name: row.get("name") });
  }),
);

function page(title, message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — CyberDemons</title><style>body{font-family:Arial,sans-serif;background:#05070a;color:#e8edf2;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:520px;padding:32px;border:1px solid #26303a;background:#0b0f14}h1{color:#5fd4e6;font-size:1.4rem}p{line-height:1.6;color:#aab4c0}</style></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
}

app.use((error, _req, res, _next) => {
  console.error("API error:", error.message);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, error: "Upload failed: " + error.message });
  }
  res.status(500).json({ ok: false, error: "Registration could not be completed. Please try again." });
});

const distDir = path.join(process.cwd(), "dist");
app.use(express.static(distDir));
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(config.port, () => {
  console.log(`CyberDemons API + site listening on port ${config.port}`);
});

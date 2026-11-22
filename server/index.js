import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import {
  appendRegistration,
  deleteScore,
  findAllByIdentifier,
  findByToken,
  findByIdentifier,
  findStoredUpload,
  listCtfTeams,
  listPptUploads,
  listScores,
  markVerified,
  upsertScore,
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

const uploadDir = path.join(process.cwd(), "uploads");
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60 * 1000;
const sessionSecret =
  config.sessionSecret || `${config.sheetId}:${config.smtpAppPassword}`;

function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", sessionSecret)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function readSession(req, cookieName) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  const [body, signature] = String(match?.[1] || "").split(".");
  if (!body || !signature) return undefined;

  const expected = crypto
    .createHmac("sha256", sessionSecret)
    .update(body)
    .digest("base64url");
  const provided = Buffer.from(signature);
  const valid =
    provided.length === Buffer.from(expected).length &&
    crypto.timingSafeEqual(provided, Buffer.from(expected));
  if (!valid) return undefined;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.expires || payload.expires < Date.now()) return undefined;
    return payload;
  } catch {
    return undefined;
  }
}

function currentSession(req) {
  const payload = readSession(req, "cd_session");
  return payload?.uniqueId ? payload : undefined;
}

function currentAdmin(req) {
  const payload = readSession(req, "cd_admin");
  return payload?.admin === true ? payload : undefined;
}

function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.appUrl.startsWith("https://"),
    maxAge,
    path: "/",
  };
}

function requireAdmin(req, res, next) {
  if (!currentAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Admin access required." });
  }
  next();
}

function safeFileName(name) {
  return path.basename(String(name || "file")).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "") ?? fallback;
  } catch {
    return fallback;
  }
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
    const password = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);
    const to = String(details.email).trim();

    await fs.promises.mkdir(uploadDir, { recursive: true });
    const storedUploads = [];
    for (const file of files) {
      const storedName = `${id}-${crypto.randomBytes(4).toString("hex")}-${safeFileName(file.originalname)}`;
      await fs.promises.writeFile(path.join(uploadDir, storedName), file.buffer);
      storedUploads.push({ field: file.fieldname, name: file.originalname, storedName });
    }

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
      password,
      passwordHash,
      phone: String(details.phone || "").trim(),
      registeredFor: eventType === "ctf" ? "CTF" : "Hackathon",
      details,
      files: files.map((file) => file.originalname),
      uploads: storedUploads,
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

    let password = row.get("password");
    let passwordHash = row.get("passwordHash");
    if (!password || !passwordHash) {
      password = crypto.randomBytes(9).toString("base64url");
      passwordHash = await bcrypt.hash(password, 10);
      row.set("password", password);
    }
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
  "/api/submission",
  upload.fields([{ name: "ppt", maxCount: 1 }]),
  asyncRoute(async (req, res) => {
    const session = currentSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "Not signed in." });
    }

    const row = await findByIdentifier(session.uniqueId);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Session expired." });
    }

    const details = parseJson(row.get("details"), {});
    const uploads = parseJson(row.get("uploads"), []);
    const repo = typeof req.body.repo === "string" ? req.body.repo.trim() : undefined;

    if (repo !== undefined) {
      details.repo = repo;
      row.set("details", JSON.stringify(details));
    }

    const pptFile = (req.files?.ppt || [])[0];
    if (pptFile) {
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const storedName = `${row.get("uniqueId")}-${crypto.randomBytes(4).toString("hex")}-${safeFileName(pptFile.originalname)}`;
      await fs.promises.writeFile(path.join(uploadDir, storedName), pptFile.buffer);

      const current = Array.isArray(uploads) ? uploads : [];
      const previous = current.find((file) => file.field === "ppt");
      if (previous?.storedName) {
        await fs.promises
          .unlink(path.join(uploadDir, path.basename(previous.storedName)))
          .catch(() => {});
      }

      row.set(
        "uploads",
        JSON.stringify([
          ...current.filter((file) => file.field !== "ppt"),
          { field: "ppt", name: pptFile.originalname, storedName },
        ]),
      );
      row.set("ppt", pptFile.originalname);
    }

    await row.save({ raw: true });
    res.json({ ok: true });
  }),
);

app.post(
  "/api/login",
  asyncRoute(async (req, res) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ ok: false, error: "Identifier and password are required." });
    }

    const candidates = await findAllByIdentifier(String(identifier));
    let row;
    for (const candidate of candidates) {
      const hash = candidate.get("passwordHash") || "";
      if (
        candidate.get("status") === "verified" &&
        hash &&
        (await bcrypt.compare(String(password), hash))
      ) {
        row = candidate;
        break;
      }
    }

    if (!row) {
      return res.status(401).json({ ok: false, error: "Access pending or credentials not recognized." });
    }

    const sessionToken = signSession({
      uniqueId: row.get("uniqueId"),
      expires: Date.now() + SESSION_MAX_AGE,
    });
    res.cookie("cd_session", sessionToken, sessionCookieOptions());

    res.json({
      ok: true,
      uniqueId: row.get("uniqueId"),
      name: row.get("name"),
      event: row.get("event"),
      eventName: row.get("event_name") || row.get("eventName"),
    });
  }),
);

app.get(
  "/api/me",
  asyncRoute(async (req, res) => {
    const session = currentSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "Not signed in." });
    }

    const row = await findByIdentifier(session.uniqueId);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Session expired." });
    }

    const uploads = parseJson(row.get("uploads"), []);
    res.json({
      ok: true,
      uniqueId: row.get("uniqueId"),
      name: row.get("name"),
      event: row.get("event"),
      eventName: row.get("event_name") || row.get("eventName"),
      registeredFor:
        row.get("registered_for") ||
        (row.get("event") === "ctf" ? "CTF" : "Hackathon"),
      status: row.get("status"),
      details: parseJson(row.get("details"), {}),
      uploads: Array.isArray(uploads)
        ? uploads.map((file) => ({
            field: file.field,
            name: file.name,
            url: `/api/files/${encodeURIComponent(file.field)}`,
          }))
        : [],
    });
  }),
);

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  if (!config.adminPassword || !password) {
    return res.status(401).json({ ok: false, error: "Admin access is not configured." });
  }

  const provided = crypto.createHash("sha256").update(password).digest();
  const expected = crypto.createHash("sha256").update(config.adminPassword).digest();
  if (!crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({ ok: false, error: "Incorrect admin password." });
  }

  res.cookie(
    "cd_admin",
    signSession({ admin: true, expires: Date.now() + ADMIN_SESSION_MAX_AGE }),
    sessionCookieOptions(ADMIN_SESSION_MAX_AGE),
  );
  res.json({ ok: true });
});

app.get("/api/admin/me", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie("cd_admin", { path: "/" });
  res.json({ ok: true });
});

app.get(
  "/api/admin/hackathon/ppts",
  requireAdmin,
  asyncRoute(async (_req, res) => {
    const ppts = await listPptUploads("hackathon");
    res.json({
      ok: true,
      ppts: ppts.map((ppt) => ({
        ...ppt,
        url: `/api/admin/files/${encodeURIComponent(ppt.storedName)}`,
      })),
    });
  }),
);

app.get(
  "/api/admin/files/:storedName",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const storedName = path.basename(String(req.params.storedName));
    const file = storedName === req.params.storedName ? await findStoredUpload(storedName) : undefined;
    if (!file) {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    const filePath = path.join(uploadDir, storedName);
    try {
      await fs.promises.access(filePath);
    } catch {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name || storedName)}`,
    );
    res.type(path.extname(file.name || storedName) || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  }),
);

app.get(
  "/api/admin/ctf/scores",
  requireAdmin,
  asyncRoute(async (_req, res) => {
    const [scores, teams] = await Promise.all([listScores(), listCtfTeams()]);
    res.json({ ok: true, scores, teams });
  }),
);

app.post(
  "/api/admin/ctf/scores",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const team = String(req.body?.team || "").trim();
    const uniqueId = String(req.body?.uniqueId || "").trim();
    const points = Number(req.body?.points);

    if (!team || !Number.isFinite(points) || points < 0) {
      return res.status(400).json({
        ok: false,
        error: "Select a team and enter a valid score of zero or more.",
      });
    }

    await upsertScore({ uniqueId, team, points: Math.round(points * 100) / 100 });
    res.json({ ok: true });
  }),
);

app.delete(
  "/api/admin/ctf/scores",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const uniqueId = String(req.query.uniqueId || "").trim();
    const team = String(req.query.team || "").trim();
    if (!uniqueId && !team) {
      return res.status(400).json({ ok: false, error: "A team is required." });
    }

    await deleteScore({ uniqueId, team });
    res.json({ ok: true });
  }),
);

app.get(
  "/api/files/:field",
  asyncRoute(async (req, res) => {
    const session = currentSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "Not signed in." });
    }

    const row = await findByIdentifier(session.uniqueId);
    const uploads = parseJson(row?.get("uploads"), []);
    const file = Array.isArray(uploads)
      ? uploads.find((item) => item.field === req.params.field)
      : undefined;
    if (!file?.storedName) {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    const filePath = path.join(uploadDir, path.basename(file.storedName));
    try {
      await fs.promises.access(filePath);
    } catch {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    );
    res.type(path.extname(file.name) || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
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

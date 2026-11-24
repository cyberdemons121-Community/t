import "dotenv/config";
import crypto from "node:crypto";
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
  initDb,
  listCtfTeams,
  listNotifications,
  listPptUploads,
  listRegistrations,
  listScores,
  markNotificationsRead,
  markVerified,
  setUserBlocked,
  deleteRegistration,
  upsertScore,
} from "./db.js";
import { deleteObject, getObject, putObject } from "./storage.js";
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

function stepError(step, error) {
  console.error(`Registration step "${step}" failed:`, error.message);
  const wrapped = new Error(`Registration could not be completed (${step}).`);
  wrapped.registrationStep = step;
  return wrapped;
}

async function registrationStep(step, handler, timeoutMs = 20000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${step} timed out`)), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve().then(handler), timeout]);
  } catch (error) {
    throw stepError(step, error);
  } finally {
    clearTimeout(timer);
  }
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

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanString(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

const PROFILE_FIELDS = [
  "captain",
  "teamName",
  "phone",
  "college",
  "city",
  "experience",
  "repo",
];
const UPLOAD_FIELDS = new Set(["ppt", "paymentScreenshot", "profilePic"]);
const MAX_TEAM_MEMBERS = 10;

function normalizeTeamMembers(value) {
  if (!Array.isArray(value)) throw httpError(400, "Team members must be a list.");
  if (value.length > MAX_TEAM_MEMBERS) {
    throw httpError(400, `A team can have at most ${MAX_TEAM_MEMBERS} members plus the captain.`);
  }
  return value.map((entry, index) => {
    const member = entry && typeof entry === "object" ? entry : {};
    const name = cleanString(member.name, 80);
    if (!name) throw httpError(400, `Member ${index + 1} needs a name.`);
    const email = cleanString(member.email, 160);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError(400, `Member ${index + 1} has an invalid email.`);
    }
    return {
      name,
      role: cleanString(member.role, 80),
      email,
      phone: cleanString(member.phone, 40),
      college: cleanString(member.college, 160),
    };
  });
}

async function currentUser(req) {
  const session = currentSession(req);
  if (!session) return undefined;
  const row = await findByIdentifier(session.uniqueId);
  if (!row || row.get("blocked") || row.get("status") !== "verified") return undefined;
  return row;
}

function uploadView(field, uploadedAt) {
  return {
    field,
    url: `/api/files/${encodeURIComponent(field)}`,
    viewUrl: `/api/files/${encodeURIComponent(field)}?inline=1`,
    uploadedAt: uploadedAt || null,
  };
}

async function deliverCredentials(row, details, password) {
  const payload = {
    name: displayName(details),
    uniqueId: row.get("uniqueId"),
    password,
    eventName: row.get("eventName") || row.get("event"),
  };
  const participantEmail = row.get("email");

  try {
    await sendConfirmationMail({ ...payload, to: participantEmail });
    return { deliveredTo: participantEmail, fallback: false };
  } catch (error) {
    console.error(`Credential email to ${participantEmail} failed:`, error.message);
    const adminEmail = config.adminEmail;
    if (!adminEmail || adminEmail === participantEmail) throw error;
    await sendConfirmationMail({
      ...payload,
      to: adminEmail,
      name: `${payload.name} / ${participantEmail}`,
    });
    return { deliveredTo: adminEmail, fallback: true };
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
    const to = String(details.email).trim();

    const storedUploads = [];
    await registrationStep("upload storage", async () => {
      for (const file of files) {
        const storedName = `${id}-${crypto.randomBytes(4).toString("hex")}-${safeFileName(file.originalname)}`;
        await putObject(storedName, file.buffer, file.mimetype);
        storedUploads.push({ field: file.fieldname, name: file.originalname, storedName });
      }
    });

    const registration = {
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
      phone: String(details.phone || "").trim(),
      registeredFor: eventType === "ctf" ? "CTF" : "Hackathon",
      details,
      files: files.map((file) => file.originalname),
      uploads: storedUploads,
    };
    await registrationStep("spreadsheet", () => appendRegistration(registration));

    const verificationMail = {
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
    };
    await registrationStep("verification email", () => sendVerificationMail(verificationMail));

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
    }
    const previousStatus = row.get("status");
    const previousHash = row.get("passwordHash");
    const previousVerifiedAt = row.get("verifiedAt");
    await markVerified(row, passwordHash);

    const details = parseJson(row.get("details"), {});
    let delivery;
    try {
      delivery = await deliverCredentials(row, details, password);
    } catch (mailError) {
      row.set("status", previousStatus);
      row.set("passwordHash", previousHash || "");
      row.set("verifiedAt", previousVerifiedAt ? new Date(previousVerifiedAt).toISOString() : null);
      await row.save();
      throw mailError;
    }

    const fallbackNote = delivery.fallback
      ? ` Participant delivery failed, so credentials were sent to the admin address (${delivery.deliveredTo}) for forwarding.`
      : "";
    res.type("html").send(
      page(
        "Verified",
        `Registration ${row.get("uniqueId")} is verified. Login credentials were emailed to ${delivery.deliveredTo}.${fallbackNote}`,
      ),
    );
  }),
);

app.post(
  "/api/submission",
  upload.fields([{ name: "ppt", maxCount: 1 }]),
  asyncRoute(async (req, res) => {
    const row = await currentUser(req);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Sign in again to update your submission." });
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
      const storedName = `${row.get("uniqueId")}-${crypto.randomBytes(4).toString("hex")}-${safeFileName(pptFile.originalname)}`;
      await putObject(storedName, pptFile.buffer, pptFile.mimetype);

      const current = Array.isArray(uploads) ? uploads : [];
      const previous = current.find((file) => file.field === "ppt");
      if (previous?.storedName) {
        await deleteObject(path.basename(previous.storedName)).catch(() => {});
      }

      row.set(
        "uploads",
        JSON.stringify([
          ...current.filter((file) => file.field !== "ppt"),
          {
            field: "ppt",
            name: pptFile.originalname,
            storedName,
            uploadedAt: new Date().toISOString(),
          },
        ]),
      );
      details.ppt = pptFile.originalname;
      details.pptUpdatedAt = new Date().toISOString();
      details.updatedAt = details.pptUpdatedAt;
    }

    if (repo !== undefined) details.updatedAt = new Date().toISOString();
    row.set("details", JSON.stringify(details));
    await row.save();
    res.json({ ok: true });
  }),
);

app.patch(
  "/api/me/profile",
  asyncRoute(async (req, res) => {
    const row = await currentUser(req);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Sign in again to update your profile." });
    }

    const details = parseJson(row.get("details"), {});
    const body = req.body || {};
    for (const field of PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        details[field] = cleanString(body[field], field === "repo" ? 500 : 160);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "teamMembers")) {
      details.teamMembers = normalizeTeamMembers(body.teamMembers);
      details.teamSize = `${details.teamMembers.length + 1} (${
        details.teamMembers.length ? "team" : "solo"
      })`;
      row.set("teamSize", details.teamSize);
    }

    details.updatedAt = new Date().toISOString();
    if (details.captain) {
      row.set("captainName", details.captain);
      row.set("name", details.captain);
    }
    if (details.teamName) row.set("teamName", details.teamName);
    if (details.phone) row.set("phone", details.phone);
    row.set("details", JSON.stringify(details));
    await row.save();
    res.json({ ok: true, details });
  }),
);

app.post(
  "/api/me/uploads",
  upload.fields([
    { name: "ppt", maxCount: 1 },
    { name: "paymentScreenshot", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
  ]),
  asyncRoute(async (req, res) => {
    const row = await currentUser(req);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Sign in again to upload files." });
    }

    const incoming = Object.entries(req.files || {})
      .map(([field, files]) => ({ field, file: files?.[0] }))
      .filter((entry) => Boolean(entry.file));
    if (!incoming.length) throw httpError(400, "Choose a file to upload.");

    for (const { field, file } of incoming) {
      if (!UPLOAD_FIELDS.has(field)) throw httpError(400, "Unsupported upload type.");
      if ((field === "profilePic" || field === "paymentScreenshot") && !/^image\//.test(file.mimetype)) {
        throw httpError(400, `${field === "profilePic" ? "Profile picture" : "Payment proof"} must be an image.`);
      }
    }

    const uploads = parseJson(row.get("uploads"), []);
    const current = Array.isArray(uploads) ? uploads : [];
    const details = parseJson(row.get("details"), {});
    const now = new Date().toISOString();
    const removed = [];

    for (const { field, file } of incoming) {
      const storedName = `${row.get("uniqueId")}-${field}-${crypto
        .randomBytes(4)
        .toString("hex")}-${safeFileName(file.originalname)}`;
      await putObject(storedName, file.buffer, file.mimetype);

      const previous = current.find((item) => item.field === field && item.storedName && item.storedName !== storedName);
      if (previous?.storedName) removed.push(previous.storedName);

      const entry = { field, name: file.originalname, storedName, uploadedAt: now };
      const index = current.findIndex((item) => item.field === field);
      if (index >= 0) current[index] = entry;
      else current.push(entry);

      details[field] = file.originalname;
      details[`${field}UpdatedAt`] = now;
    }

    details.updatedAt = now;
    row.set("uploads", JSON.stringify(current));
    row.set("details", JSON.stringify(details));
    await row.save();
    await Promise.allSettled(removed.map((name) => deleteObject(path.basename(name))));

    res.json({ ok: true });
  }),
);

app.delete(
  "/api/me/uploads/:field",
  asyncRoute(async (req, res) => {
    const field = req.params.field;
    if (!UPLOAD_FIELDS.has(field)) throw httpError(400, "Unsupported upload type.");

    const row = await currentUser(req);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Sign in again to remove files." });
    }

    const uploads = parseJson(row.get("uploads"), []);
    const current = Array.isArray(uploads) ? uploads : [];
    const target = current.find((item) => item.field === field);
    if (!target) {
      return res.status(404).json({ ok: false, error: "No file found for that section." });
    }

    const details = parseJson(row.get("details"), {});
    delete details[field];
    delete details[`${field}UpdatedAt`];
    details.updatedAt = new Date().toISOString();
    row.set("uploads", JSON.stringify(current.filter((item) => item.field !== field)));
    row.set("details", JSON.stringify(details));
    await row.save();
    if (target.storedName) await deleteObject(path.basename(target.storedName)).catch(() => {});
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
        !candidate.get("blocked") &&
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
    const row = await currentUser(req);
    if (!row) {
      return res.status(401).json({ ok: false, error: "Sign in again to view your portal." });
    }

    const details = parseJson(row.get("details"), {});
    const uploads = parseJson(row.get("uploads"), []);
    const safeUploads = Array.isArray(uploads) ? uploads : [];
    const scores = await listScores();
    const score = scores.find((item) => item.uniqueId === row.get("uniqueId"));
    const byField = (field) => safeUploads.find((file) => file.field === field);
    const teamMembers = Array.isArray(details.teamMembers) ? details.teamMembers : [];

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
      verifiedAt: row.get("verifiedAt") || null,
      createdAt: row.get("timestamp") || null,
      details,
      profile: {
        captain: details.captain || row.get("captainName") || "",
        teamName: details.teamName || row.get("teamName") || "",
        teamSize: details.teamSize || row.get("teamSize") || "",
        phone: details.phone || row.get("phone") || "",
        college: details.college || "",
        city: details.city || "",
        experience: details.experience || "",
        repo: details.repo || "",
      },
      teamMembers,
      uploads: safeUploads.map((file) => ({
        field: file.field,
        name: file.name,
        storedName: file.storedName || "",
        ...uploadView(file.field, file.uploadedAt),
      })),
      profilePicUrl: byField("profilePic")
        ? "/api/files/profilePic?inline=1"
        : null,
      flags: {
        verified: row.get("status") === "verified",
        paymentUploaded: Boolean(byField("paymentScreenshot")),
        pptUploaded: Boolean(byField("ppt")),
        profilePictureUploaded: Boolean(byField("profilePic")),
        teamMemberCount: teamMembers.length,
      },
      score: score ? Number(score.points) : null,
    });
  }),
);

app.post("/api/logout", (_req, res) => {
  res.clearCookie("cd_session", { path: "/" });
  res.json({ ok: true });
});

app.post("/api/admin/login", (req, res) => {
  const user = String(req.body?.user || req.body?.username || "");
  const password = String(req.body?.password || "");
  if (!config.adminUser || !config.adminPassword || !user || !password) {
    return res.status(401).json({ ok: false, error: "Admin access is not configured." });
  }

  const providedUser = crypto.createHash("sha256").update(user).digest();
  const expectedUser = crypto.createHash("sha256").update(config.adminUser).digest();
  const providedPassword = crypto.createHash("sha256").update(password).digest();
  const expectedPassword = crypto.createHash("sha256").update(config.adminPassword).digest();
  if (
    !crypto.timingSafeEqual(providedUser, expectedUser) ||
    !crypto.timingSafeEqual(providedPassword, expectedPassword)
  ) {
    return res.status(401).json({ ok: false, error: "Incorrect admin username or password." });
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
  "/api/admin/users",
  requireAdmin,
  asyncRoute(async (_req, res) => {
    const users = await listRegistrations();
    res.json({
      ok: true,
      users: users.map((user) => ({
        ...user,
        uploads: user.uploads.map((file) => ({
          ...file,
          url: `/api/admin/files/${encodeURIComponent(file.storedName)}`,
        })),
      })),
    });
  }),
);

app.get(
  "/api/admin/notifications",
  requireAdmin,
  asyncRoute(async (_req, res) => {
    const notifications = await listNotifications();
    res.json({
      ok: true,
      unreadCount: notifications.length,
      notifications: notifications.map((user) => ({
        uniqueId: user.uniqueId,
        name: user.name,
        email: user.email,
        event: user.eventName || user.event,
        registeredFor: user.event === "ctf" ? "CTF" : "Hackathon",
        createdAt: user.createdAt,
      })),
    });
  }),
);

app.post(
  "/api/admin/notifications/read",
  requireAdmin,
  asyncRoute(async (_req, res) => {
    const cleared = await markNotificationsRead();
    res.json({ ok: true, cleared });
  }),
);

app.post(
  "/api/admin/users/:uniqueId/resend-credentials",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const row = await findByIdentifier(req.params.uniqueId);
    if (!row) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }

    const details = parseJson(row.get("details"), {});
    const password = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);
    const delivery = await deliverCredentials(row, details, password);

    row.set("passwordHash", passwordHash);
    row.set("status", "verified");
    row.set("verifiedAt", new Date().toISOString());
    await row.save();

    res.json({
      ok: true,
      password,
      deliveredTo: delivery.deliveredTo,
      fallback: delivery.fallback,
    });
  }),
);

app.post(
  "/api/admin/users/:uniqueId/block",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const blocked = Boolean(req.body?.blocked);
    const updated = await setUserBlocked(req.params.uniqueId, blocked);
    if (!updated) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    res.json({ ok: true, blocked });
  }),
);

app.delete(
  "/api/admin/users/:uniqueId",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const storedNames = await deleteRegistration(req.params.uniqueId);
    if (!storedNames) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    await Promise.allSettled(storedNames.map((name) => deleteObject(name)));
    res.json({ ok: true });
  }),
);

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

    let object;
    try {
      object = await getObject(storedName);
    } catch {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name || storedName)}`,
    );
    res.type(object.contentType || path.extname(file.name || storedName) || "application/octet-stream");
    res.send(object.body);
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
    const row = await currentUser(req);
    if (!row || !UPLOAD_FIELDS.has(req.params.field)) {
      return res.status(401).json({ ok: false, error: "Not signed in." });
    }

    const uploads = parseJson(row.get("uploads"), []);
    const file = Array.isArray(uploads)
      ? uploads.find((item) => item.field === req.params.field)
      : undefined;
    if (!file?.storedName) {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    let object;
    try {
      object = await getObject(path.basename(file.storedName));
    } catch {
      return res.status(404).json({ ok: false, error: "File not found." });
    }

    const inline = String(req.query.inline) === "1";
    res.setHeader(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    );
    res.type(object.contentType || path.extname(file.name) || "application/octet-stream");
    res.send(object.body);
  }),
);

function page(title, message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — CyberDemons</title><style>body{font-family:Arial,sans-serif;background:#05070a;color:#e8edf2;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:520px;padding:32px;border:1px solid #26303a;background:#0b0f14}h1{color:#5fd4e6;font-size:1.4rem}p{line-height:1.6;color:#aab4c0}</style></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
}

app.use((error, _req, res, _next) => {
  console.error("API error:", error.message);
  if (error.status) {
    return res.status(error.status).json({ ok: false, error: error.message });
  }
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, error: "Upload failed: " + error.message });
  }
  if (error.registrationStep) {
    return res.status(500).json({ ok: false, error: error.message });
  }
  res.status(500).json({ ok: false, error: "Registration could not be completed. Please try again." });
});

const distDir = path.join(process.cwd(), "dist");
app.use(express.static(distDir));
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

await initDb();

app.listen(config.port, () => {
  console.log(`CyberDemons API + site listening on port ${config.port}`);
});

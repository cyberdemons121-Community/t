import crypto from "node:crypto";
import fs from "node:fs";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

const COLUMN_BY_KEY = {
  uniqueId: "unique_id",
  event: "event",
  eventName: "event_name",
  email: "email",
  teamName: "team_name",
  captainName: "captain_name",
  teamSize: "team_size",
  phone: "phone",
  name: "name",
  status: "status",
  passwordHash: "password_hash",
  verifiedAt: "verified_at",
  blocked: "blocked",
  notifiedAt: "notified_at",
};

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function makeRow(record) {
  const changes = {};
  return {
    data: record,
    get(key) {
      if (key in changes) return changes[key];
      switch (key) {
        case "details":
        case "uploads":
          return JSON.stringify(record[key] || (key === "uploads" ? [] : {}));
        case "timestamp":
          return record.created_at ? new Date(record.created_at).toISOString() : "";
        case "registered_for":
          return record.event === "ctf" ? "CTF" : "Hackathon";
        case "token":
        case "password":
          return "";
        case "passwordHash":
          return record.password_hash || "";
        case "verifiedAt":
          return record.verified_at ? new Date(record.verified_at).toISOString() : "";
        case "notifiedAt":
          return record.notified_at ? new Date(record.notified_at).toISOString() : "";
        case "blocked":
          return Boolean(record.blocked);
        case "uniqueId":
          return record.unique_id || "";
        case "teamName":
          return record.team_name || "";
        case "captainName":
          return record.captain_name || "";
        case "teamSize":
          return record.team_size || "";
        case "eventName":
          return record.event_name || "";
        default:
          return record[key] ?? "";
      }
    },
    set(key, value) {
      const column = COLUMN_BY_KEY[key];
      if (!column) {
        if (key === "details") {
          record.details = typeof value === "string" ? JSON.parse(value) : value;
          changes.details = value;
        } else if (key === "uploads") {
          record.uploads = typeof value === "string" ? JSON.parse(value) : value;
          changes.uploads = value;
        } else {
          changes[key] = value;
        }
        return this;
      }
      record[column] = value;
      changes[column] = value;
      return this;
    },
    async save() {
      const entries = Object.entries(changes);
      if (entries.length === 0) return;
      const assignments = entries.map(([column], i) => `${column} = $${i + 1}`).join(", ");
      const values = entries.map(([, value]) => value);
      values.push(record.unique_id);
      await pool.query(
        `UPDATE registrations SET ${assignments} WHERE unique_id = $${values.length}`,
        values,
      );
      for (const [column, value] of entries) {
        if (column === "details" || column === "uploads") {
          record[column] = typeof value === "string" ? JSON.parse(value) : value;
        }
      }
      for (const key of Object.keys(changes)) delete changes[key];
    },
  };
}

export async function initDb() {
  const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(schema);
}

export async function loadRevokedSessionIds() {
  const { rows } = await pool.query("SELECT jti FROM revoked_sessions");
  return rows.map((row) => row.jti);
}

export async function revokeSessionId(jti) {
  await pool.query(
    "INSERT INTO revoked_sessions (jti) VALUES ($1) ON CONFLICT (jti) DO NOTHING",
    [jti],
  );
}

export async function appendRegistration(record) {
  await pool.query(
    `INSERT INTO registrations (
      unique_id, event, event_name, email, team_name, captain_name, team_size,
      phone, name, status, details, password_hash, token_hash, verified_at, uploads,
      blocked, notified_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (unique_id) DO NOTHING`,
    [
      record.uniqueId,
      record.event,
      record.eventName || "",
      record.email,
      record.teamName || "",
      record.captainName || "",
      record.teamSize || "",
      record.phone || "",
      record.name || "",
      "pending",
      JSON.stringify(record.details || {}),
      record.passwordHash || "",
      tokenHash(record.token),
      null,
      JSON.stringify(record.uploads || []),
      false,
      null,
    ],
  );
}

async function findRows(where, params) {
  const { rows } = await pool.query(`SELECT * FROM registrations WHERE ${where}`, params);
  return rows.map(makeRow);
}

export async function findAllByIdentifier(identifier) {
  return findRows("unique_id = $1 OR lower(email) = lower($1)", [String(identifier)]);
}

export async function findByIdentifier(identifier) {
  const rows = await findAllByIdentifier(identifier);
  return rows[0];
}

export async function findByToken(token) {
  const rows = await findRows("token_hash = $1", [tokenHash(token)]);
  return rows[0];
}

export async function markVerified(row, passwordHash) {
  row.set("passwordHash", passwordHash);
  row.set("status", "verified");
  row.set("verifiedAt", new Date().toISOString());
  await row.save();
}

export async function listPptUploads(event) {
  const { rows } = await pool.query(
    "SELECT * FROM registrations WHERE event = $1 ORDER BY created_at DESC",
    [event],
  );
  return rows.flatMap((record) => {
    const uploads = Array.isArray(record.uploads) ? record.uploads : [];
    return uploads
      .filter((upload) => upload.field === "ppt")
      .map((upload) => ({
        uniqueId: record.unique_id,
        team: record.team_name || record.name || "",
        captain: record.captain_name || "",
        email: record.email || "",
        status: record.status,
        name: upload.name,
        storedName: upload.storedName,
        submittedAt: upload.uploadedAt || record.created_at,
      }));
  });
}

export async function findStoredUpload(storedName) {
  const { rows } = await pool.query(
    "SELECT uploads FROM registrations WHERE uploads::text LIKE $1 LIMIT 1",
    [`%${storedName}%`],
  );
  for (const record of rows) {
    const uploads = Array.isArray(record.uploads) ? record.uploads : [];
    const found = uploads.find((upload) => upload.storedName === storedName);
    if (found) return { name: found.name, storedName };
  }
  return undefined;
}

export async function listScores() {
  const { rows } = await pool.query(
    "SELECT unique_id AS \"uniqueId\", team, points::float AS points, updated_at AS \"updatedAt\" FROM scores ORDER BY points DESC",
  );
  return rows;
}

export async function listCtfTeams() {
  const { rows } = await pool.query(
    "SELECT unique_id AS \"uniqueId\", team_name AS team, status FROM registrations WHERE event = 'ctf' ORDER BY created_at DESC",
  );
  return rows;
}

export async function upsertScore({ uniqueId, team, points }) {
  if (!uniqueId) {
    const { rows } = await pool.query("SELECT unique_id FROM scores WHERE team = $1 LIMIT 1", [team]);
    uniqueId = rows[0]?.unique_id || `team:${team}`;
  }
  await pool.query(
    `INSERT INTO scores (unique_id, team, points, updated_at) VALUES ($1,$2,$3,NOW())
     ON CONFLICT (unique_id) DO UPDATE SET team = EXCLUDED.team, points = EXCLUDED.points, updated_at = NOW()`,
    [uniqueId, team, points],
  );
}

export async function deleteScore({ uniqueId, team }) {
  if (uniqueId) {
    await pool.query("DELETE FROM scores WHERE unique_id = $1", [uniqueId]);
  } else if (team) {
    await pool.query("DELETE FROM scores WHERE team = $1", [team]);
  }
}

function publicUser(record) {
  const uploads = Array.isArray(record.uploads) ? record.uploads : [];
  return {
    uniqueId: record.unique_id,
    name: record.name || "",
    email: record.email || "",
    event: record.event,
    eventName: record.event_name || "",
    teamName: record.team_name || "",
    captainName: record.captain_name || "",
    teamSize: record.team_size || "",
    phone: record.phone || "",
    status: record.status,
    blocked: Boolean(record.blocked),
    verifiedAt: record.verified_at ? new Date(record.verified_at).toISOString() : null,
    createdAt: record.created_at ? new Date(record.created_at).toISOString() : null,
    details: record.details || {},
    uploads: uploads.map((file) => ({
      field: file.field,
      name: file.name,
      storedName: file.storedName,
      uploadedAt: file.uploadedAt || null,
    })),
  };
}

export async function listRegistrations() {
  const { rows } = await pool.query("SELECT * FROM registrations ORDER BY created_at DESC");
  return rows.map(publicUser);
}

export async function listNotifications() {
  const { rows } = await pool.query(
    `SELECT * FROM registrations
     WHERE status = 'pending' AND notified_at IS NULL AND blocked = false
     ORDER BY created_at DESC LIMIT 50`,
  );
  return rows.map(publicUser);
}

export async function markNotificationsRead() {
  const result = await pool.query(
    "UPDATE registrations SET notified_at = NOW() WHERE status = 'pending' AND notified_at IS NULL",
  );
  return result.rowCount;
}

export async function setUserBlocked(uniqueId, blocked) {
  const result = await pool.query(
    "UPDATE registrations SET blocked = $1 WHERE unique_id = $2",
    [Boolean(blocked), uniqueId],
  );
  return result.rowCount > 0;
}

export async function deleteRegistration(uniqueId) {
  const { rows } = await pool.query("SELECT uploads FROM registrations WHERE unique_id = $1", [uniqueId]);
  if (!rows.length) return null;
  await pool.query("DELETE FROM scores WHERE unique_id = $1", [uniqueId]);
  await pool.query("DELETE FROM registrations WHERE unique_id = $1", [uniqueId]);
  const uploads = Array.isArray(rows[0].uploads) ? rows[0].uploads : [];
  return uploads.map((file) => file.storedName).filter(Boolean);
}

export async function closeDb() {
  await pool.end();
}

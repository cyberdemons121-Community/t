import { GoogleSpreadsheet } from "google-spreadsheet";
import { GoogleAuth } from "google-auth-library";
import { config, missingEnv } from "./config.js";

const HEADERS = [
  "timestamp",
  "event",
  "uniqueId",
  "password",
  "team_name",
  "captain_name",
  "email",
  "team_size",
  "phone",
  "status",
  "ppt",
  "payment_screenshot",
  "name",
  "token",
  "passwordHash",
  "verifiedAt",
  "details",
  "files",
  "event_name",
  "uploads",
  "registered_for",
];

const SCORE_HEADERS = ["uniqueId", "team", "points", "updatedAt"];

let docPromise;
let scoresSheetPromise;

async function getDoc() {
  const required = missingEnv(["sheetId"]);
  if (required.length) {
    throw new Error(`Missing Google Sheets config: ${required.join(", ")}`);
  }

  if (!docPromise) {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    const auth =
      config.serviceAccountEmail && config.privateKey
        ? new GoogleAuth({
            scopes,
            credentials: {
              client_email: config.serviceAccountEmail,
              private_key: config.privateKey.replace(/\\n/g, "\n"),
            },
          })
        : new GoogleAuth({ scopes });
    docPromise = (async () => {
      const doc = new GoogleSpreadsheet(config.sheetId, auth);
      await doc.loadInfo();
      return doc;
    })().catch((error) => {
      docPromise = undefined;
      throw error;
    });
  }

  return docPromise;
}

async function getSheet() {
  const doc = await getDoc();
  let sheet = doc.sheetsByTitle["Registrations"];
  if (!sheet) {
    sheet = await doc.addSheet({ title: "Registrations", headerValues: HEADERS });
  } else {
    await sheet.setHeaderRow(HEADERS);
  }
  return sheet;
}

async function getScoresSheet() {
  const doc = await getDoc();
  if (!scoresSheetPromise) {
    scoresSheetPromise = (async () => {
      let sheet = doc.sheetsByTitle["Scores"];
      if (!sheet) {
        sheet = await doc.addSheet({ title: "Scores", headerValues: SCORE_HEADERS });
      } else {
        await sheet.setHeaderRow(SCORE_HEADERS);
      }
      return sheet;
    })().catch((error) => {
      scoresSheetPromise = undefined;
      throw error;
    });
  }
  return scoresSheetPromise;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function appendRegistration(record) {
  const sheet = await getSheet();
  await sheet.addRow({
    timestamp: record.timestamp,
    event: record.event,
    uniqueId: record.uniqueId,
    name: record.name,
    email: record.email,
    status: "pending",
    token: record.token,
    passwordHash: record.passwordHash,
    verifiedAt: "",
    details: JSON.stringify(record.details),
    files: JSON.stringify(record.files),
    event_name: record.eventName,
    team_name: record.teamName,
    captain_name: record.captainName,
    team_size: record.teamSize,
    ppt: record.ppt,
    payment_screenshot: record.paymentScreenshot,
    uploads: JSON.stringify(record.uploads || []),
    phone: record.phone || "",
    password: record.password,
    registered_for: record.registeredFor,
  }, { raw: true });
}

async function findRows(predicate) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  return rows.filter(predicate);
}

export async function findByToken(token) {
  const rows = await findRows((row) => row.get("token") === token);
  return rows[0];
}

export function findAllByIdentifier(identifier) {
  const value = identifier.trim().toLowerCase();
  return findRows(
    (row) =>
      String(row.get("uniqueId") || "").toLowerCase() === value ||
      String(row.get("email") || "").toLowerCase() === value,
  );
}

export function findByIdentifier(identifier) {
  return findRows((row) => row.get("uniqueId") === identifier).then((rows) => rows[0]);
}

export async function markVerified(row, passwordHash) {
  row.set("status", "verified");
  row.set("passwordHash", passwordHash);
  row.set("verifiedAt", new Date().toISOString());
  await row.save();
}

export async function listPptUploads(event) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  const ppts = [];

  for (const row of rows) {
    if (event && row.get("event") !== event) continue;
    const uploads = parseJson(row.get("uploads"), []);
    if (!Array.isArray(uploads)) continue;

    for (const file of uploads) {
      if (file?.field !== "ppt" || !file.storedName) continue;
      ppts.push({
        uniqueId: String(row.get("uniqueId") || ""),
        team: String(row.get("team_name") || row.get("name") || ""),
        captain: String(row.get("captain_name") || ""),
        email: String(row.get("email") || ""),
        status: String(row.get("status") || ""),
        name: String(file.name || row.get("ppt") || "Presentation"),
        storedName: String(file.storedName),
        submittedAt: String(row.get("timestamp") || ""),
      });
    }
  }

  return ppts.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function findStoredUpload(storedName) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  for (const row of rows) {
    const uploads = parseJson(row.get("uploads"), []);
    if (!Array.isArray(uploads)) continue;
    const match = uploads.find((file) => file?.storedName === storedName);
    if (match) return match;
  }
  return undefined;
}

export async function listCtfTeams() {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  return rows
    .filter((row) => row.get("event") === "ctf")
    .map((row) => ({
      uniqueId: String(row.get("uniqueId") || ""),
      team: String(row.get("team_name") || row.get("name") || ""),
      status: String(row.get("status") || ""),
    }))
    .filter((team) => team.team);
}

export async function listScores() {
  const sheet = await getScoresSheet();
  const rows = await sheet.getRows();
  return rows
    .map((row) => ({
      uniqueId: String(row.get("uniqueId") || ""),
      team: String(row.get("team") || ""),
      points: Number(row.get("points") || 0),
      updatedAt: String(row.get("updatedAt") || ""),
    }))
    .filter((score) => score.team)
    .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team));
}

export async function upsertScore({ uniqueId, team, points }) {
  const sheet = await getScoresSheet();
  const rows = await sheet.getRows();
  const id = String(uniqueId || "").trim();
  const name = String(team || "").trim();
  const row = rows.find((candidate) =>
    id
      ? String(candidate.get("uniqueId") || "") === id
      : String(candidate.get("team") || "").toLowerCase() === name.toLowerCase(),
  );
  const values = {
    uniqueId: id,
    team: name,
    points,
    updatedAt: new Date().toISOString(),
  };

  if (row) {
    for (const [key, value] of Object.entries(values)) row.set(key, value);
    await row.save({ raw: true });
  } else {
    await sheet.addRow(values, { raw: true });
  }
}

export async function deleteScore({ uniqueId, team }) {
  const sheet = await getScoresSheet();
  const rows = await sheet.getRows();
  const id = String(uniqueId || "").trim();
  const name = String(team || "").trim();
  const matches = rows.filter((row) =>
    id
      ? String(row.get("uniqueId") || "") === id
      : String(row.get("team") || "").toLowerCase() === name.toLowerCase(),
  );

  for (const row of matches) await row.delete();
}

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

let docPromise;

async function getSheet() {
  const required = missingEnv(["sheetId"]);
  if (required.length) {
    throw new Error(`Missing Google Sheets config: ${required.join(", ")}`);
  }

  if (!docPromise) {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    docPromise = (async () => {
      const doc = new GoogleSpreadsheet(config.sheetId, auth);
      await doc.loadInfo();
      let sheet = doc.sheetsByTitle["Registrations"];
      if (!sheet) {
        sheet = await doc.addSheet({ title: "Registrations", headerValues: HEADERS });
      } else {
        await sheet.setHeaderRow(HEADERS);
      }
      return sheet;
    })().catch((error) => {
      docPromise = undefined;
      throw error;
    });
  }

  return docPromise;
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

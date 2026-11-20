import { GoogleSpreadsheet } from "google-spreadsheet";
import { GoogleAuth } from "google-auth-library";
import { config, missingEnv } from "./config.js";

const HEADERS = [
  "timestamp",
  "event",
  "uniqueId",
  "name",
  "email",
  "status",
  "token",
  "passwordHash",
  "verifiedAt",
  "details",
  "files",
  "event_name",
  "team_name",
  "captain_name",
  "team_size",
  "ppt",
  "payment_screenshot",
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
    passwordHash: "",
    verifiedAt: "",
    details: JSON.stringify(record.details),
    files: JSON.stringify(record.files),
    event_name: record.eventName,
    team_name: record.teamName,
    captain_name: record.captainName,
    team_size: record.teamSize,
    ppt: record.ppt,
    payment_screenshot: record.paymentScreenshot,
  });
}

async function findRow(predicate) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  return rows.find(predicate);
}

export function findByToken(token) {
  return findRow((row) => row.get("token") === token);
}

export function findByIdentifier(identifier) {
  const value = identifier.trim().toLowerCase();
  return findRow(
    (row) =>
      String(row.get("uniqueId") || "").toLowerCase() === value ||
      String(row.get("email") || "").toLowerCase() === value,
  );
}

export async function markVerified(row, passwordHash) {
  row.set("status", "verified");
  row.set("passwordHash", passwordHash);
  row.set("verifiedAt", new Date().toISOString());
  await row.save();
}

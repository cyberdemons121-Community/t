import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const endpoint =
  process.env.AWS_ENDPOINT_URL_S3 ||
  process.env.NEON_S3_ENDPOINT ||
  process.env.OBJECT_STORAGE_ENDPOINT ||
  "";
const region =
  process.env.AWS_REGION || process.env.NEON_S3_REGION || "auto";
const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.NEON_S3_ACCESS_KEY_ID ||
  "";
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.NEON_S3_SECRET_ACCESS_KEY ||
  "";
const bucket =
  process.env.OBJECT_STORAGE_BUCKET ||
  process.env.NEON_S3_BUCKET ||
  "uploads";

let client;

function storage() {
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Object storage is not configured.");
  }
  if (!client) {
    client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function putObject(key, body, contentType) {
  await storage().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    }),
  );
}

export async function getObject(key) {
  const result = await storage().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const bytes = await result.Body.transformToByteArray();
  return { body: Buffer.from(bytes), contentType: result.ContentType || "application/octet-stream" };
}

export async function deleteObject(key) {
  await storage().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

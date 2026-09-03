import { Storage, type File } from "@google-cloud/storage";

const SIDECAR = "http://127.0.0.1:1106";

const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function privateDir(): string {
  const value = process.env.PRIVATE_OBJECT_DIR;
  if (!value) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  return value.replace(/\/$/, "");
}

function splitPath(path: string): { bucket: string; object: string } {
  const parts = path.replace(/^\//, "").split("/");
  const bucket = parts.shift();
  if (!bucket || parts.length === 0) throw new Error("Invalid object path");
  return { bucket, object: parts.join("/") };
}

export function createLeadObjectPath(leadId: number, id: string): string {
  if (!Number.isSafeInteger(leadId) || leadId <= 0) {
    throw new Error("Invalid lead id");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Invalid upload id");
  }
  return `/objects/repair-leads/${leadId}/${id}`;
}

export async function getPrivateObject(
  objectPath: string,
  leadId: number,
): Promise<File> {
  const expectedPrefix = `/objects/repair-leads/${leadId}/`;
  if (
    !Number.isSafeInteger(leadId) ||
    leadId <= 0 ||
    !objectPath.startsWith(expectedPrefix) ||
    !/^\/objects\/repair-leads\/[1-9][0-9]*\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      objectPath,
    )
  ) {
    throw new Error("Invalid private object path");
  }
  const relative = objectPath.slice("/objects/".length);
  const { bucket, object } = splitPath(`${privateDir()}/${relative}`);
  const file = storage.bucket(bucket).file(object);
  const [exists] = await file.exists();
  if (!exists) throw new Error("Object not found");
  return file;
}

export async function inspectPrivateObject(
  objectPath: string,
  leadId: number,
): Promise<{
  contentType: string;
  size: number;
}> {
  const file = await getPrivateObject(objectPath, leadId);
  const [metadata] = await file.getMetadata();
  return {
    contentType: String(metadata.contentType ?? ""),
    size: Number(metadata.size ?? 0),
  };
}

export async function writePrivateObject(
  objectPath: string,
  leadId: number,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const file = await getPrivateObjectFile(objectPath, leadId);
  await file.save(body, {
    resumable: false,
    metadata: { contentType },
    preconditionOpts: { ifGenerationMatch: 0 },
  });
}

export async function deletePrivateObject(objectPath: string, leadId: number): Promise<void> {
  const file = await getPrivateObjectFile(objectPath, leadId);
  await file.delete({ ignoreNotFound: true });
}

async function getPrivateObjectFile(objectPath: string, leadId: number): Promise<File> {
  const expectedPrefix = `/objects/repair-leads/${leadId}/`;
  if (
    !Number.isSafeInteger(leadId) ||
    leadId <= 0 ||
    !objectPath.startsWith(expectedPrefix) ||
    !/^\/objects\/repair-leads\/[1-9][0-9]*\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(objectPath)
  ) throw new Error("Invalid private object path");
  const relative = objectPath.slice("/objects/".length);
  const { bucket, object } = splitPath(`${privateDir()}/${relative}`);
  return storage.bucket(bucket).file(object);
}

export async function pipePrivateObject(file: File, res: import("express").Response) {
  const [metadata] = await file.getMetadata();
  res.setHeader("Content-Type", String(metadata.contentType ?? "application/octet-stream"));
  res.setHeader("Cache-Control", "private, max-age=300");
  if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
  file.createReadStream().on("error", (error) => res.destroy(error)).pipe(res);
}
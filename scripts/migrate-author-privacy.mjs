/** Idempotent, dry-run-first legacy migration. Never runs as part of build/deploy. */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { isDeepStrictEqual } from "node:util";
const args = process.argv.slice(2);
const project = args[args.indexOf("--project") + 1];
if (!args.includes("--project") || project !== "mosterpedia")
  throw new Error("Explicit --project mosterpedia is required.");
const apply = args.includes("--apply");
initializeApp({ projectId: project, credential: applicationDefault() });
const db = getFirestore();
async function replaceSafely(snapshot, data) {
  await db.runTransaction(async (tx) => {
    const current = await tx.get(snapshot.ref);
    if (!current.updateTime?.isEqual(snapshot.updateTime))
      throw new Error("Concurrent edit: rerun migration.");
    tx.set(snapshot.ref, data);
  });
}
const text = (v, fallback) =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;
const array = (v) =>
  Array.isArray(v)
    ? v.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim())
    : [];
function timestamp(value) {
  if (value instanceof Timestamp) return value;
  if (value && Number.isFinite(value.seconds))
    return new Timestamp(value.seconds, value.nanoseconds || 0);
  const date = value instanceof Date ? value : new Date(value);
  if (!value || !Number.isFinite(date.getTime()))
    throw new Error(
      "Missing/invalid legacy creation timestamp: manual review needed.",
    );
  return Timestamp.fromDate(date);
}
function clean(raw) {
  const authorId = text(raw.authorId, text(raw.author?.id, raw.author?.uid));
  if (!authorId || authorId.includes("@"))
    throw new Error("Missing non-email author uid: manual review needed.");
  const createdAt = timestamp(raw.createdAt || raw.date);
  const images = array(raw.images);
  if (
    images.some(
      (url) =>
        !/^https:\/\/firebasestorage[.]googleapis[.]com\/v0\/b\/mosterpedia[.]firebasestorage[.]app\/o\/users%2F/.test(
          url,
        ),
    )
  )
    throw new Error("Legacy image reference needs manual Storage migration.");
  const result = {
    name: text(raw.name, "Sin nombre"),
    description: text(raw.description, "Notas pendientes."),
    species: text(raw.species, "Sin clasificar"),
    alignment: text(raw.alignment, "Desconocido"),
    longevity: text(raw.longevity, "Desconocida"),
    content: text(raw.content, "Notas pendientes."),
    commonNames: array(raw.commonNames),
    clasification: array(raw.clasification),
    tags: array(raw.tags),
    images,
    threatLevel: Number.isInteger(raw.threatLevel)
      ? Math.min(10, Math.max(0, raw.threatLevel))
      : 0,
    authorId,
    displayName: text(
      raw.displayName,
      text(raw.author?.displayName, "Naturalista"),
    ).replace(/\S+@\S+/g, "Naturalista"),
    createdAt,
    updatedAt: raw.updatedAt ? timestamp(raw.updatedAt) : createdAt,
    version: Number.isInteger(raw.version) && raw.version > 0 ? raw.version : 1,
  };
  for (const [key, cap] of Object.entries({
    name: 120,
    description: 1000,
    species: 120,
    alignment: 120,
    longevity: 120,
    content: 50000,
    authorId: 128,
    displayName: 80,
  }))
    if (result[key].length > cap)
      throw new Error("Oversized " + key + ": manual review needed.");
  for (const key of ["commonNames", "clasification", "tags"])
    if (result[key].length > 5 || result[key].some((s) => s.length > 80))
      throw new Error("Oversized list: manual review needed.");
  if (result.images.length > 4 || result.images.some((s) => s.length > 2048))
    throw new Error("Oversized image list: manual review needed.");
  return result;
}
console.log(
  apply
    ? "APPLY requested; make a trusted backup before continuing."
    : "DRY RUN only. No documents will be changed.",
);
const snapshots = await db.collection("entries").get();
let changed = 0,
  skipped = 0;
for (const snapshot of snapshots.docs) {
  try {
    const normalized = clean(snapshot.data());
    if (!isDeepStrictEqual(snapshot.data(), normalized)) {
      changed++;
      console.log(
        `${apply ? "Migrating" : "Would migrate"} entries/${snapshot.id}`,
      );
      // A full replace strips author/email and unknown fields; precondition refuses concurrent edits.
      if (apply) await replaceSafely(snapshot, normalized);
    }
    const revisions = await snapshot.ref.collection("revisions").get();
    for (const revision of revisions.docs) {
      const raw = revision.data();
      const cleaned = {
        snapshot: clean(raw.snapshot || raw),
        editorId:
          typeof raw.editorId === "string" && !raw.editorId.includes("@")
            ? raw.editorId
            : normalized.authorId,
        createdAt: timestamp(raw.createdAt || normalized.createdAt),
      };
      if (!isDeepStrictEqual(raw, cleaned)) {
        changed++;
        console.log(
          `${apply ? "Migrating" : "Would migrate"} ${revision.ref.path}`,
        );
        if (apply) await replaceSafely(revision, cleaned);
      }
    }
  } catch {
    skipped++;
    console.error(
      `Manual review required: entries/${snapshot.id}. No private values printed.`,
    );
  }
}
console.log(
  JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    changes: changed,
    manualReview: skipped,
  }),
);
if (skipped) process.exitCode = 2;

import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  deleteField,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getBytes, deleteObject } from "firebase/storage";
const projectId = "mosterpedia";
let env;
const seedTime = Timestamp.fromMillis(1700000000000);
const entry = (authorId = "alice") => ({
  name: "Basilisco",
  description: "Notas de campo.",
  species: "Reptil",
  alignment: "Neutral",
  longevity: "Desconocida",
  content: "## Hábitat\nBosques rocosos.",
  commonNames: ["Rey serpiente"],
  clasification: ["Reptiles"],
  tags: ["bosque"],
  images: [],
  threatLevel: 8,
  authorId,
  displayName: "Naturalista",
  createdAt: seedTime,
  updatedAt: seedTime,
  version: 1,
});
const db = (uid = "alice", verified = true) =>
  uid
    ? env.authenticatedContext(uid, { email_verified: verified }).firestore()
    : env.unauthenticatedContext().firestore();
const target = (database) => doc(database, "entries", "basilisco");
function batchUpdate(database, uid, overrides = {}, snapshotOverrides = {}) {
  const b = writeBatch(database);
  b.set(doc(database, "entries/basilisco/revisions/1"), {
    snapshot: { ...entry(), ...snapshotOverrides },
    editorId: uid,
    createdAt: serverTimestamp(),
  });
  b.update(target(database), {
    name: "Basilisco revisado",
    updatedAt: serverTimestamp(),
    version: 2,
    ...overrides,
  });
  return b.commit();
}
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
    storage: {
      host: "127.0.0.1",
      port: 9199,
      rules: readFileSync("storage.rules", "utf8"),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "admins/root"), { enabled: true });
    await setDoc(doc(ctx.firestore(), "editors/ed"), { enabled: true });
    await setDoc(target(ctx.firestore()), entry());
  });
});
after(async () => {
  await env?.cleanup();
});
test("public catalog get/list and ordered revision query work", async () => {
  const d = db(null);
  await assertSucceeds(getDoc(target(d)));
  await assertSucceeds(getDocs(collection(d, "entries")));
  await assertSucceeds(
    getDocs(
      query(
        collection(d, "entries/basilisco/revisions"),
        orderBy("createdAt", "desc"),
        limit(5),
      ),
    ),
  );
});
test("signed out cannot create, edit or delete", async () => {
  const d = db(null);
  await assertFails(
    setDoc(doc(d, "entries/new"), {
      ...entry(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(updateDoc(target(d), { name: "Intrusión" }));
  await assertFails(deleteDoc(target(d)));
});
test("unverified author cannot create or update", async () => {
  const d = db("alice", false);
  await assertFails(
    setDoc(doc(d, "entries/new"), {
      ...entry(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(batchUpdate(d, "alice"));
});
test("verified author can create a schema-valid entry", async () => {
  await assertSucceeds(
    setDoc(doc(db(), "entries/new"), {
      ...entry(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});
test("create rejects forged ownership and client timestamps", async () => {
  await assertFails(
    setDoc(doc(db(), "entries/new"), {
      ...entry("bob"),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(setDoc(doc(db(), "entries/new"), entry()));
});
test("schema pollution including embedded email is rejected", async () => {
  for (const extra of [
    { email: "do-not-publish@example.test" },
    { author: { email: "do-not-publish@example.test" } },
    { role: "admin" },
  ])
    await assertFails(
      setDoc(doc(db(), "entries/new"), {
        ...entry(),
        ...extra,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
});
test("required fields and all array elements validated on create", async () => {
  for (const extra of [
    { name: "" },
    { species: 42 },
    { tags: ["valid", 7] },
    { tags: ["a", "b", "c", "d", 7] },
    { displayName: "private@example.test" },
    {
      images: [
        "https://firebasestorageXgoogleapisYcom/v0/b/mosterpedia.firebasestorage.app/o/users%2Fbad",
      ],
    },
    { commonNames: Array(11).fill("x") },
    { clasification: ["x".repeat(81)] },
    { images: ["javascript:alert(1)"] },
    { content: "x".repeat(50001) },
    { threatLevel: -1 },
    { threatLevel: 11 },
    { threatLevel: 3.5 },
  ])
    await assertFails(
      setDoc(doc(db(), "entries/new"), {
        ...entry(),
        ...extra,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  const incomplete = entry();
  delete incomplete.species;
  await assertFails(
    setDoc(doc(db(), "entries/new"), {
      ...incomplete,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});
test("maximum legal arrays can be created and updated without exhausting the rules budget", async () => {
  const full = {
    ...entry(),
    tags: Array(5).fill("a"),
    commonNames: Array(5).fill("b"),
    clasification: Array(5).fill("c"),
    images: Array(4).fill(
      "https://firebasestorage.googleapis.com/v0/b/mosterpedia.firebasestorage.app/o/users%2Falice%2Fentries%2Fx%2Fimage?alt=media",
    ),
  };
  await assertSucceeds(
    setDoc(doc(db(), "entries/maximal-create"), {
      ...full,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(target(ctx.firestore()), full);
  });
  const d = db();
  const b = writeBatch(d);
  b.set(doc(d, "entries/basilisco/revisions/1"), {
    snapshot: full,
    editorId: "alice",
    createdAt: serverTimestamp(),
  });
  b.update(target(d), {
    description: "Updated full arrays",
    version: 2,
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(b.commit());
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(target(ctx.firestore()), full);
    await deleteDoc(doc(ctx.firestore(), "entries/basilisco/revisions/1"));
  });
  const adminDb = db("root");
  const adminBatch = writeBatch(adminDb);
  adminBatch.set(doc(adminDb, "entries/basilisco/revisions/1"), {
    snapshot: full,
    editorId: "root",
    createdAt: serverTimestamp(),
  });
  adminBatch.update(target(adminDb), {
    description: "Admin max-array update",
    version: 2,
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(adminBatch.commit());
});
test("author can atomically save previous snapshot and update", async () => {
  await assertSucceeds(batchUpdate(db(), "alice"));
});
test("admin can edit another author with revision, keeping authorship", async () => {
  await assertSucceeds(batchUpdate(db("root"), "root"));
});
test("other user and optional editor cannot edit another author", async () => {
  await assertFails(batchUpdate(db("bob"), "bob"));
  await assertFails(batchUpdate(db("ed"), "ed"));
});
test("update cannot skip revision", async () => {
  await assertFails(
    updateDoc(target(db()), {
      name: "No history",
      updatedAt: serverTimestamp(),
      version: 2,
    }),
  );
});
test("revision cannot falsify snapshot, editor or version", async () => {
  await assertFails(batchUpdate(db(), "alice", {}, { content: "Falsificado" }));
  await assertFails(batchUpdate(db(), "bob"));
  await assertFails(batchUpdate(db(), "alice", { version: 3 }));
});
test("revision cannot be written without updating the parent", async () => {
  await assertFails(
    setDoc(doc(db(), "entries/basilisco/revisions/1"), {
      snapshot: entry(),
      editorId: "alice",
      createdAt: serverTimestamp(),
    }),
  );
});
test("update cannot change author, creation date or author label", async () => {
  for (const extra of [
    { authorId: "bob" },
    { createdAt: Timestamp.now() },
    { displayName: "Falso autor" },
  ])
    await assertFails(batchUpdate(db(), "alice", extra));
});
test("update validation blocks missing fields, PII, oversized fields, bad types and timestamps", async () => {
  for (const extra of [
    { name: deleteField() },
    { email: "private@example.test" },
    { description: "x".repeat(1001) },
    { tags: [null] },
    { threatLevel: "4" },
    { updatedAt: seedTime },
  ])
    await assertFails(batchUpdate(db(), "alice", extra));
});
test("normal author cannot delete; admin can", async () => {
  await assertFails(deleteDoc(target(db("root", false))));
  await assertFails(deleteDoc(target(db())));
  await assertSucceeds(deleteDoc(target(db("root"))));
});
test("role documents are own-get only and never client-writable", async () => {
  await assertSucceeds(getDoc(doc(db("root"), "admins/root")));
  await assertSucceeds(getDoc(doc(db(), "admins/alice")));
  await assertFails(getDoc(doc(db(), "admins/root")));
  await assertFails(getDocs(collection(db("root"), "admins")));
  for (const d of [db(), db("root")])
    for (const path of ["admins/alice", "editors/alice"])
      await assertFails(setDoc(doc(d, path), { enabled: true }));
});
test("revisions are immutable and orphan revisions cannot be read or written", async () => {
  await batchUpdate(db(), "alice");
  await assertFails(
    updateDoc(doc(db("root"), "entries/basilisco/revisions/1"), {
      editorId: "root",
    }),
  );
  await assertFails(
    deleteDoc(doc(db("root"), "entries/basilisco/revisions/1")),
  );
  await assertFails(getDoc(doc(db(null), "entries/missing/revisions/1")));
  await assertFails(
    setDoc(doc(db(), "entries/missing/revisions/1"), {
      snapshot: entry(),
      editorId: "alice",
      createdAt: serverTimestamp(),
    }),
  );
});
test("users and all unknown paths are denied", async () => {
  await assertFails(setDoc(doc(db(), "users/alice"), { role: "admin" }));
  await assertFails(getDoc(doc(db(), "users/bob")));
});
const image = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
test("Storage verified owner uploads an image and public can read it", async () => {
  const own = ref(
    env.authenticatedContext("alice", { email_verified: true }).storage(),
    "users/alice/entries/specimen/public.png",
  );
  await assertSucceeds(uploadBytes(own, image, { contentType: "image/png" }));
  await assertSucceeds(
    getBytes(ref(env.unauthenticatedContext().storage(), own.fullPath)),
  );
});
test("Storage rejects unauthenticated, unverified and cross-user writes", async () => {
  for (const ctx of [
    env.unauthenticatedContext(),
    env.authenticatedContext("alice", { email_verified: false }),
    env.authenticatedContext("bob", { email_verified: true }),
  ])
    await assertFails(
      uploadBytes(
        ref(ctx.storage(), "users/alice/entries/specimen/private.png"),
        image,
        { contentType: "image/png" },
      ),
    );
});
test("Storage rejects SVG, arbitrary files, oversized images, root uploads", async () => {
  const storage = env
    .authenticatedContext("alice", { email_verified: true })
    .storage();
  for (const type of ["image/svg+xml", "text/html", "application/octet-stream"])
    await assertFails(
      uploadBytes(ref(storage, "users/alice/entries/specimen/bad"), image, {
        contentType: type,
      }),
    );
  await assertFails(
    uploadBytes(
      ref(storage, "users/alice/entries/specimen/large"),
      new Uint8Array(5 * 1024 * 1024 + 1),
      { contentType: "image/png" },
    ),
  );
  await assertFails(
    uploadBytes(ref(storage, "arbitrary.png"), image, {
      contentType: "image/png",
    }),
  );
});
test("Storage deletion is restricted to the verified owner", async () => {
  const own = env
    .authenticatedContext("alice", { email_verified: true })
    .storage();
  const path = "users/alice/entries/specimen/remove.png";
  await uploadBytes(ref(own, path), image, { contentType: "image/png" });
  await assertFails(
    deleteObject(
      ref(
        env.authenticatedContext("bob", { email_verified: true }).storage(),
        path,
      ),
    ),
  );
  await assertSucceeds(deleteObject(ref(own, path)));
});

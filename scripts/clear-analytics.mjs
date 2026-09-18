/**
 * clear-analytics.mjs
 * Hapus semua dokumen di koleksi analytics_events menggunakan Firebase REST API
 * Jalankan: node scripts/clear-analytics.mjs
 */

const PROJECT_ID = "ecommerce-banjarsari";
const API_KEY    = "AIzaSyBkicy71PjUxRBuRFuedQ68nKi377qSGqw";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function listDocuments(collectionId, pageToken) {
  let url = `${BASE_URL}/${collectionId}?key=${API_KEY}&pageSize=300`;
  if (pageToken) url += `&pageToken=${pageToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function deleteDocument(name) {
  const url = `https://firestore.googleapis.com/v1/${name}?key=${API_KEY}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed for ${name}: ${res.status}`);
  }
}

async function clearCollection(collectionId) {
  console.log(`\nMenghapus semua dokumen di koleksi: "${collectionId}"...\n`);
  let total = 0;
  let pageToken = undefined;

  do {
    const data = await listDocuments(collectionId, pageToken);
    const docs = data.documents || [];

    if (docs.length === 0) {
      console.log("  Tidak ada dokumen lagi.");
      break;
    }

    for (const doc of docs) {
      await deleteDocument(doc.name);
      total++;
      process.stdout.write(`\r  Sudah dihapus: ${total} dokumen`);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`\n\nSelesai! Total ${total} dokumen berhasil dihapus dari "${collectionId}".\n`);
}

clearCollection("analytics_events").catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});

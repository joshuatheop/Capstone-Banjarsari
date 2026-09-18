import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SeoMeta } from "./types";

// ============================================================
// Helpers
// ============================================================

function collectionFor(type: "product" | "service"): string {
  return type === "product" ? "produk" : "jasa";
}

// ============================================================
// READ — Ambil SEO meta dari dokumen produk / jasa
// ============================================================

export async function getSeoMeta(
  type: "product" | "service",
  id: string
): Promise<SeoMeta | null> {
  try {
    const ref = doc(db, collectionFor(type), id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    const raw = data?.seo;
    if (!raw) return null;
    return {
      title:         raw.title         ?? "",
      description:   raw.description   ?? "",
      ogTitle:       raw.ogTitle        ?? raw.title ?? "",
      ogDescription: raw.ogDescription  ?? raw.description ?? "",
      updatedAt:     raw.updatedAt instanceof Timestamp ? raw.updatedAt.toDate() : undefined,
    };
  } catch (err) {
    console.error("[getSeoMeta] Error:", err);
    return null;
  }
}

// ============================================================
// WRITE — Simpan / update SEO meta
// ============================================================

export async function saveSeoMeta(
  type: "product" | "service",
  id: string,
  data: Omit<SeoMeta, "updatedAt">
): Promise<void> {
  const ref = doc(db, collectionFor(type), id);
  await updateDoc(ref, {
    seo: {
      title:         data.title,
      description:   data.description,
      ogTitle:       data.ogTitle || data.title,
      ogDescription: data.ogDescription || data.description,
      updatedAt:     serverTimestamp(),
    },
  });
}

// ============================================================
// AUTO-GENERATE — Buat draft SEO dari data produk / jasa
// ============================================================

export function autoGenerateSeo(
  name: string,
  description: string | null,
  businessName?: string | null
): Omit<SeoMeta, "updatedAt"> {
  const siteName = "Banjarsari";

  // Title: "Nama Produk – Nama UMKM | Banjarsari" (max 60 chars)
  const rawTitle = businessName
    ? `${name} – ${businessName} | ${siteName}`
    : `${name} | ${siteName}`;
  const title = rawTitle.length > 60 ? rawTitle.slice(0, 57) + "..." : rawTitle;

  // Description: 160 pertama dari deskripsi, fallback ke generic
  const rawDesc = description?.trim() || "";
  const description160 = rawDesc.length > 0
    ? rawDesc.length > 160
      ? rawDesc.slice(0, 157) + "..."
      : rawDesc
    : `Temukan ${name} di katalog UMKM Banjarsari. Produk dan jasa berkualitas dari pengusaha lokal.`;

  return {
    title,
    description: description160,
    ogTitle:       title,
    ogDescription: description160,
  };
}

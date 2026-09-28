import { NextResponse } from 'next/server';
import { isLocalRequest, readPreviewSession, sameOrigin } from '@/lib/server/preview-session';
import { forecastStock } from '@/lib/monitoring/forecast';
import { forecastSamples, FORECAST_AS_OF } from '@/lib/monitoring/forecast-data';
import { parseForecastCsv } from '@/lib/monitoring/forecast-csv';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const guard = async (request: Request) => {
  if (!isLocalRequest(request)) return reply({ error: 'Tidak tersedia.' }, 404);
  const user = await readPreviewSession();
  if (!user) return reply({ error: 'Silakan masuk.' }, 401);
  if (user.role !== 'admin') return reply({ error: 'Akses khusus admin.' }, 403);
  return null;
};
export const GET = async (request: Request) => {
  const denied = await guard(request); if (denied) return denied;
  return reply({ data: { source: 'sample', asOf: FORECAST_AS_OF, products: forecastSamples, results: forecastSamples.map((p) => forecastStock(p, FORECAST_AS_OF)) } });
};
export const POST = async (request: Request) => {
  const denied = await guard(request); if (denied) return denied;
  if (!sameOrigin(request)) return reply({ error: 'Origin tidak valid.' }, 403);
  try {
    const raw = await request.text(); if (raw.length > 1_100_000) return reply({ error: 'Berkas maksimal 1 MB.' }, 413);
    const { csv, asOf } = JSON.parse(raw);
    if (typeof csv !== 'string' || typeof asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return reply({ error: 'CSV dan tanggal acuan wajib diisi.' }, 400);
    const products = parseForecastCsv(csv);
    return reply({ data: { source: 'upload', asOf, products, results: products.map((p) => forecastStock(p, asOf)) } });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'CSV tidak dapat dibaca.' }, 400); }
};

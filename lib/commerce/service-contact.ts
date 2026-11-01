import { whatsappLink } from './whatsapp';
export function serviceContactUrl(phone: string | null | undefined, service: string, provider: string, schedule = '', notes = '', now = Date.now()) {
  if (notes.length > 500) throw new Error('Catatan maksimal 500 karakter.');
  let when = '';
  if (schedule) {
    const date = new Date(schedule);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= now || date.getTime() > now + 90 * 86400000) throw new Error('Pilih jadwal mendatang, maksimal 90 hari.');
    when = `\nUsulan jadwal: ${date.toLocaleString('id-ID', { timeZone:'Asia/Jakarta', dateStyle:'full', timeStyle:'short' })} WIB.`;
  }
  return whatsappLink(phone, `Halo ${provider}, saya menemukan jasa ${service} di PALUGADA Banjarsari. Apakah layanan tersedia?${when}${notes.trim() ? `\nKebutuhan: ${notes.trim()}` : ''}\nMohon konfirmasi jadwal dan biaya. Terima kasih.`);
}

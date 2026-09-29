export function whatsappLink(phone: string | null | undefined, message: string): string | null {
  if (!phone || !/^[+\d\s().-]+$/.test(phone)) return null;
  const number = phone.replace(/\D/g, '').replace(/^0/, '62');
  return /^[1-9]\d{9,14}$/.test(number) ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

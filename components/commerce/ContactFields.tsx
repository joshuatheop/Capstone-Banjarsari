import type { CustomerContact } from '@/lib/commerce/contact';
export default function ContactFields({ value, onChange, disabled = false }: { value: CustomerContact; onChange: (next: CustomerContact) => void; disabled?: boolean }) {
  return <>
    <label>Alamat lengkap<textarea required disabled={disabled} minLength={10} maxLength={500} autoComplete="street-address" value={value.address} onChange={event => onChange({ ...value, address: event.target.value })} placeholder="Jalan, nomor rumah, RT/RW, dan patokan"/></label>
    <label>Nomor HP<input required disabled={disabled} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={value.phone} onChange={event => onChange({ ...value, phone: event.target.value })} placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"/></label>
  </>;
}

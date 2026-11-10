import { redirect } from 'next/navigation';

export default function FoodPage() {
  redirect('/katalog?type=product');
}

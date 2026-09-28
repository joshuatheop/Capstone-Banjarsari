export interface CartLine { productId: string; quantity: number }
export interface ItemSnapshot { productId: string; name: string; price: number; quantity: number }
export interface CheckoutInput { items: CartLine[]; address: string; phone: string; note: string; idempotencyKey: string }

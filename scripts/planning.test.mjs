import test from 'node:test';
import assert from 'node:assert/strict';
import { contactIsValid, normalizeContact } from '../lib/commerce/contact.ts';
import { whatsappOrderLink } from '../lib/commerce/order-contact.ts';
import { forecastPresentation } from '../lib/monitoring/forecast-presentation.ts';
import { projectFinancials } from '../lib/monitoring/financial-projection.ts';
import { forecastStock, datePlus } from '../lib/monitoring/forecast.ts';

test('profile contacts normalize Indonesian phone numbers and reject incomplete addresses', () => {
  const address = 'Jl. Banjarsari No. 12, Garut';
  for (const phone of ['081234567890', '+62 812-3456-7890', '6281234567890']) {
    assert.deepEqual(normalizeContact({ address: ` ${address} `, phone }), { address, phone: '081234567890' });
    assert.equal(contactIsValid({ address, phone }), true);
  }
  for (const value of [{ address: '   ', phone: '081234567890' }, { address, phone: 'javascript:123' }, { address, phone: '1234567890' }, { address: 'x'.repeat(501), phone: '081234567890' }]) assert.equal(contactIsValid(value), false);
});

test('seller contact links encode order context, omit private contact details and fail closed on ambiguity', () => {
  const order = { id: 'LOCAL-123', seller: 'Toko A & B', item: 'Sayur', quantity: 2, total: 24000, status: 'AWAITING_SELLER', address: 'alamat pribadi', phone: '089999999999', items: [{ name: 'Sayur & telur', quantity: 2 }] };
  const contacts = [{ name: order.seller, phone: '+62 812-3456-7890' }];
  const link = new URL(whatsappOrderLink(order, contacts));
  assert.equal(link.origin, 'https://wa.me'); assert.equal(link.pathname, '/6281234567890');
  const text = link.searchParams.get('text');
  assert.ok(text.includes(order.id)); assert.ok(text.includes('Sayur & telur x2')); assert.ok(text.includes('24.000'));
  assert.ok(!text.includes(order.address)); assert.ok(!text.includes(order.phone));
  assert.equal(whatsappOrderLink(order, []), null);
  assert.equal(whatsappOrderLink(order, [...contacts, ...contacts]), null);
  for (const phone of ['javascript:alert(1)', '123', '', null]) assert.equal(whatsappOrderLink(order, [{ name: order.seller, phone }]), null);
});

test('tomorrow preparation remains distinct from period procurement and confidence is unavailable without history', () => {
  const input = { id: 'food', name: 'Makanan', kind: 'FOOD', unit: 'porsi', onHand: 4, incoming: 5, leadDays: 1, reviewDays: 3, shelfLifeDays: 1, history: Array.from({ length: 56 }, (_, i) => ({ date: datePlus('2026-09-28', i - 55), quantity: 10 })) };
  const result = forecastStock(input, '2026-09-28');
  assert.equal(forecastPresentation(result).preparation, 6);
  assert.equal(result.suggested, 1);
  assert.equal(forecastPresentation(result).level, 'high');
  assert.equal(forecastPresentation({ ...result, onHand: 20 }).preparation, 0);
  assert.equal(forecastPresentation({ ...result, wape: null }).level, 'low');
  assert.equal(forecastPresentation({ ...result, historyDays: 28 }).level, 'medium');
  assert.equal(forecastPresentation({ ...result, wape: 41 }).level, 'low');
  const missing = forecastStock({ ...input, history: input.history.slice(0, 10) }, '2026-09-28');
  assert.equal(forecastPresentation(missing).preparation, null);
  assert.equal(forecastPresentation(missing).level, 'unavailable');
});

test('financial scenarios separate GMV, fee revenue, fixed/variable cost and cumulative growth', () => {
  const input = { dailyPaidOrders: 10, averageOrderValue: 20000, growthPercent: 10, feePercent: 5, fixedCost: 100000, variableCost: 500, months: 2 };
  const rows = projectFinancials(input);
  assert.deepEqual(rows[0], { month: 1, orders: 330, gmv: 6600000, revenue: 330000, cost: 265000, net: 65000 });
  assert.equal(rows[1].orders, 363);
  assert.equal(projectFinancials({ ...input, growthPercent: -50 })[1].orders, 75);
  assert.equal(projectFinancials({ ...input, dailyPaidOrders: 0 })[0].net, -100000);
  assert.equal(projectFinancials({ ...input, feePercent: 0 })[0].revenue, 0);
  for (const extra of [{ growthPercent: -51 }, { feePercent: 101 }, { months: 0 }, { months: 1.5 }, { months: 13 }, { fixedCost: -1 }, { dailyPaidOrders: Infinity }, { averageOrderValue: NaN }, { averageOrderValue: 1e20 }, { dailyPaidOrders: 0, fixedCost: 1e15, months: 12 }]) assert.throws(() => projectFinancials({ ...input, ...extra }));
});

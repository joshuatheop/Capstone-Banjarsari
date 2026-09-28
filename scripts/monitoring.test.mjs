import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeOrders, ordersInPeriod } from '../lib/monitoring/metrics.ts';

const order = (status, payment, total, createdAt = '2026-09-28T09:00:00+07:00') => ({ status, payment, total, createdAt });
test('GMV excludes unpaid, failed, refunded, and cancelled orders', () => {
  const metrics = summarizeOrders([
    order('COMPLETED', 'PAID', 100000), order('PROCESSING', 'PAID', 50000),
    order('PENDING_PAYMENT', 'PENDING', 80000), order('CANCELLED', 'PAID', 30000),
    order('CANCELLED', 'REFUNDED', 40000), order('CANCELLED', 'FAILED', 20000),
  ]);
  assert.equal(metrics.gmv, 150000);
  assert.equal(metrics.averagePaidOrder, 75000);
  assert.equal(metrics.completed, 1);
  assert.equal(metrics.active, 2);
  assert.equal(metrics.cancelled, 3);
  assert.equal(metrics.cancellationRate, 50);
});
test('empty data never produces NaN or infinity', () => {
  const metrics = summarizeOrders([]);
  for (const value of Object.values(metrics)) assert.equal(value, 0);
});
test('period includes first WIB midnight and excludes older/future orders', () => {
  const first = order('COMPLETED', 'PAID', 1, '2026-09-22T00:00:00+07:00');
  const last = order('COMPLETED', 'PAID', 1, '2026-09-28T17:00:00+07:00');
  const outside = order('COMPLETED', 'PAID', 1, '2026-09-21T23:59:59+07:00');
  const future = order('COMPLETED', 'PAID', 1, '2026-09-28T17:00:01+07:00');
  assert.deepEqual(ordersInPeriod([first, last, outside, future], '2026-09-28T17:00:00+07:00', 7), [first, last]);
});

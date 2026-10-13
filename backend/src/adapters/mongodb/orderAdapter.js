/**
 * MongoDB: payment orders (_id = orderNo).
 */

const { getCollection } = require('./connection');

const COLLECTION = 'orders';

async function createOrder(order) {
  if (!order || !order.orderNo) throw new Error('orderNo required');
  const col = getCollection(COLLECTION);
  const doc = {
    _id: order.orderNo,
    userId: order.userId,
    userEmail: order.userEmail,
    planId: order.planId,
    amount: order.amount,
    currency: order.currency || 'CNY',
    paymentMethod: order.paymentMethod,
    status: order.status || 'pending',
    tradeNo: order.tradeNo || null,
    paidAt: order.paidAt || null,
    expiresAt: order.expiresAt,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await col.insertOne(doc);
  const { _id, ...rest } = doc;
  return { orderNo: _id, ...rest };
}

async function getOrderByOrderNo(orderNo) {
  if (!orderNo) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: String(orderNo) });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { orderNo: _id, ...rest };
}

async function updateOrderStatus(orderNo, updates, { condition } = {}) {
  if (!orderNo) throw new Error('orderNo required');
  const col = getCollection(COLLECTION);
  const filter = { _id: String(orderNo), ...condition };
  const result = await col.updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date().toISOString() } }
  );
  return result.modifiedCount > 0;
}

async function listOrdersByUser(userId, { limit = 20, skip = 0 } = {}) {
  if (!userId) return [];
  const col = getCollection(COLLECTION);
  const docs = await col
    .find({ userId: String(userId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return docs.map(({ _id, ...rest }) => ({ orderNo: _id, ...rest }));
}

module.exports = {
  createOrder,
  getOrderByOrderNo,
  updateOrderStatus,
  listOrdersByUser
};

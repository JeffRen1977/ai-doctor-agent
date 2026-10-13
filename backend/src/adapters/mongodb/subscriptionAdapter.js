/**
 * MongoDB: user subscriptions (_id = generated).
 */

const { getCollection } = require('./connection');

const COLLECTION = 'subscriptions';

async function getActiveSubscription(userId) {
  if (!userId) return null;
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const doc = await col.findOne({
    userId: String(userId),
    status: 'active',
    endDate: { $gt: now }
  });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { subscriptionId: String(_id), ...rest };
}

async function getSubscriptionByOrderNo(orderNo) {
  if (!orderNo) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ orderNo: String(orderNo) });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { subscriptionId: String(_id), ...rest };
}

async function createSubscription(sub) {
  if (!sub || !sub.userId || !sub.planId) throw new Error('userId and planId required');
  const col = getCollection(COLLECTION);
  const doc = {
    userId: sub.userId,
    planId: sub.planId,
    status: sub.status || 'active',
    startDate: sub.startDate || new Date().toISOString(),
    endDate: sub.endDate,
    orderNo: sub.orderNo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const result = await col.insertOne(doc);
  return { subscriptionId: String(result.insertedId), ...doc };
}

async function updateSubscription(subscriptionId, updates) {
  if (!subscriptionId) throw new Error('subscriptionId required');
  const col = getCollection(COLLECTION);
  const { ObjectId } = require('mongodb');
  let filter;
  try {
    filter = { _id: new ObjectId(subscriptionId) };
  } catch {
    filter = { _id: subscriptionId };
  }
  await col.updateOne(filter, {
    $set: { ...updates, updatedAt: new Date().toISOString() }
  });
}

async function expireSubscription(subscriptionId) {
  return updateSubscription(subscriptionId, { status: 'expired' });
}

module.exports = {
  getActiveSubscription,
  getSubscriptionByOrderNo,
  createSubscription,
  updateSubscription,
  expireSubscription
};

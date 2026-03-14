/**
 * MongoDB 连接（本地或阿里云 ApsaraDB 等）
 * 未配置 MONGODB_URI 时默认连本地 mongodb://localhost:27017，便于先实现代码、后接云库。
 */
const { MongoClient } = require('mongodb');

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'ai_doctor';
const timeoutMs = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 10000;

let client = null;
let db = null;

async function getDb() {
  if (db) return db;
  client = new MongoClient(url, { serverSelectionTimeoutMS: timeoutMs });
  await client.connect();
  db = client.db(dbName);
  return db;
}

function getCollection(name) {
  if (!db) throw new Error('MongoDB not connected; call getDb() before using adapters');
  return db.collection(name);
}

module.exports = { getDb, getCollection, get db() { return db; } };

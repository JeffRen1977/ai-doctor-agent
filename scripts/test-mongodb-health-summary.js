/**
 * 集成测试：验证 MongoDB 连接正常，且 healthSummaryAdapter 能正确读写。
 * 使用前请确保 MongoDB 已启动（本地或 MONGODB_URI 指向的实例）。
 * 若未启动 MongoDB，约 10 秒后会报连接超时（可设 MONGODB_CONNECT_TIMEOUT_MS=5000 缩短）。
 *
 * 用法：
 *   node scripts/test-mongodb-health-summary.js
 * 或指定连接串：
 *   MONGODB_URI=mongodb://localhost:27017 node scripts/test-mongodb-health-summary.js
 * 阿里云：
 *   MONGODB_URI="mongodb://user:pass@dds-xxx.mongodb.rds.aliyuncs.com:3717/admin?replicaSet=mgset-xxx" node scripts/test-mongodb-health-summary.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const TEST_USER_ID = 'test-mongodb-health-summary-user';

async function main() {
  console.log('🔗 测试 MongoDB 连接与 healthSummary 读写...\n');
  console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017 (默认)');
  console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME || 'ai_doctor (默认)\n');

  const { getDb } = require('../backend/src/adapters/mongodb/connection');
  const { getHealthSummary, setHealthSummary } = require('../backend/src/adapters/mongodb/healthSummaryAdapter');

  try {
    await getDb();
    console.log('✅ MongoDB 连接成功\n');

    const summaryText = `[测试] 健康总览写入时间: ${new Date().toISOString()}`;
    await setHealthSummary(TEST_USER_ID, {
      summary: summaryText,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ setHealthSummary 写入成功');

    const read = await getHealthSummary(TEST_USER_ID);
    if (read && read.summary === summaryText) {
      console.log('✅ getHealthSummary 读取成功，内容一致');
      console.log('   摘要前 50 字:', read.summary.slice(0, 50) + '...');
    } else {
      console.log('❌ 读取内容与写入不一致:', read);
      process.exit(1);
    }

    console.log('\n✅ 结论：MongoDB 已连接，healthSummaryAdapter 读写正常。');
  } catch (err) {
    console.error('\n❌ 失败:', err.message);
    if (err.message.includes('connect')) {
      console.log('\n💡 请确认：');
      console.log('   1. MongoDB 已启动（本地: brew services start mongodb-community 或 docker run -p 27017:27017 mongo:6）');
      console.log('   2. MONGODB_URI 正确（若用阿里云，填控制台提供的连接串）');
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

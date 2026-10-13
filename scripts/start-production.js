#!/usr/bin/env node

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 20) {
  console.error(`Node.js ${nodeVersion} is not supported. Requires >=20.`);
  process.exit(1);
}

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
if (!process.env.PORT) process.env.PORT = 8000;

console.log(`Starting AI Doctor Agent (${process.env.NODE_ENV}, port ${process.env.PORT})`);

const fs = require('fs');
const paths = ['./backend/src/index.js', '/app/backend/src/index.js'];

for (const p of paths) {
  if (fs.existsSync(p)) {
    require(p);
    break;
  }
}

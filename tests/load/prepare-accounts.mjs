#!/usr/bin/env node
import { execSync } from 'child_process';
import { randomBytes, pbkdf2Sync } from 'crypto';

const COUNT = parseInt(process.env.ACCOUNT_COUNT || '200', 10);
const PASSWORD = 'LoadTest123!';
const PREFIX = 'loadtest_v3';
const EMAIL_DOMAIN = 'loadtest.local';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_ALGO = 'sha256';

function hashPassword(password, salt) {
  const derived = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, PBKDF2_ALGO);
  return `pbkdf2sha256$1$${PBKDF2_ITERATIONS}$${salt}$${derived.toString('hex')}`;
}

function generateId() {
  return randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

const now = Date.now();
const statements = [];

for (let i = 1; i <= COUNT; i++) {
  const suffix = String(i).padStart(3, '0');
  const email = `${PREFIX}_${suffix}@${EMAIL_DOMAIN}`;
  const salt = `loadtest_salt_${suffix}`;
  const hash = hashPassword(PASSWORD, salt);
  const id = generateId();

  statements.push(
    `INSERT OR IGNORE INTO users(id,name,email,role,plan,avatar_key,created_at,last_login_at,last_activity_at,updated_at,password_salt,password_hash) VALUES('${id}','Load Test ${suffix}','${email}','student','free',NULL,${now},${now},${now},${now},'${salt}','${hash}')`
  );
}

const sql = statements.join(';\n') + ';';

const tmpFile = 'tests/load/seed-v3.sql';
const fs = await import('fs');
fs.writeFileSync(tmpFile, sql);

console.log(`Generated ${COUNT} account statements → ${tmpFile}`);
console.log(`Password: ${PASSWORD}`);
console.log(`Pattern: ${PREFIX}_001@${EMAIL_DOMAIN} ... ${PREFIX}_${String(COUNT).padStart(3,'0')}@${EMAIL_DOMAIN}`);
console.log('');
console.log('To apply:');
console.log(`  npx wrangler d1 execute fixou-db --remote --file=${tmpFile}`);
console.log('');
console.log('To verify:');
console.log(`  npx wrangler d1 execute fixou-db --remote --command "SELECT COUNT(*) as total FROM users WHERE email LIKE '${PREFIX}_%'"`);

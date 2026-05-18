require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

const logFile = path.join(__dirname, '..', '..', 'logs', 'requests.log');

function logSql(sql, params) {
  if (process.env.LOG_REQUESTS !== 'true') return;

  const time = new Date().toTimeString().slice(0, 8);
  const cleanSql = sql.replace(/\/\*app\*\/\s*/g, '').replace(/\s+/g, ' ').trim();
  const paramsStr = params && params.length ? `  [${params.map(p => JSON.stringify(p)).join(', ')}]` : '';

  const line = `[${time}]  SQL      ${cleanSql}${paramsStr}\n`;

  process.stdout.write(line);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFile(logFile, line, () => {});
}

function tagAppSql(sql) {
  if (typeof sql !== 'string') return sql;
  const trimmed = sql.trimStart();
  if (trimmed.startsWith('/*app*/')) return sql;
  return `/*app*/ ${sql}`;
}

const originalPoolExecute = pool.execute.bind(pool);
pool.execute = (sql, params) => {
  logSql(sql, params);
  return originalPoolExecute(tagAppSql(sql), params);
};

const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async (...args) => {
  const connection = await originalGetConnection(...args);
  if (!connection.__appSqlTagged) {
    const originalConnExecute = connection.execute.bind(connection);
    connection.execute = (sql, params) => {
      logSql(sql, params);
      return originalConnExecute(tagAppSql(sql), params);
    };
    connection.__appSqlTagged = true;
  }
  return connection;
};

module.exports = pool;

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 支持环境变量配置数据库路径（Railway 部署用）
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'prompttoplay.db');

let DB;

function getDb() {
  return DB;
}

async function initDb(callback) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    DB = new SQL.Database(buffer);
  } else {
    DB = new SQL.Database();
  }

  DB.run('PRAGMA foreign_keys=ON');

  DB.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    plan TEXT DEFAULT 'free',
    daily_generations_used INTEGER DEFAULT 0,
    daily_generations_date TEXT,
    extra_generations INTEGER DEFAULT 0,
    daily_share_claimed INTEGER DEFAULT 0,
    daily_share_date TEXT,
    invited_by TEXT,
    invitation_code TEXT UNIQUE,
    stripe_customer_id TEXT,
    credits INTEGER DEFAULT 5,
    created_at TEXT
  )`);
  
  // Migrate: add credits column if upgrading from old schema
  try { DB.run('ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 5'); } catch(e) {}

  DB.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount INTEGER,
    description TEXT,
    related_id TEXT,
    created_at TEXT
  )`);

  DB.run(`CREATE TABLE IF NOT EXISTS payment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE,
    user_id INTEGER,
    package_id TEXT,
    amount_yuan INTEGER,
    credits INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    paid_at TEXT
  )`);

  DB.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    category TEXT,
    style TEXT,
    html_code TEXT,
    cover_image TEXT,
    is_public INTEGER DEFAULT 1,
    watermark_removed INTEGER DEFAULT 0,
    original_game_id INTEGER,
    remix_count INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  )`);

  // Migrate: add cover_image column if upgrading from old schema
  try { DB.run('ALTER TABLE games ADD COLUMN cover_image TEXT'); } catch(e) {}
  // Migrate: add likes column
  try { DB.run('ALTER TABLE games ADD COLUMN likes INTEGER DEFAULT 0'); } catch(e) {}
  // Migrate: add style column
  try { DB.run('ALTER TABLE games ADD COLUMN style TEXT'); } catch(e) {}

  // 游戏点赞记录表（防止重复点赞）
  DB.run(`CREATE TABLE IF NOT EXISTS game_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    user_id INTEGER,
    created_at TEXT,
    UNIQUE(game_id, user_id)
  )`);

  DB.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    key TEXT UNIQUE,
    created_at TEXT
  )`);

  saveDb();

  if (callback) callback(null);
}

function saveDb() {
  const data = DB.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Run INSERT/UPDATE/DELETE, return { lastID, changes }
function run(sql, params = []) {
  DB.run(sql, params);
  const lastID = lastInsertId();
  const changes = DB.getRowsModified();
  saveDb();
  return { lastID, changes };
}

function lastInsertId() {
  try {
    const r = DB.exec('SELECT last_insert_rowid() as id');
    return r[0]?.values[0]?.[0] || 0;
  } catch {
    return 0;
  }
}

// Get single row
function get(sql, params = []) {
  const stmt = DB.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

// Get all rows
function all(sql, params = []) {
  const stmt = DB.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { getDb, initDb, run, get, all };

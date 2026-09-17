const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL;

let isPg = false;
let pool = null;
let sqliteDb = null;

if (DATABASE_URL) {
  // Conexão PostgreSQL (Render / Nuvem)
  isPg = true;
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Inicializa tabelas no PostgreSQL
  const initPg = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS produtos (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          preco NUMERIC(10, 2) NOT NULL DEFAULT 0,
          comissao_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
          ativo INTEGER NOT NULL DEFAULT 1,
          criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendedores (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT,
          telefone TEXT,
          ativo INTEGER NOT NULL DEFAULT 1,
          criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendas (
          id SERIAL PRIMARY KEY,
          vendedor TEXT NOT NULL,
          produto_id INTEGER NOT NULL REFERENCES produtos(id),
          quantidade INTEGER NOT NULL DEFAULT 1,
          valor_unitario NUMERIC(10, 2) NOT NULL,
          desconto_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
          valor_total NUMERIC(10, 2) NOT NULL,
          comissao_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
          comissao_valor NUMERIC(10, 2) NOT NULL DEFAULT 0,
          cliente_nome TEXT NOT NULL,
          cliente_email TEXT,
          cliente_telefone TEXT,
          data_venda TEXT NOT NULL,
          criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ PostgreSQL conectado e tabelas sincronizadas!');
    } catch (err) {
      console.error('❌ Erro ao inicializar tabelas PostgreSQL:', err);
    }
  };
  initPg();
} else {
  // Conexão local SQLite (fallback para desenvolvimento)
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sqliteDb = new Database(path.join(dataDir, 'vendas.db'));
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco REAL NOT NULL DEFAULT 0,
      comissao_pct REAL NOT NULL DEFAULT 0,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS vendedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendedor TEXT NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      valor_unitario REAL NOT NULL,
      desconto_pct REAL NOT NULL DEFAULT 0,
      valor_total REAL NOT NULL,
      comissao_pct REAL NOT NULL DEFAULT 0,
      comissao_valor REAL NOT NULL DEFAULT 0,
      cliente_nome TEXT NOT NULL,
      cliente_email TEXT,
      cliente_telefone TEXT,
      data_venda TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );
  `);
  console.log('✅ SQLite local conectado!');
}

// Wrapper unificado para queries assíncronas (suporta tanto SQLite quanto PostgreSQL)
async function query(sql, params = []) {
  if (isPg) {
    // Converte parâmetros ? para $1, $2, etc no PostgreSQL
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pool.query(pgSql, params);
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      const info = stmt.run(...params);
      return [{ id: info.lastInsertRowid }];
    }
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = {
  query,
  queryOne,
  isPg
};

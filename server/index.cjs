const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do front-end compilado
app.use(express.static(path.join(__dirname, '../dist')));

// ==================== PRODUTOS ====================

// Listar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const { ativo } = req.query;
    let sql;
    let params = [];
    if (ativo !== undefined) {
      sql = 'SELECT * FROM produtos WHERE ativo = ? ORDER BY nome';
      params = [Number(ativo)];
    } else {
      sql = 'SELECT * FROM produtos ORDER BY nome';
    }
    const produtos = await db.query(sql, params);
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar produto
app.post('/api/produtos', async (req, res) => {
  try {
    const { nome, preco, comissao_pct } = req.body;
    if (!nome || preco === undefined || comissao_pct === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, preco, comissao_pct' });
    }
    
    if (db.isPg) {
      const rows = await db.query(
        'INSERT INTO produtos (nome, preco, comissao_pct) VALUES (?, ?, ?) RETURNING *',
        [nome, preco, comissao_pct]
      );
      return res.status(201).json(rows[0]);
    } else {
      const result = await db.query(
        'INSERT INTO produtos (nome, preco, comissao_pct) VALUES (?, ?, ?)',
        [nome, preco, comissao_pct]
      );
      const produto = await db.queryOne('SELECT * FROM produtos WHERE id = ?', [result[0].id]);
      return res.status(201).json(produto);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { nome, preco, comissao_pct, ativo } = req.body;
    const fields = [];
    const values = [];

    if (nome !== undefined) { fields.push('nome = ?'); values.push(nome); }
    if (preco !== undefined) { fields.push('preco = ?'); values.push(preco); }
    if (comissao_pct !== undefined) { fields.push('comissao_pct = ?'); values.push(comissao_pct); }
    if (ativo !== undefined) { fields.push('ativo = ?'); values.push(ativo); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.params.id);
    await db.query(`UPDATE produtos SET ${fields.join(', ')} WHERE id = ?`, values);

    const produto = await db.queryOne('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    res.json(produto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desativar produto (soft delete)
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    await db.query('UPDATE produtos SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VENDAS ====================

// Listar vendas
app.get('/api/vendas', async (req, res) => {
  try {
    const { vendedor, data_inicio, data_fim } = req.query;
    let sql = `
      SELECT v.*, p.nome as produto_nome
      FROM vendas v
      LEFT JOIN produtos p ON v.produto_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (vendedor) {
      sql += ' AND v.vendedor LIKE ?';
      params.push(`%${vendedor}%`);
    }
    if (data_inicio) {
      sql += ' AND v.data_venda >= ?';
      params.push(data_inicio);
    }
    if (data_fim) {
      sql += ' AND v.data_venda <= ?';
      params.push(data_fim);
    }

    sql += ' ORDER BY v.data_venda DESC, v.criado_em DESC';

    const vendas = await db.query(sql, params);
    res.json(vendas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resumo das vendas (totais)
app.get('/api/vendas/resumo', async (req, res) => {
  try {
    const { vendedor, data_inicio, data_fim } = req.query;
    let sql = `
      SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(valor_total), 0) as valor_total,
        COALESCE(SUM(comissao_valor), 0) as comissao_total
      FROM vendas
      WHERE 1=1
    `;
    const params = [];

    if (vendedor) {
      sql += ' AND vendedor LIKE ?';
      params.push(`%${vendedor}%`);
    }
    if (data_inicio) {
      sql += ' AND data_venda >= ?';
      params.push(data_inicio);
    }
    if (data_fim) {
      sql += ' AND data_venda <= ?';
      params.push(data_fim);
    }

    const resumo = await db.queryOne(sql, params);
    res.json(resumo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar venda
app.post('/api/vendas', async (req, res) => {
  try {
    const {
      vendedor, produto_id, quantidade, valor_unitario,
      desconto_pct, comissao_pct, cliente_nome, cliente_email,
      cliente_telefone, data_venda
    } = req.body;

    if (!vendedor || !produto_id || !quantidade || !valor_unitario || !cliente_nome || !data_venda) {
      return res.status(400).json({
        error: 'Campos obrigatórios: vendedor, produto_id, quantidade, valor_unitario, cliente_nome, data_venda'
      });
    }

    const desconto = desconto_pct || 0;
    const comissao = comissao_pct || 0;
    const subtotal = valor_unitario * quantidade;
    const valor_total = subtotal * (1 - desconto / 100);
    const comissao_valor = valor_total * (comissao / 100);

    const insertSql = `
      INSERT INTO vendas (vendedor, produto_id, quantidade, valor_unitario, desconto_pct, valor_total, comissao_pct, comissao_valor, cliente_nome, cliente_email, cliente_telefone, data_venda)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertParams = [
      vendedor, produto_id, quantidade, valor_unitario,
      desconto, valor_total, comissao, comissao_valor,
      cliente_nome, cliente_email || null, cliente_telefone || null, data_venda
    ];

    let newId;
    if (db.isPg) {
      const rows = await db.query(`${insertSql} RETURNING id`, insertParams);
      newId = rows[0].id;
    } else {
      const result = await db.query(insertSql, insertParams);
      newId = result[0].id;
    }

    const venda = await db.queryOne(`
      SELECT v.*, p.nome as produto_nome
      FROM vendas v
      LEFT JOIN produtos p ON v.produto_id = p.id
      WHERE v.id = ?
    `, [newId]);

    res.status(201).json(venda);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir venda
app.delete('/api/vendas/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vendas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VENDEDORES ====================

// Listar vendedores
app.get('/api/vendedores', async (req, res) => {
  try {
    const { ativo } = req.query;
    let sql;
    let params = [];
    if (ativo !== undefined) {
      sql = 'SELECT * FROM vendedores WHERE ativo = ? ORDER BY nome';
      params = [Number(ativo)];
    } else {
      sql = 'SELECT * FROM vendedores ORDER BY nome';
    }
    const vendedores = await db.query(sql, params);
    res.json(vendedores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar vendedor
app.post('/api/vendedores', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Campo obrigatório: nome' });
    }

    if (db.isPg) {
      const rows = await db.query(
        'INSERT INTO vendedores (nome, email, telefone) VALUES (?, ?, ?) RETURNING *',
        [nome, email || null, telefone || null]
      );
      return res.status(201).json(rows[0]);
    } else {
      const result = await db.query(
        'INSERT INTO vendedores (nome, email, telefone) VALUES (?, ?, ?)',
        [nome, email || null, telefone || null]
      );
      const vendedor = await db.queryOne('SELECT * FROM vendedores WHERE id = ?', [result[0].id]);
      return res.status(201).json(vendedor);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar vendedor
app.put('/api/vendedores/:id', async (req, res) => {
  try {
    const { nome, email, telefone, ativo } = req.body;
    const fields = [];
    const values = [];

    if (nome !== undefined) { fields.push('nome = ?'); values.push(nome); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (telefone !== undefined) { fields.push('telefone = ?'); values.push(telefone); }
    if (ativo !== undefined) { fields.push('ativo = ?'); values.push(ativo); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.params.id);
    await db.query(`UPDATE vendedores SET ${fields.join(', ')} WHERE id = ?`, values);

    const vendedor = await db.queryOne('SELECT * FROM vendedores WHERE id = ?', [req.params.id]);
    res.json(vendedor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desativar vendedor (soft delete)
app.delete('/api/vendedores/:id', async (req, res) => {
  try {
    await db.query('UPDATE vendedores SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback para SPA (React Router - Express 5)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

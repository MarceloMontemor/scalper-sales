const express = require('express');
const cors = require('cors');
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==================== PRODUTOS ====================

// Listar produtos
app.get('/api/produtos', (req, res) => {
  try {
    const { ativo } = req.query;
    let stmt;
    if (ativo !== undefined) {
      stmt = db.prepare('SELECT * FROM produtos WHERE ativo = ? ORDER BY nome');
      res.json(stmt.all(Number(ativo)));
    } else {
      stmt = db.prepare('SELECT * FROM produtos ORDER BY nome');
      res.json(stmt.all());
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar produto
app.post('/api/produtos', (req, res) => {
  try {
    const { nome, preco, comissao_pct } = req.body;
    if (!nome || preco === undefined || comissao_pct === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, preco, comissao_pct' });
    }
    const stmt = db.prepare(
      'INSERT INTO produtos (nome, preco, comissao_pct) VALUES (?, ?, ?)'
    );
    const result = stmt.run(nome, preco, comissao_pct);
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(produto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
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
    const stmt = db.prepare(`UPDATE produtos SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    res.json(produto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desativar produto (soft delete)
app.delete('/api/produtos/:id', (req, res) => {
  try {
    const stmt = db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VENDAS ====================

// Listar vendas
app.get('/api/vendas', (req, res) => {
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

    const stmt = db.prepare(sql);
    res.json(stmt.all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resumo das vendas (totais)
app.get('/api/vendas/resumo', (req, res) => {
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

    const stmt = db.prepare(sql);
    res.json(stmt.get(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar venda
app.post('/api/vendas', (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO vendas (vendedor, produto_id, quantidade, valor_unitario, desconto_pct, valor_total, comissao_pct, comissao_valor, cliente_nome, cliente_email, cliente_telefone, data_venda)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      vendedor, produto_id, quantidade, valor_unitario,
      desconto, valor_total, comissao, comissao_valor,
      cliente_nome, cliente_email || null, cliente_telefone || null, data_venda
    );

    const venda = db.prepare(`
      SELECT v.*, p.nome as produto_nome
      FROM vendas v
      LEFT JOIN produtos p ON v.produto_id = p.id
      WHERE v.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(venda);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir venda
app.delete('/api/vendas/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM vendas WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VENDEDORES ====================

// Listar vendedores
app.get('/api/vendedores', (req, res) => {
  try {
    const { ativo } = req.query;
    let stmt;
    if (ativo !== undefined) {
      stmt = db.prepare('SELECT * FROM vendedores WHERE ativo = ? ORDER BY nome');
      res.json(stmt.all(Number(ativo)));
    } else {
      stmt = db.prepare('SELECT * FROM vendedores ORDER BY nome');
      res.json(stmt.all());
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar vendedor
app.post('/api/vendedores', (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Campo obrigatório: nome' });
    }
    const stmt = db.prepare(
      'INSERT INTO vendedores (nome, email, telefone) VALUES (?, ?, ?)'
    );
    const result = stmt.run(nome, email || null, telefone || null);
    const vendedor = db.prepare('SELECT * FROM vendedores WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(vendedor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar vendedor
app.put('/api/vendedores/:id', (req, res) => {
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
    const stmt = db.prepare(`UPDATE vendedores SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const vendedor = db.prepare('SELECT * FROM vendedores WHERE id = ?').get(req.params.id);
    res.json(vendedor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desativar vendedor (soft delete)
app.delete('/api/vendedores/:id', (req, res) => {
  try {
    const stmt = db.prepare('UPDATE vendedores SET ativo = 0 WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});


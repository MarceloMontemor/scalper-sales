import { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart } from 'lucide-react';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function VendaForm({ onClose, onSave }) {
  const [produtos, setProdutos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vendedor: '',
    produto_id: '',
    quantidade: 1,
    valor_unitario: '',
    desconto_pct: 0,
    comissao_pct: '',
    cliente_nome: '',
    cliente_email: '',
    cliente_telefone: '',
    data_venda: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/produtos?ativo=1').then((r) => r.json()),
      fetch('/api/vendedores?ativo=1').then((r) => r.json()),
    ])
      .then(([prods, vends]) => {
        setProdutos(prods);
        setVendedores(vends);
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-fill when product is selected
      if (name === 'produto_id' && value) {
        const prod = produtos.find((p) => p.id === Number(value));
        if (prod) {
          updated.valor_unitario = prod.preco;
          updated.comissao_pct = prod.comissao_pct;
        }
      }

      return updated;
    });
  };

  const calc = useMemo(() => {
    const qty = parseInt(form.quantidade) || 0;
    const price = parseFloat(form.valor_unitario) || 0;
    const discount = parseFloat(form.desconto_pct) || 0;
    const commission = parseFloat(form.comissao_pct) || 0;

    const subtotal = price * qty;
    const total = subtotal * (1 - discount / 100);
    const comissaoValor = total * (commission / 100);

    return { subtotal, total, comissaoValor };
  }, [form.quantidade, form.valor_unitario, form.desconto_pct, form.comissao_pct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.vendedor.trim() ||
      !form.produto_id ||
      !form.valor_unitario ||
      !form.cliente_nome.trim() ||
      !form.data_venda
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendedor: form.vendedor.trim(),
          produto_id: Number(form.produto_id),
          quantidade: parseInt(form.quantidade) || 1,
          valor_unitario: parseFloat(form.valor_unitario),
          desconto_pct: parseFloat(form.desconto_pct) || 0,
          comissao_pct: parseFloat(form.comissao_pct) || 0,
          cliente_nome: form.cliente_nome.trim(),
          cliente_email: form.cliente_email.trim() || undefined,
          cliente_telefone: form.cliente_telefone.trim() || undefined,
          data_venda: form.data_venda,
        }),
      });

      if (!res.ok) throw new Error('Erro ao registrar venda');
      const data = await res.json();
      onSave(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3>
            <ShoppingCart size={20} />
            Nova Venda
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Vendedor & Data */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vendedor</label>
                <select
                  name="vendedor"
                  className="form-select"
                  value={form.vendedor}
                  onChange={handleChange}
                  required
                  autoFocus
                >
                  <option value="">Selecione um vendedor...</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.nome}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data da Venda</label>
                <input
                  type="date"
                  name="data_venda"
                  className="form-input"
                  value={form.data_venda}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Produto */}
            <div className="form-group">
              <label className="form-label">Produto</label>
              <select
                name="produto_id"
                className="form-select"
                value={form.produto_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um produto...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {formatCurrency(p.preco)} ({p.comissao_pct}% comissão)
                  </option>
                ))}
              </select>
            </div>

            {/* Qtd, Preço, Desconto, Comissão */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input
                  type="number"
                  name="quantidade"
                  className="form-input"
                  min="1"
                  value={form.quantidade}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preço Unitário (R$)</label>
                <input
                  type="number"
                  name="valor_unitario"
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.valor_unitario}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Desconto (%)</label>
                <input
                  type="number"
                  name="desconto_pct"
                  className="form-input"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={form.desconto_pct}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Comissão (%)</label>
                <input
                  type="number"
                  name="comissao_pct"
                  className="form-input"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={form.comissao_pct}
                  onChange={handleChange}
                />
                <span className="form-hint">Preenchido automaticamente pelo produto</span>
              </div>
            </div>

            {/* Cálculos */}
            <div className="form-calc">
              <div className="calc-item">
                <span className="calc-label">Subtotal</span>
                <span className="calc-value">{formatCurrency(calc.subtotal)}</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Valor Total</span>
                <span className="calc-value">{formatCurrency(calc.total)}</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Comissão</span>
                <span className="calc-value success">{formatCurrency(calc.comissaoValor)}</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Desconto</span>
                <span className="calc-value" style={{ color: 'var(--warning)' }}>
                  {form.desconto_pct || 0}%
                </span>
              </div>
            </div>

            {/* Cliente */}
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 28, marginBottom: 16, fontWeight: 600 }}>
              Dados do Cliente
            </h4>
            <div className="form-group">
              <label className="form-label">Nome do Cliente</label>
              <input
                type="text"
                name="cliente_nome"
                className="form-input"
                placeholder="Nome completo"
                value={form.cliente_nome}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="cliente_email"
                  className="form-input"
                  placeholder="email@exemplo.com"
                  value={form.cliente_email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  type="tel"
                  name="cliente_telefone"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={form.cliente_telefone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><span className="spinner" /> Registrando...</>
              ) : (
                'Registrar Venda'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

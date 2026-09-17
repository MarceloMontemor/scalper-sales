import { useState } from 'react';
import { X, Package } from 'lucide-react';

export default function ProdutoForm({ produto, onClose, onSave }) {
  const isEditing = !!produto;
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    preco: produto?.preco ?? '',
    comissao_pct: produto?.comissao_pct ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || form.preco === '' || form.comissao_pct === '') return;

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/produtos/${produto.id}`
        : '/api/produtos';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          preco: parseFloat(form.preco),
          comissao_pct: parseFloat(form.comissao_pct),
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar produto');
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Package size={20} />
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome do Produto</label>
              <input
                type="text"
                name="nome"
                className="form-input"
                placeholder="Ex: Plano Premium Mensal"
                value={form.nome}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Preço (R$)</label>
                <input
                  type="number"
                  name="preco"
                  className="form-input"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  value={form.preco}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Comissão (%)</label>
                <input
                  type="number"
                  name="comissao_pct"
                  className="form-input"
                  placeholder="0"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.comissao_pct}
                  onChange={handleChange}
                  required
                />
                <span className="form-hint">
                  Percentual que o vendedor recebe por venda
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><span className="spinner" /> Salvando...</>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

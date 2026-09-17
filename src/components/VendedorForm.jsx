import { useState } from 'react';
import { X, Users } from 'lucide-react';

export default function VendedorForm({ vendedor, onClose, onSave }) {
  const isEditing = !!vendedor;
  const [form, setForm] = useState({
    nome: vendedor?.nome || '',
    email: vendedor?.email || '',
    telefone: vendedor?.telefone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return;

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/vendedores/${vendedor.id}`
        : '/api/vendedores';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar vendedor');
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
            <Users size={20} />
            {isEditing ? 'Editar Vendedor' : 'Novo Vendedor'}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome do Vendedor</label>
              <input
                type="text"
                name="nome"
                className="form-input"
                placeholder="Ex: João Silva"
                value={form.nome}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
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
                <><span className="spinner" /> Salvando...</>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Cadastrar Vendedor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

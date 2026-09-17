import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import VendedorForm from '../components/VendedorForm';
import VendedorList from '../components/VendedorList';

export default function VendedoresPage({ showToast }) {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState(null);
  const [search, setSearch] = useState('');

  const fetchVendedores = async () => {
    try {
      const res = await fetch('/api/vendedores');
      const data = await res.json();
      setVendedores(data);
    } catch (err) {
      console.error('Erro ao carregar vendedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleSave = (vendedor) => {
    if (editingVendedor) {
      setVendedores((prev) =>
        prev.map((v) => (v.id === vendedor.id ? vendedor : v))
      );
      showToast('Vendedor atualizado com sucesso!');
    } else {
      setVendedores((prev) => [...prev, vendedor]);
      showToast('Vendedor cadastrado com sucesso!');
    }
    setShowForm(false);
    setEditingVendedor(null);
  };

  const handleEdit = (vendedor) => {
    setEditingVendedor(vendedor);
    setShowForm(true);
  };

  const handleToggle = async (vendedor) => {
    try {
      const res = await fetch(`/api/vendedores/${vendedor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: vendedor.ativo ? 0 : 1 }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setVendedores((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v))
      );
      showToast(
        updated.ativo ? 'Vendedor ativado!' : 'Vendedor desativado!',
        updated.ativo ? 'success' : 'error'
      );
    } catch {
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingVendedor(null);
  };

  const filtered = vendedores.filter((v) =>
    v.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="filters-bar">
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar vendedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Novo Vendedor
          </button>
        </div>
        <VendedorList
          vendedores={filtered}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </div>

      {showForm && (
        <VendedorForm
          vendedor={editingVendedor}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import ProdutoForm from '../components/ProdutoForm';
import ProdutoList from '../components/ProdutoList';

export default function ProdutosPage({ showToast }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [search, setSearch] = useState('');

  const fetchProdutos = async () => {
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleSave = (produto) => {
    if (editingProduto) {
      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? produto : p))
      );
      showToast('Produto atualizado com sucesso!');
    } else {
      setProdutos((prev) => [...prev, produto]);
      showToast('Produto cadastrado com sucesso!');
    }
    setShowForm(false);
    setEditingProduto(null);
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setShowForm(true);
  };

  const handleToggle = async (produto) => {
    try {
      const res = await fetch(`/api/produtos/${produto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: produto.ativo ? 0 : 1 }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProdutos((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      showToast(
        updated.ativo ? 'Produto ativado!' : 'Produto desativado!',
        updated.ativo ? 'success' : 'error'
      );
    } catch {
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingProduto(null);
  };

  const filtered = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
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
                placeholder="Buscar produto..."
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
            Novo Produto
          </button>
        </div>
        <ProdutoList
          produtos={filtered}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </div>

      {showForm && (
        <ProdutoForm
          produto={editingProduto}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </>
  );
}

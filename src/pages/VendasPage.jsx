import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import VendaForm from '../components/VendaForm';
import VendaList from '../components/VendaList';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function VendasPage({ showToast }) {
  const [vendas, setVendas] = useState([]);
  const [resumo, setResumo] = useState({ total_vendas: 0, valor_total: 0, comissao_total: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vendedores, setVendedores] = useState([]);

  // Filters
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (filtroVendedor) params.set('vendedor', filtroVendedor);
    if (filtroInicio) params.set('data_inicio', filtroInicio);
    if (filtroFim) params.set('data_fim', filtroFim);
    return params.toString();
  }, [filtroVendedor, filtroInicio, filtroFim]);

  const fetchData = useCallback(async () => {
    try {
      const query = buildQuery();
      const [vendasRes, resumoRes, vendedoresRes] = await Promise.all([
        fetch(`/api/vendas?${query}`),
        fetch(`/api/vendas/resumo?${query}`),
        fetch('/api/vendedores'),
      ]);
      setVendas(await vendasRes.json());
      setResumo(await resumoRes.json());
      setVendedores(await vendedoresRes.json());
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = (venda) => {
    setShowForm(false);
    showToast('Venda registrada com sucesso!');
    fetchData();
  };

  const handleDelete = async (venda) => {
    if (!window.confirm(`Excluir a venda de ${venda.vendedor}?`)) return;
    try {
      const res = await fetch(`/api/vendas/${venda.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Venda excluída!', 'error');
      fetchData();
    } catch {
      showToast('Erro ao excluir venda', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total de Vendas</div>
          <div className="stat-value accent">{resumo.total_vendas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Valor Total</div>
          <div className="stat-value">
            <DollarSign size={20} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.5 }} />
            {formatCurrency(resumo.valor_total)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Comissões</div>
          <div className="stat-value success">{formatCurrency(resumo.comissao_total)}</div>
        </div>
      </div>

      {/* Sales Card */}
      <div className="card">
        <div className="card-header">
          <div className="filters-bar">
            <select
              className="form-select"
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
            >
              <option value="">Todos os vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.nome}>{v.nome}</option>
              ))}
            </select>

            <input
              type="date"
              className="form-input"
              value={filtroInicio}
              onChange={(e) => setFiltroInicio(e.target.value)}
              title="Data início"
              style={{ minWidth: 150 }}
            />

            <input
              type="date"
              className="form-input"
              value={filtroFim}
              onChange={(e) => setFiltroFim(e.target.value)}
              title="Data fim"
              style={{ minWidth: 150 }}
            />

            {(filtroVendedor || filtroInicio || filtroFim) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFiltroVendedor('');
                  setFiltroInicio('');
                  setFiltroFim('');
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Nova Venda
          </button>
        </div>

        <VendaList vendas={vendas} onDelete={handleDelete} />
      </div>

      {showForm && (
        <VendaForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

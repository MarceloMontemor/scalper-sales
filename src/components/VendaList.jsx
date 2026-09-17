import { Trash2, ShoppingCart, User, Mail, Phone } from 'lucide-react';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function VendaList({ vendas, onDelete }) {
  if (vendas.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingCart size={48} />
        <h4>Nenhuma venda encontrada</h4>
        <p>Registre a primeira venda da sua equipe.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Vendedor</th>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Desconto</th>
            <th>Total</th>
            <th>Comissão</th>
            <th>Cliente</th>
            <th style={{ width: 60 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((v) => (
            <tr key={v.id}>
              <td className="text-secondary" style={{ whiteSpace: 'nowrap' }}>
                {formatDate(v.data_venda)}
              </td>
              <td className="font-medium">{v.vendedor}</td>
              <td>{v.produto_nome || `Produto #${v.produto_id}`}</td>
              <td>{v.quantidade}</td>
              <td>
                {v.desconto_pct > 0 ? (
                  <span className="badge badge-warning">{v.desconto_pct}%</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="currency font-bold">{formatCurrency(v.valor_total)}</td>
              <td className="currency text-success font-medium">
                {formatCurrency(v.comissao_valor)}
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                    <User size={12} className="text-muted" />
                    {v.cliente_nome}
                  </span>
                  {v.cliente_email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }} className="text-muted">
                      <Mail size={10} />
                      {v.cliente_email}
                    </span>
                  )}
                  {v.cliente_telefone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }} className="text-muted">
                      <Phone size={10} />
                      {v.cliente_telefone}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <button
                  className="btn btn-ghost btn-icon"
                  title="Excluir venda"
                  onClick={() => onDelete(v)}
                >
                  <Trash2 size={16} className="text-danger" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

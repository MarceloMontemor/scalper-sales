import { Edit2, ToggleLeft, ToggleRight, Package } from 'lucide-react';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function ProdutoList({ produtos, onEdit, onToggle }) {
  if (produtos.length === 0) {
    return (
      <div className="empty-state">
        <Package size={48} />
        <h4>Nenhum produto cadastrado</h4>
        <p>Comece cadastrando o primeiro produto da sua equipe.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Preço</th>
            <th>Comissão</th>
            <th>Status</th>
            <th style={{ width: 100 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">{p.nome}</td>
              <td className="currency">{formatCurrency(p.preco)}</td>
              <td>
                <span className="badge badge-accent">{p.comissao_pct}%</span>
              </td>
              <td>
                {p.ativo ? (
                  <span className="badge badge-success">Ativo</span>
                ) : (
                  <span className="badge badge-danger">Inativo</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-icon"
                    title="Editar"
                    onClick={() => onEdit(p)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    title={p.ativo ? 'Desativar' : 'Ativar'}
                    onClick={() => onToggle(p)}
                  >
                    {p.ativo ? (
                      <ToggleRight size={16} className="text-success" />
                    ) : (
                      <ToggleLeft size={16} className="text-danger" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

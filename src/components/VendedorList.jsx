import { Edit2, ToggleLeft, ToggleRight, Users, Mail, Phone } from 'lucide-react';

export default function VendedorList({ vendedores, onEdit, onToggle }) {
  if (vendedores.length === 0) {
    return (
      <div className="empty-state">
        <Users size={48} />
        <h4>Nenhum vendedor cadastrado</h4>
        <p>Comece cadastrando os membros da sua equipe.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Status</th>
            <th style={{ width: 100 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vendedores.map((v) => (
            <tr key={v.id}>
              <td className="font-medium">{v.nome}</td>
              <td>
                {v.email ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                    <Mail size={14} className="text-muted" />
                    {v.email}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                {v.telefone ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                    <Phone size={14} className="text-muted" />
                    {v.telefone}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                {v.ativo ? (
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
                    onClick={() => onEdit(v)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    title={v.ativo ? 'Desativar' : 'Ativar'}
                    onClick={() => onToggle(v)}
                  >
                    {v.ativo ? (
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

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, Package, Users, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/vendedores', label: 'Vendedores', icon: Users },
  { to: '/produtos', label: 'Produtos', icon: Package },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageInfo = {
    '/vendas': { title: 'Vendas', subtitle: 'Registre e acompanhe as vendas da sua equipe' },
    '/vendedores': { title: 'Vendedores', subtitle: 'Cadastre e gerencie os membros da equipe' },
    '/produtos': { title: 'Produtos', subtitle: 'Gerencie o catálogo de produtos e comissões' },
  };

  const current = pageInfo[location.pathname] || pageInfo['/vendas'];

  return (
    <div className="app-layout">
      {/* Mobile toggle */}
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>
            <span className="brand-icon">
              <ShoppingCart size={18} />
            </span>
            Scalper Tracker
          </h1>
          <p>Controle de vendas comercial SCALPER</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="page-header">
          <h2>{current.title}</h2>
          <p>{current.subtitle}</p>
        </header>
        <div className="page-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

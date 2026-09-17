import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import VendasPage from './pages/VendasPage';
import VendedoresPage from './pages/VendedoresPage';
import ProdutosPage from './pages/ProdutosPage';

function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onRemove(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <BrowserRouter>
      <Toast toasts={toasts} onRemove={removeToast} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/vendas" replace />} />
          <Route path="vendas" element={<VendasPage showToast={showToast} />} />
          <Route path="vendedores" element={<VendedoresPage showToast={showToast} />} />
          <Route path="produtos" element={<ProdutosPage showToast={showToast} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

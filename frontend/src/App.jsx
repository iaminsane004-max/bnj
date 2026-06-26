import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import Storefront from './components/Storefront';
import OrderSuccess from './components/OrderSuccess';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [view, setView] = useState('storefront'); // 'storefront' | 'success' | 'admin'
  const [createdOrder, setCreatedOrder] = useState(null);
  const [config, setConfig] = useState({ shopPhone: '919876543210', shopUpi: 'bakeandjoy@okaxis' });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load shop configuration:', err));
  }, []);

  const handleOrderCreated = (order) => {
    setCreatedOrder(order);
    setView('success');
  };

  const handleBackToStore = () => {
    setView('storefront');
    setCreatedOrder(null);
  };

  return (
    <CartProvider>
      {view === 'storefront' && (
        <Storefront 
          onOrderCreated={handleOrderCreated} 
          onViewAdmin={() => setView('admin')} 
          shopPhone={config.shopPhone}
        />
      )}
      {view === 'success' && createdOrder && (
        <OrderSuccess 
          order={createdOrder} 
          onBackToStore={handleBackToStore} 
          shopUpi={config.shopUpi}
          shopPhone={config.shopPhone}
        />
      )}
      {view === 'admin' && (
        <AdminDashboard 
          onBackToStore={() => setView('storefront')} 
        />
      )}
    </CartProvider>
  );
}

export default App;

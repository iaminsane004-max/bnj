import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, RefreshCw, Plus, Edit2, Trash2, CheckCircle2, Clock, Send, AlertTriangle, Package } from 'lucide-react';

const API_BASE = '/api';

export default function AdminDashboard({ onBackToStore }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'inventory'
  
  // Loading & Error states
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // CRUD form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Cakes',
    image_url: ''
  });

  const categories = ['Cakes', 'Pastries', 'Bread', 'Savories'];

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProds(true);
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoadingProds(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch(`${API_BASE}/orders`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!currentProduct.name || currentProduct.price === '' || currentProduct.stock === '') {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      name: currentProduct.name,
      description: currentProduct.description,
      price: parseFloat(currentProduct.price),
      stock: parseInt(currentProduct.stock),
      category: currentProduct.category,
      image_url: currentProduct.image_url
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`${API_BASE}/products/${currentProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Failed to save product');

      // Refresh list & Reset Form
      fetchProducts();
      resetForm();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditClick = (prod) => {
    setIsEditing(true);
    setCurrentProduct({
      id: prod.id,
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      stock: prod.stock,
      category: prod.category,
      image_url: prod.image_url || ''
    });
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete product');
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentProduct({
      id: '',
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Cakes',
      image_url: ''
    });
  };

  const updateOrderStatus = async (orderId, updates) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const triggerReceiptWhatsApp = (order) => {
    const shortId = order.id.substring(0, 8).toUpperCase();
    const formattedTotal = parseFloat(order.total_amount).toFixed(2);
    const receiptMessage = 
`✅ *Payment Received! Bake and Joy Confirmation*

Thank you! We have received your payment for *Order #${shortId}*.

*Receipt Total:* ₹${formattedTotal}
*Status:* Preparing your items. We will notify you when it's ready!`;

    const encodedText = encodeURIComponent(receiptMessage);
    const phone = order.customer_phone;
    
    // Ensure phone starts with 91 for Indian numbers if not already formatted
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-12">
      {/* Header */}
      <header className="bg-amber-950 text-amber-50 px-4 py-4 sm:px-8 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToStore}
            className="p-1.5 hover:bg-amber-900 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold heading-font">Merchant Control Center</h1>
            <p className="text-xs text-amber-200">Manage orders, update stock levels, and customize product listings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchProducts(); fetchOrders(); }}
            className="p-2 hover:bg-amber-900 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex border-b border-stone-300">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Incoming Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'inventory'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Inventory Management ({products.length})
          </button>
        </div>

        {/* Tab 1: Orders Tracker */}
        {activeTab === 'orders' && (
          <div className="mt-6 space-y-4">
            {loadingOrders ? (
              <div className="text-center py-12 text-stone-500">Loading incoming orders...</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <p className="font-bold text-stone-600">No orders registered yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map(order => {
                  const shortId = order.id.substring(0, 8).toUpperCase();
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-stone-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-900">Order #{shortId}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              order.delivery_type === 'Delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {order.delivery_type.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">Placed on {new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Payment status toggle */}
                          <button
                            onClick={() => updateOrderStatus(order.id, { payment_status: order.payment_status === 'Paid' ? 'Pending' : 'Paid' })}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                              order.payment_status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            Payment: {order.payment_status}
                          </button>
                          
                          {/* Order Status Select */}
                          <select
                            value={order.order_status}
                            onChange={(e) => updateOrderStatus(order.id, { order_status: e.target.value })}
                            className="text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="Received">Received</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready">Ready</option>
                          </select>

                          {/* Send Receipt */}
                          <button
                            onClick={() => triggerReceiptWhatsApp(order)}
                            className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Receipt
                          </button>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="grid sm:grid-cols-2 gap-4 text-sm text-stone-700 bg-stone-50 p-3 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-stone-400">Customer Info</p>
                          <p className="font-bold">{order.customer_name}</p>
                          <p className="text-xs">{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-400">Delivery Address</p>
                          <p className="text-xs font-medium">{order.customer_address}</p>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-bold">
                              <th className="pb-2">Product Name</th>
                              <th className="pb-2 text-right">Qty</th>
                              <th className="pb-2 text-right">Price</th>
                              <th className="pb-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-stone-100 last:border-0 text-stone-800">
                                <td className="py-2 font-semibold">{item.name}</td>
                                <td className="py-2 text-right font-bold">{item.quantity}</td>
                                <td className="py-2 text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                                <td className="py-2 text-right font-bold text-stone-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Order Total */}
                      <div className="flex justify-end text-sm font-bold border-t border-stone-100 pt-3">
                        <span className="text-stone-600 mr-2">Grand Total:</span>
                        <span className="text-amber-800 text-base font-black">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inventory Management CRUD */}
        {activeTab === 'inventory' && (
          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            
            {/* Form Section (Add/Edit Product) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm h-fit space-y-4">
              <h3 className="text-base font-bold text-stone-950 heading-font border-b pb-2">
                {isEditing ? 'Modify Product Details' : 'Introduce New Product'}
              </h3>
              
              <form onSubmit={handleProductSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chocolate Cake"
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">Category *</label>
                  <select
                    value={currentProduct.category}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-stone-500 block mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g. 500"
                      value={currentProduct.price}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-500 block mb-1">Stock Count *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 10"
                      value={currentProduct.stock}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">Description</label>
                  <textarea
                    placeholder="Short description of the item"
                    rows="2"
                    value={currentProduct.description}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={currentProduct.image_url}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t mt-3">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-colors"
                  >
                    {isEditing ? 'Save Changes' : 'Create Product'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold py-2 px-4 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Inventory Listing Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold text-xs">
                      <th className="p-4">Item details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProds ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-stone-400">Loading products...</td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-stone-400">No products inside inventory. Add one above.</td>
                      </tr>
                    ) : (
                      products.map(prod => (
                        <tr key={prod.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {prod.image_url && (
                                <img src={prod.image_url} alt={prod.name} className="w-8 h-8 rounded-lg object-cover bg-stone-100" />
                              )}
                              <div>
                                <p className="font-bold text-stone-900">{prod.name}</p>
                                <p className="text-[10px] text-stone-400 line-clamp-1">{prod.description || 'No description'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">{prod.category}</span>
                          </td>
                          <td className="p-4 text-right font-bold text-stone-900">₹{prod.price}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {prod.stock < 5 ? (
                                <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                  {prod.stock} Left
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {prod.stock} units
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(prod)}
                                className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(prod.id)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

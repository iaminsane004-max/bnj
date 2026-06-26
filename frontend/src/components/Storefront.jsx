import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ChevronRight, MapPin, Phone, User, ShoppingCart, Plus, Minus, X, Info } from 'lucide-react';

const API_BASE = '/api';

export default function Storefront({ onOrderCreated, onViewAdmin, shopPhone }) {
  const { cartItems, addToCart, removeFromCart, cartCount, cartTotal, clearCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Checkout form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryType: 'Delivery',
    address: ''
  });

  const categories = ['All', 'Cakes', 'Pastries', 'Bread', 'Savories'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!formData.name || !formData.phone || (formData.deliveryType === 'Delivery' && !formData.address)) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setCheckoutSubmitting(true);

      // Prepare payload
      const orderPayload = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        delivery_type: formData.deliveryType,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      // Order created successfully! Now generate WhatsApp message URL
      const orderId = result.id;
      const shortOrderId = orderId.substring(0, 8).toUpperCase();
      
      let itemsListText = '';
      cartItems.forEach(item => {
        itemsListText += ` - ${item.quantity}x ${item.name} (₹${(item.price * item.quantity).toFixed(2)})\n`;
      });

      const messagePayload = 
`🛍️ *New Order from Bake and Joy Website!*

*Order ID:* #${shortOrderId}
*Customer:* ${formData.name}
*Phone:* ${formData.phone}

*Items:*
${itemsListText}
*Total Amount:* ₹${cartTotal.toFixed(2)}
*Delivery Type:* ${formData.deliveryType}

*Status:* Awaiting Payment Verification`;

      const encodedMessage = encodeURIComponent(messagePayload);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${shopPhone || '919876543210'}&text=${encodedMessage}`;

      // Open WhatsApp link in a new window/tab
      window.open(whatsappUrl, '_blank');

      // Clear the local cart
      clearCart();
      setIsCartOpen(false);

      // Navigate to order success state
      onOrderCreated(result);

    } catch (err) {
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header Banner */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 sm:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-amber-600 text-white p-2 rounded-full shadow-inner animate-pulse">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-900 heading-font">Bake & Joy</h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Premium Patisserie</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onViewAdmin} 
            className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-amber-800 transition-colors"
          >
            Admin Access
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-amber-900 hover:bg-amber-950 text-amber-50 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-transform active:scale-95 duration-100"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-bold text-sm hidden sm:inline">My Cart</span>
            {cartCount > 0 && (
              <span className="bg-amber-500 text-amber-950 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Category Bar */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar mask-gradient">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white scale-105 shadow-md shadow-amber-600/20'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 font-medium">Baking fresh products for you...</p>
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl text-center max-w-md mx-auto shadow-sm">
            <Info className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
            <button 
              onClick={fetchProducts} 
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 font-semibold">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(prod => {
              const cartItem = cartItems.find(item => item.id === prod.id);
              const isOutOfStock = prod.stock <= 0;

              return (
                <div 
                  key={prod.id} 
                  className={`bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 hover:shadow-md ${
                    isOutOfStock ? 'opacity-75' : ''
                  }`}
                >
                  <div>
                    <div className="relative aspect-square bg-stone-100 overflow-hidden">
                      {prod.image_url ? (
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-200 text-xs">
                          No Image
                        </div>
                      )}
                      {isOutOfStock && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                          OUT OF STOCK
                        </span>
                      )}
                      {!isOutOfStock && prod.stock <= 5 && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                          ONLY {prod.stock} LEFT
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-stone-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {prod.category}
                      </span>
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-stone-800 text-sm line-clamp-1 heading-font">{prod.name}</h3>
                      <p className="text-stone-500 text-xs mt-1 line-clamp-2 min-h-[2rem]">
                        {prod.description || 'Delightfully fresh and handmade with love.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 pt-0 flex justify-between items-center border-t border-stone-100 mt-2">
                    <span className="font-bold text-stone-900 text-base">₹{prod.price}</span>
                    
                    {isOutOfStock ? (
                      <button 
                        disabled 
                        className="bg-stone-200 text-stone-400 text-xs font-bold px-3 py-1.5 rounded-full cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    ) : cartItem ? (
                      <div className="flex items-center bg-amber-600 text-white rounded-full overflow-hidden shadow-sm">
                        <button 
                          onClick={() => removeFromCart(prod.id)}
                          className="p-1 px-2.5 hover:bg-amber-700 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-sm font-bold min-w-[1.25rem] text-center">
                          {cartItem.quantity}
                        </span>
                        <button 
                          onClick={() => addToCart(prod)}
                          className="p-1 px-2.5 hover:bg-amber-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod)}
                        className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm transition-transform active:scale-95"
                      >
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-amber-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-2xl max-w-xl mx-auto border border-amber-800 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-amber-800 p-2 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-xs text-amber-200 font-bold uppercase tracking-wider">{cartCount} Item{cartCount > 1 ? 's' : ''}</p>
              <p className="text-lg font-black">₹{cartTotal.toFixed(2)}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold px-6 py-2.5 rounded-xl flex items-center gap-1 shadow-md transition-colors"
          >
            Checkout
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Checkout Sliding Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-800" />
                <h2 className="text-lg font-bold text-stone-800 heading-font">Order Summary</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="p-1 rounded-full hover:bg-stone-200 transition-colors"
              >
                <X className="w-6 h-6 text-stone-500" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl border border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-sm flex items-center justify-center">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{item.name}</p>
                      <p className="text-stone-500 text-xs">₹{item.price} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="pt-4 border-t border-stone-200 space-y-3.5">
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Customer Details</h3>
                
                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">Your Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">WhatsApp Mobile Number (e.g. 91xxxxxxxxxx) *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      placeholder="e.g. 919876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1.5">Delivery Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Delivery' }))}
                      className={`py-2 rounded-xl text-sm font-bold border transition-colors ${
                        formData.deliveryType === 'Delivery' 
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      Home Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Pickup' }))}
                      className={`py-2 rounded-xl text-sm font-bold border transition-colors ${
                        formData.deliveryType === 'Pickup' 
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      Store Pickup
                    </button>
                  </div>
                </div>

                {formData.deliveryType === 'Delivery' && (
                  <div className="animate-fade-in">
                    <label className="text-xs font-bold text-stone-500 block mb-1">Delivery Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <textarea 
                        name="address"
                        required={formData.deliveryType === 'Delivery'}
                        rows="2"
                        placeholder="House No, Street name, Pincode"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Checkout Drawer Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-600 text-sm">Subtotal</span>
                <span className="font-extrabold text-stone-950 text-base">₹{cartTotal.toFixed(2)}</span>
              </div>
              
              <button 
                type="submit"
                form="checkout-form"
                disabled={checkoutSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-colors disabled:opacity-50"
              >
                {checkoutSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirm Order & Pay
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

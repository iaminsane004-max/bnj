const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const localDb = require('./localDb');
const crypto = require('crypto');

// Helper to run query via Supabase and fall back to local JSON DB on network/DNS failure
async function runQuery(res, supabaseQueryFn, localQueryFn) {
  try {
    const result = await supabaseQueryFn();
    res.json(result);
  } catch (error) {
    const isNetworkError = error.message && (
      error.message.includes('fetch failed') || 
      error.message.includes('ENOTFOUND') || 
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('address already in use')
    );
    
    if (isNetworkError || (error.status === undefined && error.code === undefined)) {
      console.warn('⚠️ Supabase connection failed. Falling back to local JSON database.');
      try {
        const localResult = await localQueryFn();
        res.json(localResult);
      } catch (localError) {
        console.error('Error running local database fallback:', localError);
        res.status(500).json({ error: localError.message || 'Database fallback failed' });
      }
    } else {
      console.error('Supabase query error:', error);
      res.status(500).json({ error: error.message || 'Database query failed' });
    }
  }
}

// GET /api/config - Get dynamic configuration (WhatsApp phone, UPI ID)
router.get('/config', (req, res) => {
  res.json({
    shopPhone: process.env.SHOP_PHONE_NUMBER || '919876543210',
    shopUpi: process.env.SHOP_UPI_ID || 'bakeandjoy@okaxis'
  });
});

// --- PRODUCT ROUTES ---

// GET /api/products - Fetch all products
router.get('/products', async (req, res) => {
  await runQuery(res, 
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    async () => {
      const db = localDb.getData();
      return db.products.sort((a, b) => a.name.localeCompare(b.name));
    }
  );
});

// POST /api/products - Admin: Add new product
router.post('/products', async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;

  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Name, price, stock, and category are required' });
  }

  const status = stock > 0 ? 'In Stock' : 'Out of Stock';

  await runQuery(res,
    async () => {
      const { data, error } = await supabase
        .from('products')
        .insert([{ name, description, price: parseFloat(price), stock: parseInt(stock), category, image_url, status }])
        .select();

      if (error) throw error;
      return data[0];
    },
    async () => {
      const db = localDb.getData();
      const newProduct = {
        id: crypto.randomUUID(),
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        image_url,
        status
      };
      db.products.push(newProduct);
      localDb.saveData(db);
      return newProduct;
    }
  );
});

// PUT /api/products/:id - Admin: Edit product
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, image_url } = req.body;

  await runQuery(res,
    async () => {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) {
        updateData.stock = parseInt(stock);
        updateData.status = parseInt(stock) > 0 ? 'In Stock' : 'Out of Stock';
      }
      if (category !== undefined) updateData.category = category;
      if (image_url !== undefined) updateData.image_url = image_url;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Product not found');
      return data[0];
    },
    async () => {
      const db = localDb.getData();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      const prod = db.products[idx];
      if (name !== undefined) prod.name = name;
      if (description !== undefined) prod.description = description;
      if (price !== undefined) prod.price = parseFloat(price);
      if (stock !== undefined) {
        prod.stock = parseInt(stock);
        prod.status = parseInt(stock) > 0 ? 'In Stock' : 'Out of Stock';
      }
      if (category !== undefined) prod.category = category;
      if (image_url !== undefined) prod.image_url = image_url;

      db.products[idx] = prod;
      localDb.saveData(db);
      return prod;
    }
  );
});

// DELETE /api/products/:id - Admin: Delete product
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  await runQuery(res,
    async () => {
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Product not found');
      return { message: 'Product deleted successfully' };
    },
    async () => {
      const db = localDb.getData();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      db.products.splice(idx, 1);
      localDb.saveData(db);
      return { message: 'Product deleted successfully' };
    }
  );
});

// --- ORDER ROUTES ---

// GET /api/orders - Admin: Fetch all orders
router.get('/orders', async (req, res) => {
  await runQuery(res,
    async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    async () => {
      const db = localDb.getData();
      return db.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  );
});

// POST /api/orders - Customer: Place order (Checks stock & decrements atomically)
router.post('/orders', async (req, res) => {
  const { customer_name, customer_phone, customer_address, delivery_type, items } = req.body;

  if (!customer_name || !customer_phone || !delivery_type || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing customer details or items' });
  }

  await runQuery(res,
    async () => {
      // 1. Fetch current stock for all items in the order
      const productIds = items.map(item => item.productId);
      const { data: dbProducts, error: fetchError } = await supabase
        .from('products')
        .select('id, name, stock')
        .in('id', productIds);

      if (fetchError) throw fetchError;

      // Map DB products for quick lookup
      const productMap = {};
      dbProducts.forEach(prod => {
        productMap[prod.id] = prod;
      });

      // 2. Validate sufficient stock for all requested items
      for (const item of items) {
        const dbProduct = productMap[item.productId];
        if (!dbProduct) throw new Error(`Product "${item.name}" no longer exists.`);
        if (dbProduct.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${dbProduct.stock} unit(s) remaining.`);
        }
      }

      // 3. Decrement stock for each product
      for (const item of items) {
        const dbProduct = productMap[item.productId];
        const newStock = dbProduct.stock - item.quantity;
        const status = newStock > 0 ? 'In Stock' : 'Out of Stock';

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock, status })
          .eq('id', item.productId);

        if (updateError) throw updateError;
      }

      // 4. Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // 5. Save the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name,
          customer_phone,
          customer_address: delivery_type === 'Delivery' ? customer_address : 'N/A (Pickup)',
          delivery_type,
          items,
          total_amount: totalAmount,
          payment_status: 'Pending',
          order_status: 'Received'
        }])
        .select();

      if (orderError) throw orderError;
      return orderData[0];
    },
    async () => {
      const db = localDb.getData();
      
      // Validate & decrement stock in local products list
      for (const item of items) {
        const prod = db.products.find(p => p.id === item.productId);
        if (!prod) throw new Error(`Product "${item.name}" no longer exists.`);
        if (prod.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${prod.stock} remaining.`);
        }
        prod.stock -= item.quantity;
        prod.status = prod.stock > 0 ? 'In Stock' : 'Out of Stock';
      }

      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newOrder = {
        id: crypto.randomUUID(),
        customer_name,
        customer_phone,
        customer_address: delivery_type === 'Delivery' ? customer_address : 'N/A (Pickup)',
        delivery_type,
        items,
        total_amount: totalAmount,
        payment_status: 'Pending',
        order_status: 'Received',
        created_at: new Date().toISOString()
      };
      
      db.orders.push(newOrder);
      localDb.saveData(db);
      return newOrder;
    }
  );
});

// PUT /api/orders/:id - Admin: Update order/payment status
router.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { order_status, payment_status } = req.body;

  await runQuery(res,
    async () => {
      const updateData = {};
      if (order_status !== undefined) updateData.order_status = order_status;
      if (payment_status !== undefined) updateData.payment_status = payment_status;

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Order not found');
      return data[0];
    },
    async () => {
      const db = localDb.getData();
      const idx = db.orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error('Order not found');
      
      const order = db.orders[idx];
      if (order_status !== undefined) order.order_status = order_status;
      if (payment_status !== undefined) order.payment_status = payment_status;

      db.orders[idx] = order;
      localDb.saveData(db);
      return order;
    }
  );
});

module.exports = router;

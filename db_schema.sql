-- SQL Schema setup script for Supabase / PostgreSQL
-- Paste this script directly into your Supabase SQL Editor and run it.

-- 1. Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

-- 2. Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  category TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'In Stock'
);

-- 3. Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  delivery_type TEXT NOT NULL, -- 'Delivery' or 'Pickup'
  items JSONB NOT NULL, -- [{productId, name, quantity, price}]
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending' or 'Paid'
  order_status TEXT NOT NULL DEFAULT 'Received', -- 'Received', 'Preparing', 'Ready'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Realtime on orders (Optional, for admin order tracking auto-refresh)
alter publication supabase_realtime add table orders;

-- 5. Seed some initial premium products for Bake and Joy!
INSERT INTO products (name, description, price, stock, category, image_url, status)
VALUES
  ('Classic Chocolate Fudge Cake', 'Rich, moist chocolate cake layers frosted with premium dark chocolate fudge.', 749.00, 15, 'Cakes', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600', 'In Stock'),
  ('Red Velvet Cheese Cake', 'A perfect blend of smooth New York cheesecake and classic red velvet crumble layers.', 899.00, 8, 'Cakes', 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=600', 'In Stock'),
  ('Fresh Butter Croissant', 'Flaky, buttery, golden French pastry baked fresh daily.', 110.00, 25, 'Pastries', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600', 'In Stock'),
  ('Blueberry Tart', 'Crisp tart shell loaded with fresh blueberry compote and light vanilla pastry cream.', 180.00, 12, 'Pastries', 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=600', 'In Stock'),
  ('Artisanal Sourdough Bread', 'Naturally leavened rustic sourdough loaf with a crispy crust and chewy crumb.', 150.00, 6, 'Bread', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=600', 'In Stock'),
  ('Spicy Paneer Puff', 'Savory puff pastry stuffed with spiced cottage cheese and roasted bell peppers.', 85.00, 20, 'Savories', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600', 'In Stock'),
  ('Garlic Herb Focaccia', 'Traditional Italian bread topped with extra virgin olive oil, sea salt, fresh rosemary, and garlic.', 195.00, 4, 'Bread', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=600', 'In Stock');

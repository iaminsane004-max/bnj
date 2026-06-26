const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'local_db.json');

const seedProducts = [
  { 
    id: 'f87a8b2c-63b7-4d64-8848-9c1db1587ea0', 
    name: 'Classic Chocolate Fudge Cake', 
    description: 'Rich, moist chocolate cake layers frosted with premium dark chocolate fudge.', 
    price: 749.00, 
    stock: 15, 
    category: 'Cakes', 
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600', 
    status: 'In Stock' 
  },
  { 
    id: 'b6f2c3d4-7ebd-40b3-90d5-6b5cfd69a25b', 
    name: 'Red Velvet Cheese Cake', 
    description: 'A perfect blend of smooth New York cheesecake and classic red velvet crumble layers.', 
    price: 899.00, 
    stock: 8, 
    category: 'Cakes', 
    image_url: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=600', 
    status: 'In Stock' 
  },
  { 
    id: 'a9b2c3d4-e5f6-47b8-a9c0-1d2e3f4a5b6c', 
    name: 'Fresh Butter Croissant', 
    description: 'Flaky, buttery, golden French pastry baked fresh daily.', 
    price: 110.00, 
    stock: 25, 
    category: 'Pastries', 
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600', 
    status: 'In Stock' 
  },
  { 
    id: 'c1d2e3f4-a5b6-47c8-9d0e-1f2a3b4c5d6e', 
    name: 'Blueberry Tart', 
    description: 'Crisp tart shell loaded with fresh blueberry compote and light vanilla pastry cream.', 
    price: 180.00, 
    stock: 12, 
    category: 'Pastries', 
    image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=600', 
    status: 'In Stock' 
  },
  { 
    id: 'd2e3f4a5-b6c7-48d9-a0e1-2f3a4b5c6d7e', 
    name: 'Artisanal Sourdough Bread', 
    description: 'Naturally leavened rustic sourdough loaf with a crispy crust and chewy crumb.', 
    price: 150.00, 
    stock: 6, 
    category: 'Bread', 
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=600', 
    status: 'In Stock' 
  },
  { 
    id: 'e3f4a5b6-c7d8-49e0-a1f2-3a4b5c6d7e8f', 
    name: 'Spicy Paneer Puff', 
    description: 'Savory puff pastry stuffed with spiced cottage cheese and roasted bell peppers.', 
    price: 85.00, 
    stock: 20, 
    category: 'Savories', 
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600', 
    status: 'In Stock' 
  }
];

function initDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ products: seedProducts, orders: [] }, null, 2));
  }
}

function getData() {
  initDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = { getData, saveData };

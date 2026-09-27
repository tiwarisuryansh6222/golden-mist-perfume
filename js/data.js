// data.js — Shared data layer with localStorage persistence

const STORAGE_KEYS = {
  PRODUCTS: 'gm_products',
  DISCOUNTS: 'gm_discounts',
  SETTINGS: 'gm_settings',
  ADMIN_AUTH: 'gm_admin_auth',
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Atlantis',
    description: 'An oceanic voyage — crisp aquatic notes meeting sun-kissed citrus and a whisper of sea salt.',
    price: 1299,
    category: 'new-arrival',
    image: '/images/atlantis.jpg',
    accentColor: '#2ABFBF',
    stockStatus: 'in-stock',
    displayOrder: 1,
  },
  {
    id: 'prod_002',
    name: 'Mastermind',
    description: 'Dark, magnetic, and utterly irresistible — oud, black amber, and midnight leather intertwined.',
    price: 1499,
    category: 'best-seller',
    image: '/images/mastermind.jpg',
    accentColor: '#1B2A4A',
    stockStatus: 'in-stock',
    displayOrder: 2,
  },
  {
    id: 'prod_003',
    name: 'Professor',
    description: 'Refined intellect in a bottle — warm sandalwood, aged tobacco, and a hint of rare saffron.',
    price: 1499,
    category: 'best-seller',
    image: '/images/professor.jpg',
    accentColor: '#8B1A1A',
    stockStatus: 'in-stock',
    displayOrder: 3,
  },
  {
    id: 'prod_004',
    name: 'Inception',
    description: 'Bold, enigmatic, futuristic — metallic iris, graphite accord, and cold concrete rain.',
    price: 1399,
    category: 'new-arrival',
    image: '/images/inception.jpg',
    accentColor: '#6B7B8D',
    stockStatus: 'in-stock',
    displayOrder: 4,
  },
  {
    id: 'prod_005',
    name: 'Velox',
    description: 'Pure adrenaline — sharp grapefruit, fiery ginger, and a trail of smoky vetiver.',
    price: 1299,
    category: 'upcoming',
    image: '/images/velox.jpg',
    accentColor: '#C0392B',
    stockStatus: 'in-stock',
    displayOrder: 5,
  },
];

const DEFAULT_SETTINGS = {
  comingSoon: true,
  announcementText: 'Golden Mist is launching soon — DM us on WhatsApp to pre-order.',
};

const ADMIN_PASSWORD = 'goldenmist2026';

// --- Helpers ---
function getFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Products API ---
export function getProducts() {
  return getFromStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getProductById(id) {
  return getProducts().find(p => p.id === id);
}

export function saveProducts(products) {
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function addProduct(product) {
  const products = getProducts();
  product.id = 'prod_' + Date.now();
  products.push(product);
  saveProducts(products);
  return product;
}

export function updateProduct(id, updates) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updates };
    saveProducts(products);
    return products[idx];
  }
  return null;
}

export function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

// --- Discounts API ---
export function getDiscounts() {
  return getFromStorage(STORAGE_KEYS.DISCOUNTS, []);
}

export function saveDiscounts(discounts) {
  saveToStorage(STORAGE_KEYS.DISCOUNTS, discounts);
}

export function addDiscount(discount) {
  const discounts = getDiscounts();
  discount.id = 'disc_' + Date.now();
  discounts.push(discount);
  saveDiscounts(discounts);
  return discount;
}

export function updateDiscount(id, updates) {
  const discounts = getDiscounts();
  const idx = discounts.findIndex(d => d.id === id);
  if (idx !== -1) {
    discounts[idx] = { ...discounts[idx], ...updates };
    saveDiscounts(discounts);
    return discounts[idx];
  }
  return null;
}

export function deleteDiscount(id) {
  const discounts = getDiscounts().filter(d => d.id !== id);
  saveDiscounts(discounts);
}

// --- Settings API ---
export function getSettings() {
  return getFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

// --- Auth ---
export function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

export function isAdminLoggedIn() {
  return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
}

export function setAdminLoggedIn(val) {
  if (val) {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  }
}

// --- Seed default data on first visit ---
export function seedDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    saveProducts(DEFAULT_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    saveSettings(DEFAULT_SETTINGS);
  }
}

// Category labels
export const CATEGORY_LABELS = {
  'new-arrival': 'New Arrival',
  'best-seller': 'Best Seller',
  'upcoming': 'Upcoming',
  'none': '',
};

export const WHATSAPP_BASE = 'https://wa.me/message/3Y4PZ7KWNCCVK1';

export function getWhatsAppLink(productName) {
  if (productName) {
    return `https://wa.me/message/3Y4PZ7KWNCCVK1?text=${encodeURIComponent("Hi! I'm interested in " + productName + " from Golden Mist Perfume.")}`;
  }
  return WHATSAPP_BASE;
}

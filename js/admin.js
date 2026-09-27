// admin.js — Admin dashboard logic
import {
  getProducts,
  saveProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getDiscounts,
  addDiscount,
  updateDiscount,
  deleteDiscount,
  getSettings,
  saveSettings,
  verifyAdminPassword,
  isAdminLoggedIn,
  setAdminLoggedIn,
  seedDefaults,
  CATEGORY_LABELS,
} from './data.js';

seedDefaults();

// ==========================================
// Auth
// ==========================================
function checkAuth() {
  if (isAdminLoggedIn()) {
    showDashboard();
  }
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  refreshAll();
}

function initLogin() {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    if (verifyAdminPassword(password)) {
      setAdminLoggedIn(true);
      showDashboard();
    } else {
      errorEl.textContent = 'Incorrect password. Please try again.';
      setTimeout(() => { errorEl.textContent = ''; }, 3000);
    }
  });
}

function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    setAdminLoggedIn(false);
    location.reload();
  });
}

// ==========================================
// Tab Navigation
// ==========================================
function initTabs() {
  const tabs = document.querySelectorAll('.sidebar-link[data-tab]');
  const panels = document.querySelectorAll('.tab-panel');

  function switchTab(tabName) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel${capitalize(tabName)}`));
    // Close mobile sidebar
    closeMobileSidebar();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Quick actions
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.goto;
      switchTab(target);
      if (target === 'products') setTimeout(() => openProductModal(), 100);
      if (target === 'discounts') setTimeout(() => openDiscountModal(), 100);
    });
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// Mobile Sidebar
// ==========================================
function initMobileSidebar() {
  const hamburger = document.getElementById('adminHamburger');
  const sidebar = document.getElementById('sidebar');

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebarOverlay';
  document.body.appendChild(overlay);

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

// ==========================================
// Refresh All Dashboard Data
// ==========================================
function refreshAll() {
  refreshDashboard();
  refreshProductsTable();
  refreshDiscountsTable();
  refreshSettings();
}

function refreshDashboard() {
  const products = getProducts();
  const discounts = getDiscounts();
  const settings = getSettings();

  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statDiscounts').textContent = discounts.filter(d => d.active).length;
  document.getElementById('statMode').textContent = settings.comingSoon ? 'Coming Soon' : 'Live';
  document.getElementById('statModeIcon').textContent = settings.comingSoon ? '🚧' : '🟢';
}

// ==========================================
// Products Management
// ==========================================
function refreshProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  const products = getProducts();

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <p>No products yet.</p>
          <button class="btn btn-gold btn-sm" onclick="document.getElementById('addProductBtn').click()">Add Your First Product</button>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image || ''}" alt="${p.name}" class="table-thumb" /></td>
      <td><span class="table-name">${p.name}</span></td>
      <td>₹${(p.price || 0).toLocaleString('en-IN')}</td>
      <td>${p.category && p.category !== 'none' ? `<span class="table-tag ${p.category}">${CATEGORY_LABELS[p.category] || p.category}</span>` : '—'}</td>
      <td><span class="table-stock ${p.stockStatus || 'in-stock'}">${(p.stockStatus || 'in-stock').replace('-', ' ')}</span></td>
      <td>${p.displayOrder || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" data-edit-product="${p.id}" title="Edit">✏️</button>
          <button class="btn-icon danger" data-delete-product="${p.id}" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Bind edit/delete
  tbody.querySelectorAll('[data-edit-product]').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(btn.dataset.editProduct));
  });
  tbody.querySelectorAll('[data-delete-product]').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete('product', btn.dataset.deleteProduct));
  });
}

// Product Modal
let currentEditProductId = null;

function openProductModal(editId = null) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');

  currentEditProductId = editId;
  form.reset();
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'block';

  if (editId) {
    title.textContent = 'Edit Product';
    const product = getProducts().find(p => p.id === editId);
    if (product) {
      document.getElementById('productId').value = product.id;
      document.getElementById('productName').value = product.name || '';
      document.getElementById('productPrice').value = product.price || '';
      document.getElementById('productDescription').value = product.description || '';
      document.getElementById('productCategory').value = product.category || 'none';
      document.getElementById('productStock').value = product.stockStatus || 'in-stock';
      document.getElementById('productAccent').value = product.accentColor || '#C9A567';
      document.getElementById('productOrder').value = product.displayOrder || 1;
      document.getElementById('productImageUrl').value = product.image || '';
      if (product.image) {
        document.getElementById('imagePreview').src = product.image;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
      }
    }
  } else {
    title.textContent = 'Add Product';
    document.getElementById('productOrder').value = getProducts().length + 1;
  }

  modal.classList.add('open');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  currentEditProductId = null;
}

function initProductModal() {
  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
  document.getElementById('productModalClose').addEventListener('click', closeProductModal);
  document.getElementById('productCancelBtn').addEventListener('click', closeProductModal);

  // Image upload preview
  document.getElementById('productImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('imagePreview').src = ev.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('productImageUrl').value = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Form submit
  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('productName').value,
      price: parseInt(document.getElementById('productPrice').value, 10) || 0,
      description: document.getElementById('productDescription').value,
      category: document.getElementById('productCategory').value,
      stockStatus: document.getElementById('productStock').value,
      accentColor: document.getElementById('productAccent').value,
      displayOrder: parseInt(document.getElementById('productOrder').value, 10) || 1,
      image: document.getElementById('productImageUrl').value,
    };

    if (currentEditProductId) {
      updateProduct(currentEditProductId, data);
    } else {
      addProduct(data);
    }

    closeProductModal();
    refreshAll();
  });
}

// ==========================================
// Discounts Management
// ==========================================
function refreshDiscountsTable() {
  const tbody = document.getElementById('discountsTableBody');
  const discounts = getDiscounts();
  const products = getProducts();

  if (discounts.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <p>No discounts yet.</p>
          <button class="btn btn-gold btn-sm" onclick="document.getElementById('addDiscountBtn').click()">Add Your First Discount</button>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = discounts.map(d => {
    const linkedProduct = d.linkedProduct === 'site-wide'
      ? 'Site-wide'
      : (products.find(p => p.id === d.linkedProduct)?.name || d.linkedProduct);

    return `
    <tr>
      <td><span class="table-name">${d.label || '—'}</span></td>
      <td>${d.type === 'percentage' ? 'Percentage' : 'Flat'}</td>
      <td>${d.type === 'percentage' ? d.value + '%' : '₹' + d.value}</td>
      <td>${linkedProduct}</td>
      <td>${d.startDate || '—'}</td>
      <td>${d.expiryDate || '—'}</td>
      <td><span class="active-badge ${d.active ? 'active' : 'inactive'}">${d.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" data-edit-discount="${d.id}" title="Edit">✏️</button>
          <button class="btn-icon danger" data-delete-discount="${d.id}" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `}).join('');

  tbody.querySelectorAll('[data-edit-discount]').forEach(btn => {
    btn.addEventListener('click', () => openDiscountModal(btn.dataset.editDiscount));
  });
  tbody.querySelectorAll('[data-delete-discount]').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete('discount', btn.dataset.deleteDiscount));
  });
}

// Discount Modal
let currentEditDiscountId = null;

function openDiscountModal(editId = null) {
  const modal = document.getElementById('discountModal');
  const title = document.getElementById('discountModalTitle');
  const form = document.getElementById('discountForm');
  const productSelect = document.getElementById('discountProduct');

  currentEditDiscountId = editId;
  form.reset();

  // Populate product select
  const products = getProducts();
  productSelect.innerHTML = '<option value="site-wide">Site-wide</option>';
  products.forEach(p => {
    productSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
  });

  if (editId) {
    title.textContent = 'Edit Discount';
    const disc = getDiscounts().find(d => d.id === editId);
    if (disc) {
      document.getElementById('discountId').value = disc.id;
      document.getElementById('discountLabel').value = disc.label || '';
      document.getElementById('discountType').value = disc.type || 'percentage';
      document.getElementById('discountValue').value = disc.value || '';
      document.getElementById('discountProduct').value = disc.linkedProduct || 'site-wide';
      document.getElementById('discountStart').value = disc.startDate || '';
      document.getElementById('discountExpiry').value = disc.expiryDate || '';
      document.getElementById('discountActive').checked = disc.active !== false;
    }
  } else {
    title.textContent = 'Add Discount';
  }

  modal.classList.add('open');
}

function closeDiscountModal() {
  document.getElementById('discountModal').classList.remove('open');
  currentEditDiscountId = null;
}

function initDiscountModal() {
  document.getElementById('addDiscountBtn').addEventListener('click', () => openDiscountModal());
  document.getElementById('discountModalClose').addEventListener('click', closeDiscountModal);
  document.getElementById('discountCancelBtn').addEventListener('click', closeDiscountModal);

  document.getElementById('discountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      label: document.getElementById('discountLabel').value,
      type: document.getElementById('discountType').value,
      value: parseFloat(document.getElementById('discountValue').value) || 0,
      linkedProduct: document.getElementById('discountProduct').value,
      startDate: document.getElementById('discountStart').value,
      expiryDate: document.getElementById('discountExpiry').value,
      active: document.getElementById('discountActive').checked,
    };

    if (currentEditDiscountId) {
      updateDiscount(currentEditDiscountId, data);
    } else {
      addDiscount(data);
    }

    closeDiscountModal();
    refreshAll();
  });
}

// ==========================================
// Confirm Delete
// ==========================================
let deleteCallback = null;

function confirmDelete(type, id) {
  const modal = document.getElementById('confirmModal');
  const text = document.getElementById('confirmText');

  if (type === 'product') {
    const product = getProducts().find(p => p.id === id);
    text.textContent = `Are you sure you want to delete "${product?.name || 'this product'}"? This cannot be undone.`;
    deleteCallback = () => { deleteProduct(id); refreshAll(); };
  } else {
    const disc = getDiscounts().find(d => d.id === id);
    text.textContent = `Are you sure you want to delete discount "${disc?.label || 'this discount'}"? This cannot be undone.`;
    deleteCallback = () => { deleteDiscount(id); refreshAll(); };
  }

  modal.classList.add('open');
}

function initConfirmModal() {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmModalClose').addEventListener('click', () => modal.classList.remove('open'));
  document.getElementById('confirmCancelBtn').addEventListener('click', () => modal.classList.remove('open'));
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deleteCallback) deleteCallback();
    modal.classList.remove('open');
    deleteCallback = null;
  });
}

// ==========================================
// Settings
// ==========================================
function refreshSettings() {
  const settings = getSettings();
  document.getElementById('comingSoonToggle').checked = settings.comingSoon;
  document.getElementById('comingSoonLabel').textContent = settings.comingSoon ? 'Coming Soon' : 'Live';
  document.getElementById('announcementInput').value = settings.announcementText || '';
}

function initSettings() {
  const toggle = document.getElementById('comingSoonToggle');
  const label = document.getElementById('comingSoonLabel');

  toggle.addEventListener('change', () => {
    const settings = getSettings();
    settings.comingSoon = toggle.checked;
    saveSettings(settings);
    label.textContent = toggle.checked ? 'Coming Soon' : 'Live';
    refreshDashboard();
  });

  document.getElementById('saveAnnouncementBtn').addEventListener('click', () => {
    const settings = getSettings();
    settings.announcementText = document.getElementById('announcementInput').value;
    saveSettings(settings);
    // Show brief feedback
    const btn = document.getElementById('saveAnnouncementBtn');
    const original = btn.textContent;
    btn.textContent = '✓ Saved';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

// ==========================================
// Close modals on overlay click
// ==========================================
function initModalOverlayClose() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
}

// ==========================================
// Init
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initLogout();
  initTabs();
  initMobileSidebar();
  initProductModal();
  initDiscountModal();
  initConfirmModal();
  initSettings();
  initModalOverlayClose();
  checkAuth();
});

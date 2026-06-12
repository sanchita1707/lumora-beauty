// --- GLOBAL CONSTANTS & CONFIGS ---
const API_BASE = '/api';

// --- AUTH STATE UTILS ---
const getAuthToken = () => localStorage.getItem('lumora_token');
const getAuthUser = () => {
  const userStr = localStorage.getItem('lumora_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

const setAuthState = (token, user) => {
  localStorage.setItem('lumora_token', token);
  localStorage.setItem('lumora_user', JSON.stringify(user));
};

const clearAuthState = () => {
  localStorage.removeItem('lumora_token');
  localStorage.removeItem('lumora_user');
};

// --- AUTHENTICATED API FETCH WRAPPER ---
const apiFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  // Handle auto-logout on unauthorized
  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    clearAuthState();
    showToast('Session expired. Please log in again.', 'error');
    setTimeout(() => { window.location.href = '/auth.html'; }, 1500);
  }

  return response.json();
};

// --- CART STATE MANAGEMENT ---
let cart = [];

const loadCart = () => {
  const savedCart = localStorage.getItem('lumora_cart');
  try {
    cart = savedCart ? JSON.parse(savedCart) : [];
  } catch (e) {
    cart = [];
  }
  updateCartUI();
};

const saveCart = () => {
  localStorage.setItem('lumora_cart', JSON.stringify(cart));
  updateCartUI();
};

const addToCart = (product, quantity = 1, showDrawer = true) => {
  const existingIndex = cart.findIndex(item => item.product === product._id);
  
  // Clean product fields
  const priceAfterDiscount = Math.round(product.price * (1 - (product.discount || 0) / 100));
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += Number(quantity);
    if (cart[existingIndex].quantity > product.stock) {
      cart[existingIndex].quantity = product.stock;
      showToast(`Only ${product.stock} units available in stock.`, 'warning');
    }
  } else {
    cart.push({
      product: product._id,
      name: product.name,
      price: priceAfterDiscount,
      originalPrice: product.price,
      discount: product.discount || 0,
      image: product.images[0],
      quantity: Number(quantity),
      stock: product.stock
    });
  }

  saveCart();
  showToast(`${product.name} added to cart`, 'success');
  
  if (showDrawer) {
    openCartDrawer();
  }
};

const removeFromCart = (productId) => {
  cart = cart.filter(item => item.product !== productId);
  saveCart();
  showToast('Item removed from cart', 'info');
};

const updateCartQuantity = (productId, delta) => {
  const item = cart.find(item => item.product === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else if (item.quantity > item.stock) {
      item.quantity = item.stock;
      showToast(`Only ${item.stock} units available in stock.`, 'warning');
    } else {
      saveCart();
    }
  }
};

const clearCart = () => {
  cart = [];
  saveCart();
};

const getCartSubtotal = () => {
  return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
};

const getCartCount = () => {
  return cart.reduce((acc, item) => acc + item.quantity, 0);
};

// --- WISHLIST MANAGEMENT ---
let wishlist = [];

const loadWishlist = async () => {
  const user = getAuthUser();
  if (user) {
    try {
      const res = await apiFetch('/orders/wishlist'); // Wishlist routes (or local fallback)
      // Since wishlist might be local, fallback to local storage
    } catch (e) {}
  }
  
  const savedWishlist = localStorage.getItem('lumora_wishlist');
  try {
    wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
  } catch (e) {
    wishlist = [];
  }
  updateWishlistUI();
};

const saveWishlist = () => {
  localStorage.setItem('lumora_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
};

const toggleWishlist = (product) => {
  const idx = wishlist.findIndex(id => id === product._id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast('Removed from wishlist', 'info');
  } else {
    wishlist.push(product._id);
    showToast('Added to wishlist', 'success');
  }
  saveWishlist();
};

const isInWishlist = (productId) => {
  return wishlist.includes(productId);
};

// --- UI DYNAMIC SYNCHRONIZATIONS ---
const updateCartUI = () => {
  // Badges update
  const badges = document.querySelectorAll('.cart-badge-count');
  badges.forEach(b => b.textContent = getCartCount());

  // Render items in slide drawer if container exists
  const drawerContainer = document.getElementById('cart-drawer-items');
  if (drawerContainer) {
    if (cart.length === 0) {
      drawerContainer.innerHTML = `
        <div class="empty-cart-msg" style="text-align:center; padding:3rem 0; color:#888;">
          <i class="fas fa-shopping-bag" style="font-size:3rem; margin-bottom:1rem; color:#d6c3c3;"></i>
          <p style="font-family:var(--font-serif); font-size:1.2rem;">Your luxury cart is empty</p>
          <a href="/shop.html" class="btn btn-primary" style="margin-top:1.5rem; font-size:0.75rem;">Shop Now</a>
        </div>
      `;
      document.getElementById('cart-drawer-subtotal').textContent = `₹0`;
      document.getElementById('cart-drawer-total').textContent = `₹0`;
    } else {
      drawerContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <h4 class="cart-item-name">${item.name}</h4>
            <div class="cart-item-price">₹${item.price}</div>
            <div class="cart-item-quantity-controls">
              <button class="quantity-btn" onclick="updateCartQuantity('${item.product}', -1)">-</button>
              <span class="qty-val" style="width:20px; text-align:center; font-size:0.85rem;">${item.quantity}</span>
              <button class="quantity-btn" onclick="updateCartQuantity('${item.product}', 1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.product}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `).join('');

      const subtotal = getCartSubtotal();
      document.getElementById('cart-drawer-subtotal').textContent = `₹${subtotal}`;
      document.getElementById('cart-drawer-total').textContent = `₹${subtotal}`;
    }
  }
};

const updateWishlistUI = () => {
  const badges = document.querySelectorAll('.wishlist-badge-count');
  badges.forEach(b => b.textContent = wishlist.length);

  // Sync visual heart icons on the page if present
  wishlist.forEach(id => {
    const btn = document.querySelector(`.product-fav-btn[data-id="${id}"]`);
    if (btn) btn.classList.add('active');
  });
};

// --- TOAST NOTIFICATIONS ---
const showToast = (message, type = 'success') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'info') icon = 'fa-info-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.8rem;">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
    <i class="fas fa-times" style="margin-left:1.5rem; cursor:pointer;" onclick="this.parentElement.remove()"></i>
  `;

  container.appendChild(toast);

  // Auto remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// --- CART PANEL DRAWER UI INTERACTION ---
const openCartDrawer = () => {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  if (panel && overlay) {
    panel.classList.add('active');
    overlay.classList.add('active');
  }
};

const closeCartDrawer = () => {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  if (panel && overlay) {
    panel.classList.remove('active');
    overlay.classList.remove('active');
  }
};

// --- INITIALIZE PAGE ---
document.addEventListener('DOMContentLoaded', () => {
  // Load States
  loadCart();
  loadWishlist();

  // Scroll Header Effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Dynamic Navigation Auth Links
  const user = getAuthUser();
  const navActions = document.querySelector('.nav-actions');
  
  if (navActions) {
    // Check if user icon exists
    const userIcon = document.getElementById('header-user-link');
    if (user) {
      // User is logged in
      userIcon.href = '/dashboard.html';
      userIcon.title = `Profile: ${user.name}`;
      
      // If user is admin, add an admin dashboard icon
      if (user.role === 'admin' && !document.getElementById('header-admin-link')) {
        const adminLink = document.createElement('a');
        adminLink.id = 'header-admin-link';
        adminLink.href = '/admin.html';
        adminLink.className = 'action-icon';
        adminLink.title = 'Admin Panel';
        adminLink.innerHTML = '<i class="fas fa-crown" style="color:var(--primary-rose-gold);"></i>';
        navActions.insertBefore(adminLink, userIcon);
      }
    } else {
      // User is logged out
      userIcon.href = '/auth.html';
      userIcon.title = 'Login / Register';
      const adminLink = document.getElementById('header-admin-link');
      if (adminLink) adminLink.remove();
    }
  }

  // Hook Cart Drawer triggers
  const cartIcon = document.getElementById('header-cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  const closeCartBtn = document.getElementById('cart-close-btn');
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCartDrawer);
  }

  const overlay = document.getElementById('cart-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeCartDrawer);
  }
});

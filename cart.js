// cart.js — ELITE-SUBS shared cart logic

const CART_KEY = 'es-cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  dispatchEvent(new Event('es-cart-updated'));
}

function addToCart(product, duration, price) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id && i.duration === duration);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id: product.id, name: product.name, icon: product.icon, duration, price, qty: 1 });
  }
  saveCart(cart);
}

function removeFromCart(id, duration) {
  saveCart(getCart().filter(i => !(i.id === id && i.duration === duration)));
}

function clearCart() { saveCart([]); }

function cartTotal() {
  return getCart().reduce((s, i) => s + i.price * (i.qty || 1), 0);
}

function cartCount() {
  return getCart().reduce((s, i) => s + (i.qty || 1), 0);
}

function buildCartWhatsAppMsg() {
  const cart = getCart();
  if (!cart.length) return '';
  const lines = cart.map(i => `• ${i.name} (${i.duration}) x${i.qty || 1} — $${(i.price * (i.qty||1)).toFixed(2)}`).join('\n');
  return encodeURIComponent(`NEW ORDER — ELITE-SUBS\n\n${lines}\n\nTotal: $${cartTotal().toFixed(2)}`);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.style.display = n ? 'flex' : 'none';
}

window.addEventListener('es-cart-updated', updateCartBadge);

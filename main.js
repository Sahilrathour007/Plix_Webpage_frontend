// ── State ──────────────────────────────────────────────────────
let cart = {};
let nutFilter = 'all';
let skinFilter = 'all';

// ── Render helpers ─────────────────────────────────────────────
function badgeHTML(badge, color) {
  if (!badge) return '';
  const map = { green: '#E1F5EE|#0F6E56', blue: '#E6F1FB|#185FA5', amber: '#FAEEDA|#854F0B' };
  const [bg, fg] = (map[color] || '#F1EFE8|#444441').split('|');
  return `<span class="product-badge" style="background:${bg};color:${fg}">${badge}</span>`;
}

function discount(price, mrp) {
  return Math.round((1 - price / mrp) * 100);
}

function productCard(p, section) {
  const inCart = !!cart[p.id];
  return `
    <div class="product-card" id="card-${p.id}">
      <div class="product-img product-img--${section}">
        ${badgeHTML(p.badge, p.badgeColor)}
        <span class="product-emoji">${p.emoji}</span>
      </div>
      <div class="product-info">
        <div class="product-plant">${p.plant}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-bottom">
          <div class="product-pricing">
            <span class="product-price">₹${p.price}</span>
            <span class="product-mrp">₹${p.mrp} &nbsp;${discount(p.price, p.mrp)}% off</span>
          </div>
          <button
            class="add-btn ${inCart ? 'add-btn--added' : ''}"
            id="btn-${p.id}"
            onclick="toggleCart('${p.id}', '${section}')"
          >${inCart ? '✓ Added' : '+ Add'}</button>
        </div>
      </div>
    </div>
  `;
}

// ── Render sections ────────────────────────────────────────────
function renderNut(filter) {
  nutFilter = filter;
  const list = filter === 'all' ? NUTRITION_PRODUCTS : NUTRITION_PRODUCTS.filter(p => p.category === filter);
  document.getElementById('nutGrid').innerHTML = list.map(p => productCard(p, 'nutrition')).join('');
}

function renderSkin(filter) {
  skinFilter = filter;
  const list = filter === 'all' ? SKINCARE_PRODUCTS : SKINCARE_PRODUCTS.filter(p => p.category === filter);
  document.getElementById('skinGrid').innerHTML = list.map(p => productCard(p, 'skincare')).join('');
}

// ── Category filter buttons ────────────────────────────────────
function filterNut(cat, el) {
  nutFilter = cat;
  document.querySelectorAll('#nutFilter .cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderNut(cat);
}

function filterSkin(cat, el) {
  skinFilter = cat;
  document.querySelectorAll('#skinFilter .cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderSkin(cat);
}

// ── Cart logic ─────────────────────────────────────────────────
function toggleCart(id, section) {
  const allProducts = [...NUTRITION_PRODUCTS, ...SKINCARE_PRODUCTS];
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  if (cart[id]) {
    delete cart[id];
  } else {
    cart[id] = product;
  }

  updateCartUI();

  // Update button
  const btn = document.getElementById('btn-' + id);
  if (btn) {
    btn.classList.toggle('add-btn--added', !!cart[id]);
    btn.textContent = cart[id] ? '✓ Added' : '+ Add';
  }
}

function updateCartUI() {
  const count = Object.keys(cart).length;
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartCount').style.display = count > 0 ? 'flex' : 'none';

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (count === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Your cart is empty</p></div>`;
    footerEl.style.display = 'none';
    return;
  }

  let total = 0;
  itemsEl.innerHTML = Object.values(cart).map(p => {
    total += p.price;
    return `
      <div class="cart-item" id="citem-${p.id}">
        <span class="cart-emoji">${p.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">₹${p.price.toLocaleString('en-IN')}</div>
        </div>
        <button class="remove-btn" onclick="toggleCart('${p.id}')" aria-label="Remove">✕</button>
      </div>
    `;
  }).join('');

  document.getElementById('cartTotal').textContent = '₹' + total.toLocaleString('en-IN');
  document.getElementById('modalTotal').textContent = total.toLocaleString('en-IN');
  footerEl.style.display = 'block';
}

// ── Cart drawer ────────────────────────────────────────────────
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.classList.remove('no-scroll');
}

document.getElementById('cartToggle').addEventListener('click', () => {
  const drawer = document.getElementById('cartDrawer');
  if (drawer.classList.contains('open')) closeCart();
  else openCart();
});

// ── Order modal ────────────────────────────────────────────────
function openOrderModal() {
  closeCart();
  // Populate order summary
  const items = Object.values(cart);
  let total = 0;
  const summaryHTML = items.map(p => {
    total += p.price;
    return `<div class="order-row"><span>${p.emoji} ${p.name}</span><span>₹${p.price}</span></div>`;
  }).join('');
  document.getElementById('orderSummary').innerHTML = `
    <div class="order-summary-title">Order Summary</div>
    ${summaryHTML}
    <div class="order-row order-row--total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
  `;
  document.getElementById('modalTotal').textContent = total.toLocaleString('en-IN');
  document.getElementById('orderOverlay').classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeOrderModal() {
  document.getElementById('orderOverlay').classList.remove('open');
  document.getElementById('orderForm').style.display = 'block';
  document.getElementById('orderSuccess').style.display = 'none';
  document.body.classList.remove('no-scroll');
}

function submitOrder() {
  const name = document.getElementById('iName').value.trim();
  const phone = document.getElementById('iPhone').value.trim();
  const addr = document.getElementById('iAddr').value.trim();
  if (!name || !phone || !addr) {
    if (!name) document.getElementById('iName').focus();
    else if (!phone) document.getElementById('iPhone').focus();
    else document.getElementById('iAddr').focus();
    return;
  }
  const items = Object.values(cart).map(p => p.name).join(', ');
  const total = Object.values(cart).reduce((s, p) => s + p.price, 0);
  document.getElementById('successMsg').textContent =
    `Hi ${name}! Your order for ${items} worth ₹${total.toLocaleString('en-IN')} has been received. We'll call you at ${phone} to confirm delivery.`;
  document.getElementById('orderForm').style.display = 'none';
  document.getElementById('orderSuccess').style.display = 'flex';

  // Clear cart after order
  cart = {};
  updateCartUI();
  renderNut(nutFilter);
  renderSkin(skinFilter);
}

// ── Nav scroll effect ──────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// ── Initialise ─────────────────────────────────────────────────
renderNut('all');
renderSkin('all');
updateCartUI();

// ── Login Modal ────────────────────────────────────────────────
function openLoginModal() {
  resetAuthForm()
  document.getElementById('loginOverlay').classList.add('open')
  document.body.classList.add('no-scroll')
  setTimeout(() => document.getElementById('authEmail')?.focus(), 120)
}

function closeLoginModal() {
  document.getElementById('loginOverlay').classList.remove('open')
  document.body.classList.remove('no-scroll')
}

function resetAuthForm() {
  const form    = document.getElementById('authFormInner')
  const success = document.getElementById('authSuccess')
  const btn     = document.getElementById('authSubmitBtn')
  const input   = document.getElementById('authEmail')
  if (form)    form.style.display    = 'block'
  if (success) success.style.display = 'none'
  if (btn)   { btn.textContent = 'Send Login Link →'; btn.disabled = false }
  if (input) { input.value = ''; input.style.borderColor = '' }
}

// Close login modal when clicking overlay background
document.getElementById('loginOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeLoginModal()
})

window.openLoginModal  = openLoginModal
window.closeLoginModal = closeLoginModal
window.resetAuthForm   = resetAuthForm

// ── Config ─────────────────────────────────────────────────────
const BACKEND_URL = 'https://plix-webapge-backend.onrender.com'

// ── UTM capture — run ONCE on page load, store in sessionStorage ──
// Reading UTMs at submit time loses them if the URL changes (hash nav,
// magic link redirect, etc.). Capture immediately and persist.
(function captureUTMs() {
  const params = new URLSearchParams(window.location.search)
  const source = params.get('utm_source')
  if (source) {
    const utmData = {
      utm_source:          source,
      utm_medium:          params.get('utm_medium')   || null,
      utm_campaign:        params.get('utm_campaign') || null,
      utm_category:        params.get('utm_category') || null,
      utm_click_timestamp: new Date().toISOString(),   // exact landing time
    }
    sessionStorage.setItem('plix_utms', JSON.stringify(utmData))
  }
})()

function getStoredUTMs() {
  try {
    return JSON.parse(sessionStorage.getItem('plix_utms') || 'null')
  } catch { return null }
}

// ── Category mapping — scalable, driven by products.js arrays ──
function getTopLevelCategory(productId) {
  if (NUTRITION_PRODUCTS.find(p => p.id === productId)) return 'nutrition'
  if (SKINCARE_PRODUCTS.find(p => p.id === productId))  return 'skincare'
  return 'nutrition'
}

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
  window.supabase?.auth.getSession().then(({ data }) => {
    if (!data?.session) {
      closeCart()
      openLoginModal()
      alert('Please sign in first to place an order.')
      return
    }
    _openOrderModal()
  })
}

function _openOrderModal() {
  closeCart();
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

// ── Submit Order ───────────────────────────────────────────────
async function submitOrder() {
  const name  = document.getElementById('iName').value.trim();
  const phone = document.getElementById('iPhone').value.trim();
  const addr  = document.getElementById('iAddr').value.trim();
  const email = document.getElementById('iEmail').value.trim();

  if (!name)  { document.getElementById('iName').focus();  return; }
  if (!phone) { document.getElementById('iPhone').focus(); return; }
  if (!addr)  { document.getElementById('iAddr').focus();  return; }

  const items = Object.values(cart);
  if (items.length === 0) return;

  const { data: sessionData } = await window.supabase.auth.getSession()
  const session = sessionData?.session

  if (!session) {
    alert('Your session expired. Please sign in again.')
    closeOrderModal()
    openLoginModal()
    return
  }

  const accessToken = session.access_token

  const btn = document.querySelector('#orderForm .checkout-btn')
  const originalText = btn.textContent
  btn.textContent = 'Placing order...'
  btn.disabled = true

  const total = items.reduce((s, p) => s + p.price, 0)

  // Read UTMs from sessionStorage (captured on page load, not submit time)
  const utms = getStoredUTMs()
  const utm_source          = utms?.utm_source          || null
  const utm_medium          = utms?.utm_medium          || null
  const utm_campaign        = utms?.utm_campaign        || null
  const utm_category        = utms?.utm_category        || null
  const utm_click_timestamp = utms?.utm_click_timestamp || null

  let lastOrderRef = null
  let allSuccess   = true

  for (const product of items) {
    const payload = {
      // ── Product ───────────────────────────────────────────────
      product_id:   product.id,
      product_name: product.name,
      product_category:     getTopLevelCategory(product.id),
      product_sub_category: product.category,

      // ── Pricing ───────────────────────────────────────────────
      order_value:     product.price,
      mrp:             product.mrp,
      discount_amount: product.mrp - product.price,
      discount_code:   null,

      // ── Customer ──────────────────────────────────────────────
      customer_name:    name,
      customer_phone:   phone,
      customer_email:   email || session.user.email,
      delivery_address: addr,

      // ── Attribution — from sessionStorage, not live URL ───────
      utm_source,
      utm_medium,
      utm_campaign,
      utm_category,
      utm_click_timestamp,
      last_utm:     null,
      attr_quality: utm_source ? 'utm_captured' : 'unattributed',

      // ── Session ───────────────────────────────────────────────
      session_id: null,
      device_id:  null,
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[ORDER]', product.name, res.status, err)
        allSuccess = false
        continue
      }

      const data = await res.json()
      lastOrderRef = data.order_ref
      console.log('[ORDER] Placed:', data.order_ref, 'for', product.name)

    } catch (err) {
      console.error('[ORDER] Network error:', err.message)
      allSuccess = false
    }
  }

  btn.textContent = originalText
  btn.disabled    = false

  if (!allSuccess) {
    alert('Some items failed to place. Please try again or contact support.')
    return
  }

  document.getElementById('successMsg').textContent =
    `Hi ${name}! Your order (${lastOrderRef || 'received'}) worth ₹${total.toLocaleString('en-IN')} has been placed. We'll call you at ${phone} to confirm delivery.`

  document.getElementById('orderForm').style.display   = 'none'
  document.getElementById('orderSuccess').style.display = 'flex'

  cart = {}
  updateCartUI()
  renderNut(nutFilter)
  renderSkin(skinFilter)
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

document.getElementById('loginOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeLoginModal()
})

window.openLoginModal  = openLoginModal
window.closeLoginModal = closeLoginModal
window.resetAuthForm   = resetAuthForm

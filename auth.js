// ── Supabase client ────────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://jjuzkjymdiwzaiqysobo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdXpranltZGl3emFpcXlzb2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTE3MjEsImV4cCI6MjA5MjA2NzcyMX0.RlQHLgQeZr1J_iduT1xgKTMfDtxvToCbdneKWcbnoLY'
)

// ── Resolve correct redirect URL (GitHub Pages or localhost) ───
function getRedirectURL() {
  const { hostname, origin, pathname } = window.location

  // GitHub Pages: redirect to the repo root page
  if (hostname.includes('github.io')) {
    // pathname is like /Plix_Webpage_frontend/index.html
    // We want just the base: /Plix_Webpage_frontend/
    const base = pathname.split('/').slice(0, 2).join('/') + '/'
    return `${origin}${base}`
  }

  // Local dev (Live Server, localhost, etc.)
  return origin + '/'
}

// ── Send magic link ────────────────────────────────────────────
window.sendMagicLink = async function () {
  const emailInput = document.getElementById('authEmail')
  const email = emailInput.value.trim()

  if (!email || !email.includes('@')) {
    emailInput.focus()
    emailInput.style.borderColor = 'var(--pink)'
    return
  }

  const btn = document.getElementById('authSubmitBtn')
  btn.textContent = 'Sending...'
  btn.disabled = true

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: getRedirectURL() }
  })

  if (error) {
    btn.textContent = 'Send Login Link →'
    btn.disabled = false
    alert('Something went wrong: ' + error.message)
    return
  }

  document.getElementById('sentToEmail').textContent = email
  document.getElementById('authFormInner').style.display = 'none'
  document.getElementById('authSuccess').style.display  = 'flex'
}

// ── Logout ─────────────────────────────────────────────────────
window.logout = async function () {
  await supabase.auth.signOut()
  updateLoginUI(null)
}

// ── Update nav button based on auth state ──────────────────────
function updateLoginUI(user) {
  const btn = document.getElementById('loginBtn')
  if (!btn) return

  if (user) {
    const name = (user.email || '').split('@')[0]
    const initial = name[0]?.toUpperCase() || '?'
    btn.innerHTML = `
      <span style="
        width:24px;height:24px;border-radius:50%;
        background:var(--green);color:white;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;flex-shrink:0;
        font-family:'Syne',sans-serif">
        ${initial}
      </span>
      <span style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
    `
    btn.title = 'Click to sign out'
    btn.onclick = logout
  } else {
    btn.innerHTML = 'Sign In'
    btn.title = ''
    btn.onclick = openLoginModal
  }
}

// ── Check session on page load + listen for changes ───────────
window.addEventListener('load', async () => {
  const { data: { user } } = await supabase.auth.getUser()
  updateLoginUI(user)

  supabase.auth.onAuthStateChange((_event, session) => {
    updateLoginUI(session?.user ?? null)
    if (session?.user) closeLoginModal()
  })
})

// ── Expose supabase globally for main.js if needed ────────────
window.supabase = supabase

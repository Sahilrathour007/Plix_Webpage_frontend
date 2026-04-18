// ── Supabase client ────────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://jjuzkjymdiwzaiqysobo.supabase.co',
  'YOUR_ANON_KEY_HERE'   // ← Supabase → Settings → API Keys → anon public
)

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
    options: { emailRedirectTo: window.location.href }
  })

  if (error) {
    btn.textContent = 'Send Login Link →'
    btn.disabled = false
    alert('Something went wrong: ' + error.message)
    return
  }

  // Show success state — store email to display it
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

  // Fires when magic link is clicked and user lands back on the page
  supabase.auth.onAuthStateChange((_event, session) => {
    updateLoginUI(session?.user ?? null)
    if (session?.user) closeLoginModal()
  })
})

// ── Expose supabase globally for main.js if needed ────────────
window.supabase = supabase

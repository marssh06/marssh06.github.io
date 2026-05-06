// auth.js — ELITE-SUBS user authentication and order history

// ── Data layer ────────────────────────────────────────────────────────────────
const _AU = 'es-users';
const _AS = 'es-session';

function _enc(p) { try { return btoa(unescape(encodeURIComponent(p))); } catch { return btoa(p); } }

function esGetUsers() { try { return JSON.parse(localStorage.getItem(_AU)) || {}; } catch { return {}; } }
function _saveUsers(u) { localStorage.setItem(_AU, JSON.stringify(u)); }

function esRegister(email, password, name) {
  const users = esGetUsers();
  const key = email.toLowerCase().trim();
  if (users[key]) return { error: 'An account with this email already exists.' };
  users[key] = { name: name.trim(), pwd: _enc(password), orders: [] };
  _saveUsers(users);
  localStorage.setItem(_AS, JSON.stringify({ email: key, name: name.trim() }));
  return { success: true };
}

function esLogin(email, password) {
  const users = esGetUsers();
  const key = email.toLowerCase().trim();
  const u = users[key];
  if (!u) return { error: 'No account found with this email.' };
  if (u.pwd !== _enc(password)) return { error: 'Incorrect password.' };
  localStorage.setItem(_AS, JSON.stringify({ email: key, name: u.name }));
  return { success: true };
}

function esLogout() {
  localStorage.removeItem(_AS);
  location.href = 'index.html';
}

function esCurrentUser() {
  try { return JSON.parse(localStorage.getItem(_AS)); } catch { return null; }
}

function esRecordOrder(items, total) {
  const user = esCurrentUser();
  if (!user || !items || !items.length) return;
  const users = esGetUsers();
  const u = users[user.email];
  if (!u) return;
  if (!u.orders) u.orders = [];
  u.orders.unshift({
    id: 'ORD-' + Date.now(),
    date: new Date().toISOString(),
    items: items.map(i => ({ id: i.id, name: i.name, duration: i.duration, price: +i.price, qty: i.qty || 1 })),
    total: +parseFloat(total).toFixed(2)
  });
  _saveUsers(users);
}

function esGetOrders() {
  const user = esCurrentUser();
  if (!user) return [];
  return (esGetUsers()[user.email] || {}).orders || [];
}

// ── Styles ────────────────────────────────────────────────────────────────────
const _CSS = `
#esAuthModal{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .2s}
#esAuthModal.open{opacity:1;pointer-events:all}
.es-abox{background:var(--surface);border:1px solid var(--border);border-radius:28px;box-shadow:var(--shadow-lg);padding:32px 28px;width:100%;max-width:400px;position:relative}
.es-aclose{position:absolute;top:14px;right:16px;font-size:20px;cursor:pointer;color:var(--muted);background:none;border:0;line-height:1;padding:4px 8px;border-radius:8px}
.es-aclose:hover{color:var(--text)}
.es-atabs{display:flex;border-bottom:2px solid var(--border);margin-bottom:22px}
.es-atab{flex:1;padding:10px;font-weight:800;font-size:14px;cursor:pointer;background:none;border:0;color:var(--muted);border-bottom:3px solid transparent;margin-bottom:-2px;transition:color .15s;font-family:inherit}
.es-atab.active{color:var(--pr);border-bottom-color:var(--pr)}
.es-afield{display:flex;flex-direction:column;gap:5px;margin-bottom:13px}
.es-afield label{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.es-afield input{min-height:46px;border-radius:12px;border:1.5px solid var(--border);background:var(--surface2);padding:0 14px;font-size:15px;color:var(--text);outline:none;font-family:inherit;transition:border-color .15s;width:100%}
.es-afield input:focus{border-color:var(--pr)}
.es-aerr{color:#e05555;font-size:13px;font-weight:700;margin-bottom:10px;display:none;padding:10px 12px;border-radius:10px;background:rgba(224,85,85,.1)}
.es-asubmit{width:100%;min-height:50px;border-radius:999px;background:var(--gld);color:#0a0a0a;font-size:15px;font-weight:900;border:0;cursor:pointer;transition:opacity .15s;margin-top:6px;font-family:inherit}
.es-asubmit:hover{opacity:.88}
.es-ahead{font-family:'Baloo 2',cursive;font-size:24px;font-weight:900;margin-bottom:2px;color:var(--text)}
.es-asub{color:var(--muted);font-size:14px;margin-bottom:18px}
.es-uwrap{position:relative}
#esUserDrop{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-md);min-width:190px;padding:6px;z-index:50;display:none}
#esUserDrop.open{display:block}
#esUserDrop a,#esUserDrop button.es-dropitem{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:14px;font-weight:700;color:var(--text);background:none;border:0;cursor:pointer;width:100%;text-decoration:none;font-family:inherit;transition:background .15s}
#esUserDrop a:hover,#esUserDrop button.es-dropitem:hover{background:var(--surface2)}
.es-dropemail{padding:8px 12px 4px;font-size:12px;color:var(--muted);font-weight:700;word-break:break-all;border-bottom:1px solid var(--divider);margin-bottom:4px}
`;

// ── Modal HTML ────────────────────────────────────────────────────────────────
function _injectModal() {
  document.body.insertAdjacentHTML('beforeend', `
<div id="esAuthModal">
  <div class="es-abox">
    <button class="es-aclose" id="esAuthClose" aria-label="Close">✕</button>
    <div class="es-atabs">
      <button class="es-atab active" data-tab="login">Sign In</button>
      <button class="es-atab" data-tab="register">Create Account</button>
    </div>
    <div id="esPanelLogin">
      <p class="es-ahead">Welcome back</p>
      <p class="es-asub">Sign in to track your orders</p>
      <div class="es-afield"><label>Email</label><input type="email" id="esLoginEmail" placeholder="you@example.com" autocomplete="email"></div>
      <div class="es-afield"><label>Password</label><input type="password" id="esLoginPwd" placeholder="••••••••" autocomplete="current-password"></div>
      <div class="es-aerr" id="esLoginErr"></div>
      <button class="es-asubmit" id="esLoginBtn">Sign In →</button>
    </div>
    <div id="esPanelReg" style="display:none">
      <p class="es-ahead">Create account</p>
      <p class="es-asub">Your orders will be saved forever</p>
      <div class="es-afield"><label>Full Name</label><input type="text" id="esRegName" placeholder="Your name" autocomplete="name"></div>
      <div class="es-afield"><label>Email</label><input type="email" id="esRegEmail" placeholder="you@example.com" autocomplete="email"></div>
      <div class="es-afield"><label>Password</label><input type="password" id="esRegPwd" placeholder="Min. 6 characters" autocomplete="new-password"></div>
      <div class="es-aerr" id="esRegErr"></div>
      <button class="es-asubmit" id="esRegBtn">Create Account →</button>
    </div>
  </div>
</div>`);
}

function openAuthModal() {
  document.getElementById('esAuthModal').classList.add('open');
  setTimeout(() => { const el = document.getElementById('esLoginEmail'); if (el) el.focus(); }, 100);
}

function closeAuthModal() {
  document.getElementById('esAuthModal').classList.remove('open');
}

function _wireModal() {
  const overlay = document.getElementById('esAuthModal');
  overlay.addEventListener('click', e => { if (e.target === overlay) closeAuthModal(); });
  document.getElementById('esAuthClose').addEventListener('click', closeAuthModal);

  document.querySelectorAll('.es-atab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.es-atab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('esPanelLogin').style.display = isLogin ? '' : 'none';
      document.getElementById('esPanelReg').style.display = isLogin ? 'none' : '';
      setTimeout(() => { const el = document.getElementById(isLogin ? 'esLoginEmail' : 'esRegName'); if (el) el.focus(); }, 50);
    });
  });

  document.getElementById('esLoginBtn').addEventListener('click', () => {
    const err = document.getElementById('esLoginErr');
    err.style.display = 'none';
    const email = document.getElementById('esLoginEmail').value.trim();
    const pwd = document.getElementById('esLoginPwd').value;
    if (!email || !pwd) { err.textContent = 'Please fill in all fields.'; err.style.display = 'block'; return; }
    const r = esLogin(email, pwd);
    if (r.error) { err.textContent = r.error; err.style.display = 'block'; return; }
    closeAuthModal();
    location.reload();
  });

  document.getElementById('esRegBtn').addEventListener('click', () => {
    const err = document.getElementById('esRegErr');
    err.style.display = 'none';
    const name = document.getElementById('esRegName').value.trim();
    const email = document.getElementById('esRegEmail').value.trim();
    const pwd = document.getElementById('esRegPwd').value;
    if (!name || !email || !pwd) { err.textContent = 'Please fill in all fields.'; err.style.display = 'block'; return; }
    if (pwd.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; return; }
    const r = esRegister(email, pwd, name);
    if (r.error) { err.textContent = r.error; err.style.display = 'block'; return; }
    closeAuthModal();
    location.reload();
  });

  ['esLoginEmail', 'esLoginPwd'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('esLoginBtn').click(); });
  });
  ['esRegName', 'esRegEmail', 'esRegPwd'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('esRegBtn').click(); });
  });
}

// ── Header user button ────────────────────────────────────────────────────────
function _updateUserBtn() {
  const btn = document.getElementById('esUserBtn');
  if (!btn) return;
  const user = esCurrentUser();
  const wrap = btn.closest('.es-uwrap');

  if (user) {
    const initial = user.name.charAt(0).toUpperCase();
    const firstName = user.name.split(' ')[0];
    btn.innerHTML = `<span style="width:26px;height:26px;border-radius:50%;background:var(--gld);color:#0a0a0a;font-size:12px;font-weight:900;display:grid;place-items:center;flex-shrink:0">${initial}</span>${firstName}`;
    btn.style.cssText += ';display:flex;align-items:center;gap:6px;padding:0 12px;min-width:unset';

    if (!document.getElementById('esUserDrop')) {
      const drop = document.createElement('div');
      drop.id = 'esUserDrop';
      drop.innerHTML = `
        <div class="es-dropemail">${user.email}</div>
        <a href="orders.html">📋 Order History</a>
        <button class="es-dropitem" id="esLogoutBtn">🚪 Sign Out</button>`;
      wrap.appendChild(drop);
      document.getElementById('esLogoutBtn').addEventListener('click', esLogout);
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('esUserDrop').classList.toggle('open');
    });
    document.addEventListener('click', () => {
      const d = document.getElementById('esUserDrop');
      if (d) d.classList.remove('open');
    });
  } else {
    btn.innerHTML = '👤 Sign In';
    btn.addEventListener('click', openAuthModal);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initAuth() {
  const style = document.createElement('style');
  style.textContent = _CSS;
  document.head.appendChild(style);
  _injectModal();
  _wireModal();
  _updateUserBtn();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

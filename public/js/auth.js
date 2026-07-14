/**
 * MeetIQ Auth Module
 * Handles login, signup, session management
 */

let currentUser = null;

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('meetiq_user')); } catch { return null; }
}

function storeUser(user) {
  currentUser = user;
  localStorage.setItem('meetiq_user', JSON.stringify(user));
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem('meetiq_user');
  localStorage.removeItem('meetiq_token');
  api.setToken(null);
}

function isAuthenticated() {
  return !!(api.getToken() && getStoredUser());
}

let prevAuthPage = 'landing';

function showAuth(page = 'login') {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('auth-container').classList.remove('hidden');

  const currentActivePage = ['login', 'signup', 'forgot', 'otp'].find(p => {
    const el = document.getElementById(p + '-page');
    return el && !el.classList.contains('hidden');
  }) || 'landing';

  if (currentActivePage !== page) {
    prevAuthPage = currentActivePage;
  }

  document.getElementById('login-page').classList.toggle('hidden', page !== 'login');
  document.getElementById('signup-page').classList.toggle('hidden', page !== 'signup');
  document.getElementById('forgot-page').classList.toggle('hidden', page !== 'forgot');
  document.getElementById('otp-page').classList.toggle('hidden', page !== 'otp');
  lucide.createIcons();
}

function handleAuthBack() {
  if (prevAuthPage === 'signup') {
    showAuth('signup');
  } else if (prevAuthPage === 'login') {
    showAuth('login');
  } else if (prevAuthPage === 'forgot') {
    showAuth('forgot');
  } else {
    showLanding();
  }
}

function handleCancelOTP() {
  showAuth('login');
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const btn = document.getElementById('forgot-btn');
  const email = document.getElementById('forgot-email').value.trim();

  if (!email) return showToast('Please enter your email address', 'error');

  btn.disabled = true;
  btn.innerHTML = '<span>Sending OTP...</span>';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<span>Send OTP</span><i data-lucide="arrow-right"></i>';
    showToast('Verification code sent!', 'success');
    showAuth('otp');
  }, 800);
}

async function handleVerifyOTP(e) {
  e.preventDefault();
  const btn = document.getElementById('otp-btn');
  const code = document.getElementById('otp-code').value.trim();

  if (code.length !== 6 || isNaN(code)) {
    return showToast('Please enter a valid 6-digit verification code', 'error');
  }

  btn.disabled = true;
  btn.innerHTML = '<span>Verifying...</span>';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<span>Verify & Reset</span><i data-lucide="arrow-right"></i>';
    showToast('Verification successful! Password reset instructions sent to email.', 'success');
    showAuth('login');
  }, 800);
}

function showLanding() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
  lucide.createIcons();
}

function showApp() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  const user = getStoredUser();
  if (user) {
    currentUser = user;
    document.getElementById('user-name').textContent = user.name || 'User';
    document.getElementById('user-avatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
    if (user.avatar) {
      document.getElementById('user-avatar').innerHTML = `<img src="${esc(user.avatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
    }
  }
  lucide.createIcons();
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showToast('Please fill all fields', 'error');

  btn.disabled = true;
  btn.innerHTML = '<span>Signing in...</span>';

  try {
    const res = await api.login({ email, password });
    api.setToken(res.data.token);
    storeUser(res.data.user);
    showToast('Welcome back! 🎉', 'success');
    showApp();
    navigateTo('dashboard');
    loadNotifications();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right"></i>';
    lucide.createIcons();
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!name || !email || !password) return showToast('Please fill all fields', 'error');
  if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');

  btn.disabled = true;
  btn.innerHTML = '<span>Creating account...</span>';

  try {
    const res = await api.signup({ name, email, password });
    api.setToken(res.data.token);
    storeUser(res.data.user);
    showToast('Account created! 🎉', 'success');
    showApp();
    navigateTo('dashboard');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Create Account</span><i data-lucide="arrow-right"></i>';
    lucide.createIcons();
  }
}

function logout() {
  clearSession();
  showToast('Logged out successfully', 'info');
  showLanding();
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

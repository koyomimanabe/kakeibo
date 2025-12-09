// public/javascripts/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const loginFormEl = document.getElementById('loginForm');
    const registerFormEl = document.getElementById('registerForm');
    const authMessageEl = document.getElementById('auth-message');
  
    // タブ切り替え
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
  
        const target = btn.dataset.tab; // "login" or "register"
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.remove('active');
  
        if (target === 'login') {
          document.getElementById('login-form').classList.add('active');
        } else {
          document.getElementById('register-form').classList.add('active');
        }
  
        // メッセージ消す
        authMessageEl.textContent = '';
        authMessageEl.classList.remove('error', 'success');
      });
    });
  
    // メッセージ表示用ヘルパー
    function showMessage(text, type = 'error') {
      authMessageEl.textContent = text;
      authMessageEl.classList.remove('error', 'success');
      authMessageEl.classList.add(type);
    }
  
    // 共通の fetch ラッパー（JSON 送信）
    async function postJson(url, data) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'same-origin', // セッションcookie用
      });
  
      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error('サーバーから不正な応答が返されました');
      }
  
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'エラーが発生しました');
      }
  
      return json;
    }
  
    // 🔐 ログイン処理
    loginFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
  
      if (!email || !password) {
        showMessage('メールアドレスとパスワードを入力してください', 'error');
        return;
      }
  
      try {
        showMessage('ログイン中です...', 'success');
  
        await postJson('/api/auth/login', { email, password });
  
        // ✅ ログイン成功 → ダッシュボードへ移動
        window.location.href = '/dashboard';
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'ログインに失敗しました', 'error');
      }
    });
  
    // 🆕 新規登録処理
    registerFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
  
      if (!email || !password) {
        showMessage('メールアドレスとパスワードを入力してください', 'error');
        return;
      }
  
      try {
        showMessage('登録中です...', 'success');
  
        await postJson('/api/auth/register', { email, password });
  
        // ✅ 登録成功 → そのままログイン扱いにしてダッシュボードへ
        window.location.href = '/dashboard';
      } catch (err) {
        console.error(err);
        showMessage(err.message || '登録に失敗しました', 'error');
      }
    });
  });
  
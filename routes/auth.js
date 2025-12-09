const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

// 新規登録
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードが必要です' });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー登録
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true
      }
    });

    // セッションにユーザーIDを保存
    req.session.userId = user.id;

    res.json({ 
      success: true, 
      user
    });
  } catch (error) {
    if (error.code === 'P2002') { // 一意制約違反
      res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
    } else {
      console.error('登録エラー:', error);
      res.status(500).json({ error: '登録に失敗しました' });
    }
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードが必要です' });
    }

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // セッションにユーザーIDを保存
    req.session.userId = user.id;

    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email } 
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ error: 'ログインに失敗しました' });
  }
});

// ログアウト
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'ログアウトに失敗しました' });
    }
    res.json({ success: true });
  });
});

// セッション確認
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, userId: req.session.userId });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;

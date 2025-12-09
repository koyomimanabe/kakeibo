const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

require('dotenv').config();

const app = express();

// ビューエンジンの設定
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// セッション設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// ルート設定
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');

app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);

// 404エラーハンドラー
app.use((req, res, next) => {
  res.status(404).render('error', { 
    message: 'ページが見つかりません',
    error: { status: 404 }
  });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;


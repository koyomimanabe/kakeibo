const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// 認証ミドルウェア
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/');
  }
}

// トップページ（ログイン/新規登録）
router.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// ダッシュボード
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    
    const userId = req.session.userId;
    
    // サマリー取得
    const summary = await prisma.item.aggregate({
      where: { userid: userId },
      _sum: {
        amount: true
      },
      _count: true
    });
    
    const income = await prisma.item.aggregate({
      where: { 
        userid: userId,
        type: 'Income'
      },
      _sum: {
        amount: true
      }
    });
    
    const expense = await prisma.item.aggregate({
      where: { 
        userid: userId,
        type: 'Expense'
      },
      _sum: {
        amount: true
      }
    });
    
    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;
    const balance = totalIncome - totalExpense;
    
    res.render('dashboard', {
      totalIncome,
      totalExpense,
      balance
    });
  } catch (error) {
    console.error('ダッシュボードエラー:', error);
    res.status(500).render('error', {
      message: 'データの読み込みに失敗しました',
      error: {}
    });
  }
});

// 詳細ページ
router.get('/detail', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = parseInt(req.query.id);
    
    if (!itemId) {
      return res.redirect('/dashboard');
    }
    
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        userid: userId
      }
    });
    
    if (!item) {
      return res.status(404).render('error', {
        message: '項目が見つかりません',
        error: { status: 404 }
      });
    }
    
    res.render('detail', { item });
  } catch (error) {
    console.error('詳細ページエラー:', error);
    res.status(500).render('error', {
      message: 'データの読み込みに失敗しました',
      error: {}
    });
  }
});

module.exports = router;


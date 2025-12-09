const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// 認証ミドルウェア
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: '認証が必要です' });
  }
}

// 全収支項目取得
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { type, startDate, endDate } = req.query;

    const where = {
      userid: userId
    };

    // 収支区分フィルタ
    if (type && type !== 'all') {
      where.type = type;
    }

    // 期間フィルタ
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(items);
  } catch (error) {
    console.error('収支項目取得エラー:', error);
    res.status(500).json({ error: '収支項目の取得に失敗しました' });
  }
});

// 収支サマリー取得
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate } = req.query;

    const where = {
      userid: userId
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const income = await prisma.item.aggregate({
      where: {
        ...where,
        type: 'Income'
      },
      _sum: {
        amount: true
      }
    });

    const expense = await prisma.item.aggregate({
      where: {
        ...where,
        type: 'Expense'
      },
      _sum: {
        amount: true
      }
    });

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;
    const balance = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      balance
    });
  } catch (error) {
    console.error('サマリー取得エラー:', error);
    res.status(500).json({ error: 'サマリーの取得に失敗しました' });
  }
});

// 個別収支項目取得
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = parseInt(req.params.id);

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        userid: userId
      }
    });

    if (!item) {
      return res.status(404).json({ error: '項目が見つかりません' });
    }

    res.json(item);
  } catch (error) {
    console.error('収支項目取得エラー:', error);
    res.status(500).json({ error: '収支項目の取得に失敗しました' });
  }
});

// 収支項目作成
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { amount, type, event, memo, createdAt } = req.body;

    if (!amount || !type || !event) {
      return res.status(400).json({ error: '金額、収支区分、項目名は必須です' });
    }

    if (type !== 'Income' && type !== 'Expense') {
      return res.status(400).json({ error: '収支区分はIncomeまたはExpenseである必要があります' });
    }

    const item = await prisma.item.create({
      data: {
        userid: userId,
        amount: parseInt(amount),
        type,
        event,
        memo: memo || null,
        createdAt: createdAt ? new Date(createdAt) : undefined
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('収支項目作成エラー:', error);
    res.status(500).json({ error: '収支項目の作成に失敗しました' });
  }
});

// 収支項目更新
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = parseInt(req.params.id);
    const { amount, type, event, memo, createdAt } = req.body;

    if (!amount || !type || !event) {
      return res.status(400).json({ error: '金額、収支区分、項目名は必須です' });
    }

    const item = await prisma.item.updateMany({
      where: {
        id: itemId,
        userid: userId
      },
      data: {
        amount: parseInt(amount),
        type,
        event,
        memo: memo || null,
        createdAt: createdAt ? new Date(createdAt) : undefined
      }
    });

    if (item.count === 0) {
      return res.status(404).json({ error: '項目が見つかりません' });
    }

    const updatedItem = await prisma.item.findUnique({
      where: { id: itemId }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('収支項目更新エラー:', error);
    res.status(500).json({ error: '収支項目の更新に失敗しました' });
  }
});

// 収支項目削除
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = parseInt(req.params.id);

    const item = await prisma.item.deleteMany({
      where: {
        id: itemId,
        userid: userId
      }
    });

    if (item.count === 0) {
      return res.status(404).json({ error: '項目が見つかりません' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('収支項目削除エラー:', error);
    res.status(500).json({ error: '収支項目の削除に失敗しました' });
  }
});

module.exports = router;

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// アプリケーション終了時にPrisma接続を閉じる
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;


import app from './app';
import prisma from './prisma/client';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(` Clinic Scheduling System Backend Active `);
  console.log(` Port: http://localhost:${PORT}          `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
  console.log(`=========================================`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server and disconnecting Prisma');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed and Prisma disconnected');
  });
});

process.on('SIGINT', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

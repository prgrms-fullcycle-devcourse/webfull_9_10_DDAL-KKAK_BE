import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import config from '../config/index.js';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = config.db.url;
const pool = new pg.Pool({ connectionString, max: config.db.maxConnections });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: config.isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
  });

if (!config.isProd) {
  globalForPrisma.prisma = prisma;
}

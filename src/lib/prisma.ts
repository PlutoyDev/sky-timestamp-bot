import { PrismaClient } from '../../prisma/build';

const PrismaGlobal = global as typeof global & {
  prisma: PrismaClient;
};

export const prisma = PrismaGlobal.prisma ?? new PrismaClient();

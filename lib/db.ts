import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não definida");

  // Sem connectionTimeoutMillis o pg espera indefinidamente quando o banco está
  // inacessível, e o envio do formulário (que tenta salvar o lead antes do
  // webhook do CRM) ficava preso dezenas de segundos.
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 4000 });
  return new PrismaClient({ adapter });
}

function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getDb()[prop as keyof PrismaClient];
  },
});

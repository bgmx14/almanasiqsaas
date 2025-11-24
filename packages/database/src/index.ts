import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Re-export Prisma types
export * from '@prisma/client';

// Helper function to set tenant context for RLS
export function setTenantContext(tenantId: string) {
  return prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, false)`;
}

// Middleware to enforce tenant isolation
export function createTenantAwareClient(tenantId: string) {
  const client = new PrismaClient();

  client.$use(async (params, next) => {
    // Automatically add tenantId to create operations
    if (params.action === 'create' || params.action === 'createMany') {
      if (params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId: tenantId,
          }));
        } else {
          params.args.data = {
            ...params.args.data,
            tenantId: tenantId,
          };
        }
      }
    }

    // Automatically filter by tenantId for find operations
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
      if (params.args) {
        params.args.where = {
          ...params.args.where,
          tenantId: tenantId,
        };
      } else {
        params.args = { where: { tenantId: tenantId } };
      }
    }

    return next(params);
  });

  return client;
}

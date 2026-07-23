import { prisma } from "@/lib/db";

export function withTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof withTenant>;

export async function setTenantContext(tx: { $executeRaw: typeof prisma.$executeRaw }, tenantId: string) {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
}

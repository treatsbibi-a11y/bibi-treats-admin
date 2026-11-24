import { ProductWithImages, OrderDetail, StoreSettingsData, OrderStatus, PaymentMethod } from '@/types';
import { prisma } from './prisma';

/**
 * Cloudflare D1 Database Helper & Repository (Admin)
 * 
 * Maps directly between Cloudflare D1 (SQLite Edge Database)
 * and the Admin Dashboard & Front End TypeScript Data Models.
 */

export interface CloudflareD1Binding {
  prepare(query: string): {
    bind(...values: any[]): {
      first<T = any>(): Promise<T | null>;
      all<T = any>(): Promise<{ results: T[]; success: boolean }>;
      run(): Promise<{ success: boolean; meta: any }>;
    };
  };
}

export interface AdminDashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
}

export async function getD1AdminMetrics(d1Binding?: CloudflareD1Binding): Promise<AdminDashboardMetrics> {
  if (d1Binding) {
    const ordersResult = await d1Binding.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN date(createdAt) = date('now') THEN 1 ELSE 0 END), 0) as todayOrders
      FROM [Order]
      WHERE status != 'CANCELLED'
    `).bind().first<any>();

    const productsResult = await d1Binding.prepare(`
      SELECT 
        COUNT(*) as totalProducts,
        COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) as activeProducts,
        COALESCE(SUM(stock), 0) as totalStock
      FROM Product
    `).bind().first<any>();

    return {
      totalRevenue: Number(ordersResult?.totalRevenue || 0),
      totalOrders: Number(ordersResult?.totalOrders || 0),
      todayOrders: Number(ordersResult?.todayOrders || 0),
      totalProducts: Number(productsResult?.totalProducts || 0),
      activeProducts: Number(productsResult?.activeProducts || 0),
      totalStock: Number(productsResult?.totalStock || 0),
    };
  }

  // Node runtime fallback via Prisma:
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, todayOrdersCount, products] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { total: true },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.product.findMany({
      select: { status: true, stock: true },
    }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;

  return {
    totalRevenue,
    totalOrders: orders.length,
    todayOrders: todayOrdersCount,
    totalProducts: products.length,
    activeProducts,
    totalStock,
  };
}

export async function getD1Products(options?: {
  category?: string;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'all';
}): Promise<ProductWithImages[]> {
  const where: any = {};
  if (options?.status && options.status !== 'all') {
    where.status = options.status;
  }
  if (options?.category && options?.category !== 'All') {
    where.category = options.category;
  }
  if (options?.search && options.search.trim()) {
    where.OR = [
      { name: { contains: options.search.trim() } },
      { description: { contains: options.search.trim() } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    initialStock: p.initialStock,
    sold: p.sold,
    category: p.category,
    status: p.status as 'ACTIVE' | 'INACTIVE',
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    images: p.images.map((img) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  }));
}

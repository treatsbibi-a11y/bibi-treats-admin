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
  d1Binding?: CloudflareD1Binding;
}): Promise<ProductWithImages[]> {
  if (options?.d1Binding) {
    let sql = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.initialStock, p.sold, 
        p.category, p.status, p.createdAt, p.updatedAt,
        COALESCE(
          json_group_array(
            json_object(
              'id', pi.id,
              'productId', pi.productId,
              'imageUrl', pi.imageUrl,
              'isPrimary', pi.isPrimary,
              'displayOrder', pi.displayOrder
            )
          ),
          '[]'
        ) as images_json
      FROM Product p
      LEFT JOIN ProductImage pi ON p.id = pi.productId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.status && options.status !== 'all') {
      sql += ` AND p.status = ?`;
      params.push(options.status);
    }

    if (options.category && options.category !== 'All') {
      sql += ` AND p.category = ?`;
      params.push(options.category);
    }

    if (options.search && options.search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
    }

    sql += ` GROUP BY p.id ORDER BY p.createdAt DESC`;

    const stmt = options.d1Binding.prepare(sql).bind(...params);
    const { results } = await stmt.all<any>();

    return results.map((row: any) => {
      let images = [];
      try {
        images = JSON.parse(row.images_json || '[]').filter((img: any) => img.id !== null);
      } catch {
        images = [];
      }
      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: Number(row.price),
        stock: Number(row.stock),
        initialStock: Number(row.initialStock),
        sold: Number(row.sold),
        category: row.category,
        status: row.status as 'ACTIVE' | 'INACTIVE',
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
        images: images.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
      };
    });
  }

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

export async function getD1StoreSettings(d1Binding?: CloudflareD1Binding): Promise<StoreSettingsData | null> {
  if (d1Binding) {
    const stmt = d1Binding.prepare(`SELECT * FROM StoreSettings LIMIT 1`);
    const row = await stmt.bind().first<any>();
    if (!row) return null;

    return {
      shopName: row.shopName,
      tagline: row.tagline,
      logoUrl: row.logoUrl,
      qrImageUrl: row.qrImageUrl,
      promptpayNumber: row.promptpayNumber,
      promptpayName: row.promptpayName,
      bankName: row.bankName,
      bankAccountNo: row.bankAccountNo,
      bankAccountName: row.bankAccountName,
      defaultShippingFee: Number(row.defaultShippingFee),
      isStoreOpen: Boolean(row.isStoreOpen),
      announcement: row.announcement,
    };
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings) return null;

  return {
    shopName: settings.shopName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    qrImageUrl: settings.qrImageUrl,
    promptpayNumber: settings.promptpayNumber,
    promptpayName: settings.promptpayName,
    bankName: settings.bankName,
    bankAccountNo: settings.bankAccountNo,
    bankAccountName: settings.bankAccountName,
    defaultShippingFee: settings.defaultShippingFee,
    isStoreOpen: settings.isStoreOpen,
    announcement: settings.announcement,
  };
}

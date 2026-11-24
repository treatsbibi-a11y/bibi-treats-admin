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

export async function getD1Orders(options?: {
  status?: string;
  search?: string;
  d1Binding?: CloudflareD1Binding;
}): Promise<any[]> {
  if (options?.d1Binding) {
    let sql = `
      SELECT 
        o.id, o.orderNumber, o.customerId, o.status, o.paymentMethod,
        o.slipUrl, o.subtotal, o.shippingFee, o.total, o.note,
        o.createdAt, o.updatedAt,
        c.name as customer_name, c.phone as customer_phone, c.instagram as customer_instagram, c.address as customer_address
      FROM [Order] o
      LEFT JOIN Customer c ON o.customerId = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.status && options.status !== 'ALL' && options.status !== 'all') {
      sql += ` AND o.status = ?`;
      params.push(options.status);
    }

    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      sql += ` AND (o.orderNumber LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY o.createdAt DESC`;

    const stmt = options.d1Binding.prepare(sql).bind(...params);
    const { results } = await stmt.all<any>();

    // Fetch items for each order
    const orderIds = results.map(r => r.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      try {
        const itemsStmt = options.d1Binding.prepare(`
          SELECT oi.id, oi.orderId, oi.productId, oi.productName, oi.quantity, oi.price, oi.subtotal,
                 p.name as p_name, pi.imageUrl as p_image
          FROM OrderItem oi
          LEFT JOIN Product p ON oi.productId = p.id
          LEFT JOIN ProductImage pi ON p.id = pi.productId AND pi.isPrimary = 1
        `).bind();
        const itemsRes = await itemsStmt.all<any>();
        for (const item of itemsRes.results) {
          if (!itemsMap[item.orderId]) itemsMap[item.orderId] = [];
          itemsMap[item.orderId].push({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            productName: item.productName || item.p_name,
            quantity: Number(item.quantity),
            price: Number(item.price),
            subtotal: Number(item.subtotal),
            product: {
              id: item.productId,
              name: item.productName || item.p_name,
              images: item.p_image ? [{ imageUrl: item.p_image, isPrimary: true }] : []
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching order items from D1:', err);
      }
    }

    const safeIso = (d: any) => {
      if (!d) return new Date().toISOString();
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    };

    return results.map(row => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      status: row.status,
      paymentStatus: row.status === 'CANCELLED' ? 'FAILED' : 'PAID',
      paymentMethod: row.paymentMethod,
      slipUrl: row.slipUrl,
      paymentProof: row.slipUrl,
      subtotal: Number(row.subtotal || 0),
      shippingFee: Number(row.shippingFee || 0),
      discount: 0,
      total: Number(row.total || 0),
      note: row.note,
      trackingNumber: null,
      shippingCarrier: null,
      createdAt: safeIso(row.createdAt),
      updatedAt: safeIso(row.updatedAt),
      customer: {
        id: row.customerId,
        name: row.customer_name || 'ลูกค้าทั่วไป',
        phone: row.customer_phone || '-',
        instagram: row.customer_instagram || null,
        address: row.customer_address || '-'
      },
      items: itemsMap[row.id] || []
    }));
  }

  return [];
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

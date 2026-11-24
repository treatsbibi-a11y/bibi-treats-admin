import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const now = new Date();

    // 1. Time boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 2. Overview metrics
    const [
      totalOrders,
      todayOrders,
      todaySalesAgg,
      totalSalesAgg,
      totalProducts,
      remainingStockAgg,
      lowStockCount,
    ] = await Promise.all([
      // Total orders (excluding cancelled)
      prisma.order.count({
        where: { status: { not: 'CANCELLED' } },
      }),
      // Today orders (excluding cancelled)
      prisma.order.count({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      // Today sales (excluding cancelled)
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { total: true },
      }),
      // Total sales (excluding cancelled)
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      // Total active products
      prisma.product.count({
        where: { status: 'ACTIVE' },
      }),
      // Remaining stock of active products
      prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { stock: true },
      }),
      // Low stock products count (stock <= 10)
      prisma.product.count({
        where: { status: 'ACTIVE', stock: { lte: 10 } },
      }),
    ]);

    const todaySales = todaySalesAgg._sum.total ?? 0;
    const totalSales = totalSalesAgg._sum.total ?? 0;
    const remainingStock = remainingStockAgg._sum.stock ?? 0;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // 3. Last 7 Days Chart data
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];

    const last7DaysChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayOrders = await prisma.order.findMany({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        select: { total: true },
      });

      const daySales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const dayName = thaiDays[d.getDay()];
      const dateNum = d.getDate();
      const monthName = thaiMonths[d.getMonth()];

      last7DaysChart.push({
        date: d.toISOString().split('T')[0],
        day: dayName,
        label: `${dayName} ${dateNum} ${monthName}`,
        sales: daySales,
        orders: dayOrders.length,
      });
    }

    // 4. Daily Chart data (last 30 days daily breakdown)
    const dailyChart = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayOrders = await prisma.order.findMany({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        select: { total: true },
      });

      const daySales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      dailyChart.push({
        date: d.toISOString().split('T')[0],
        label: `${d.getDate()} ${thaiMonths[d.getMonth()]}`,
        sales: daySales,
        orders: dayOrders.length,
      });
    }

    // 5. Monthly Chart data (past 6 months)
    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const mOrders = await prisma.order.findMany({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: mStart, lte: mEnd },
        },
        select: { total: true },
      });

      const mSales = mOrders.reduce((sum, o) => sum + o.total, 0);
      monthlyChart.push({
        month: thaiMonths[mDate.getMonth()],
        year: mDate.getFullYear() + 543, // Buddhist era
        label: `${thaiMonths[mDate.getMonth()]} ${mDate.getFullYear() + 543}`,
        sales: mSales,
        orders: mOrders.length,
      });
    }

    // 6. Best Sellers (Top 5 active products by sold count)
    const bestSellers = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sold: 'desc' },
      take: 5,
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // 7. Recent Orders (Latest 10 orders)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      totalOrders,
      todayOrders,
      todaySales,
      totalSales,
      totalProducts,
      remainingStock,
      averageOrderValue,
      lowStockCount,
      dailyChart,
      last7DaysChart,
      monthlyChart,
      bestSellers,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดสถิติร้านค้า' },
      { status: 500 }
    );
  }
}

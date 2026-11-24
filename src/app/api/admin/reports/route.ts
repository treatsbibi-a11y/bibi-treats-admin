import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const where: Prisma.OrderWhereInput = {};

    // Filter by status if provided (default: exclude CANCELLED from sales analytics unless asked)
    if (status && status !== 'ALL' && status !== 'all') {
      where.status = status;
    } else if (!status) {
      where.status = { not: 'CANCELLED' };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalItemsSold = orders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );
    const averageOrderValue = totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0;

    // Aggregate by product
    const productMap = new Map<string, { productName: string; quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId || item.productName;
        const current = productMap.get(key) || {
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.subtotal;
        productMap.set(key, current);
      }
    }

    const productBreakdown = Array.from(productMap.values()).sort(
      (a, b) => b.quantity - a.quantity
    );

    return NextResponse.json({
      summary: {
        totalOrders,
        totalSales,
        totalItemsSold,
        averageOrderValue,
      },
      productBreakdown,
      orders,
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างรายงานยอดขาย' },
      { status: 500 }
    );
  }
}

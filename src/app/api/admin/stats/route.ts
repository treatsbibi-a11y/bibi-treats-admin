export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getD1Orders, getD1Products } from '@/lib/d1';
import { resolveD1Binding } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const d1Binding = resolveD1Binding();

    const now = new Date();
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];

    let allOrders: any[] = [];
    let allProducts: any[] = [];

    try {
      [allOrders, allProducts] = await Promise.all([
        getD1Orders({ d1Binding }),
        getD1Products({ d1Binding }),
      ]);
    } catch (e) {
      console.warn('Failed to load orders/products from D1:', e);
    }

    const validOrders = allOrders.filter(o => o.status !== 'CANCELLED');
    const todayStr = now.toDateString();
    const todayOrdersList = validOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr);

    const totalOrders = validOrders.length;
    const todayOrders = todayOrdersList.length;
    const todaySales = todayOrdersList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalProducts = allProducts.length;
    const remainingStock = allProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const lowStockCount = allProducts.filter(p => Number(p.stock || 0) <= 10).length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // Last 7 Days Chart
    const last7DaysChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStr = d.toDateString();
      const dayOrders = validOrders.filter(o => new Date(o.createdAt).toDateString() === dStr);
      const daySales = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
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

    // Daily Chart (30 days)
    const dailyChart = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStr = d.toDateString();
      const dayOrders = validOrders.filter(o => new Date(o.createdAt).toDateString() === dStr);
      const daySales = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      dailyChart.push({
        date: d.toISOString().split('T')[0],
        label: `${d.getDate()} ${thaiMonths[d.getMonth()]}`,
        sales: daySales,
        orders: dayOrders.length,
      });
    }

    // Monthly Chart (past 6 months)
    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonth = mDate.getMonth();
      const targetYear = mDate.getFullYear();

      const mOrders = validOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === targetMonth && orderDate.getFullYear() === targetYear;
      });
      const mSales = mOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      monthlyChart.push({
        month: thaiMonths[targetMonth],
        year: targetYear + 543,
        label: `${thaiMonths[targetMonth]} ${targetYear + 543}`,
        sales: mSales,
        orders: mOrders.length,
      });
    }

    // Best Sellers (Top 5 products by sold count)
    const bestSellers = [...allProducts]
      .sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        sold: Number(p.sold) || 0,
        revenue: (Number(p.sold) || 0) * (Number(p.price) || 0),
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        imageUrl: p.images?.[0]?.imageUrl || '',
        images: p.images || [],
      }));

    // Recent Orders (Top 10)
    const recentOrders = allOrders.slice(0, 10);

    // Kitchen Prep Summary (Active orders waiting to be prepared/baked: CONFIRMED, SLIP_UPLOADED, PREPARING)
    const activePrepOrders = allOrders.filter(o =>
      ['CONFIRMED', 'SLIP_UPLOADED', 'PREPARING'].includes(o.status)
    );

    const prepMap = new Map<string, { name: string; quantity: number; orderCount: number }>();
    for (const order of activePrepOrders) {
      if (!order.items || !Array.isArray(order.items)) continue;
      for (const item of order.items) {
        const name = (item.productName || item.product?.name || 'ขนมไม่ระบุชื่อ').trim();
        const qty = Number(item.quantity) || 1;
        if (!prepMap.has(name)) {
          prepMap.set(name, { name, quantity: 0, orderCount: 0 });
        }
        const entry = prepMap.get(name)!;
        entry.quantity += qty;
        entry.orderCount += 1;
      }
    }
    const kitchenPrepItems = Array.from(prepMap.values()).sort((a, b) => b.quantity - a.quantity);
    const totalKitchenPrepQuantity = kitchenPrepItems.reduce((sum, i) => sum + i.quantity, 0);

    const kitchenPrep = {
      totalItems: totalKitchenPrepQuantity,
      totalOrders: activePrepOrders.length,
      items: kitchenPrepItems,
    };

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
      allOrders,
      kitchenPrep,
      overview: {
        totalOrders,
        todayOrders,
        todaySales,
        totalSales,
        totalProducts,
        remainingStock,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({
      totalOrders: 0,
      todayOrders: 0,
      todaySales: 0,
      totalSales: 0,
      totalProducts: 0,
      remainingStock: 0,
      averageOrderValue: 0,
      lowStockCount: 0,
      dailyChart: [],
      last7DaysChart: [],
      monthlyChart: [],
      bestSellers: [],
      recentOrders: [],
      overview: {
        totalOrders: 0,
        todayOrders: 0,
        todaySales: 0,
        totalSales: 0,
        totalProducts: 0,
        remainingStock: 0,
        lowStockCount: 0,
      },
    });
  }
}

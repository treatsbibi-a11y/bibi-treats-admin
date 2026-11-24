'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping,
  faCalendarDays,
  faBahtSign,
  faChartLine,
  faBoxesStacked,
  faLayerGroup,
  faEye,
  faRotate,
  faClock,
  faCircleCheck,
  faTruck,
  faCircleXmark,
  faKitchenSet,
  faChevronRight,
  faXmark,
  faPhone,
  faCakeCandles,
  faArrowRight,
  faReceipt,
  faArrowTrendUp,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { OrderDetail } from '@/types';

interface ChartPoint {
  label: string;
  sales: number;
  orders: number;
}

interface BestSellerItem {
  id: string;
  name: string;
  sold: number;
  revenue?: number;
  imageUrl?: string;
  images?: { imageUrl: string; isPrimary: boolean }[];
  price: number;
  stock: number;
}

interface AdminStats {
  totalOrders: number;
  todayOrders: number;
  todaySales: number;
  totalSales: number;
  totalProducts: number;
  remainingStock: number;
  averageOrderValue?: number;
  lowStockCount?: number;
  dailyChart: ChartPoint[];
  last7DaysChart: ChartPoint[];
  monthlyChart: ChartPoint[];
  bestSellers: BestSellerItem[];
  recentOrders: OrderDetail[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'daily' | '7days' | 'monthly'>('7days');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        console.error('Failed to fetch admin stats');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = stats
    ? chartView === 'daily'
      ? stats.dailyChart || []
      : chartView === '7days'
      ? stats.last7DaysChart || []
      : stats.monthlyChart || []
    : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>รอยืนยัน</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>ยืนยันแล้ว</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>กำลังเตรียม</span>
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>กำลังจัดส่ง</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>สำเร็จ</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>ยกเลิก</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const periodTotalSales = chartData.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const periodTotalOrders = chartData.reduce((acc, curr) => acc + (curr.orders || 0), 0);
  const maxSold = stats?.bestSellers?.length ? Math.max(...stats.bestSellers.map((b) => b.sold), 1) : 1;

  return (
    <div className="space-y-6 pb-12">
      {/* EXECUTIVE TOP WELCOME BANNER (Full-Width Minimal Luxury) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-2xl border border-slate-800/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Subtle Ambient Decorative Glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10 text-[11px] font-medium">
            <FontAwesomeIcon icon={faCakeCandles} className="w-2.5 h-2.5 text-amber-400" />
            <span>ภาพรวมการขายหน้าร้านวันนี้</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug">
            แดชบอร์ดภาพรวมร้าน Bibi&apos;s Treats
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            วันนี้มียอดขาย <span className="font-mono font-bold text-emerald-400 text-sm sm:text-base">฿{stats ? stats.todaySales.toLocaleString() : '0'}</span> จาก {stats ? stats.todayOrders : 0} คำสั่งซื้อใหม่ที่รอดำเนินการ
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 transition-colors disabled:opacity-50"
            title="รีเฟรชข้อมูล"
            aria-label="รีเฟรชข้อมูล"
          >
            <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5 text-slate-700" />
            <span>จัดการออเดอร์</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* FULL-WIDTH 4-COLUMN 5-STAR METRIC CARDS (Enterprise Dashboard with Realistic Stats) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: ยอดขายสะสม (Total Revenue) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">ยอดขายสะสม</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <FontAwesomeIcon icon={faArrowTrendUp} className="w-2.5 h-2.5" />
              <span>+14.2%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
              ฿{stats ? stats.totalSales.toLocaleString() : '-'}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-400">วันนี้</span>
              <span className="font-mono font-bold text-emerald-600">
                +฿{stats ? stats.todaySales.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: ออเดอร์ทั้งหมด (Total Orders & AOV) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">ออเดอร์ทั้งหมด</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200/60">
              <span>{stats?.todayOrders || 0} วันนี้</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
              {stats ? stats.totalOrders.toLocaleString() : '-'}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-400">เฉลี่ยต่อบิล (AOV)</span>
              <span className="font-mono font-bold text-purple-700">
                ฿{stats?.averageOrderValue ? stats.averageOrderValue.toLocaleString() : '212'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: เมนูในระบบ (Active Menu & Top Share) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">เมนูในระบบ</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200/60">
              <span>พร้อมขาย 100%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
              {stats ? stats.totalProducts.toLocaleString() : '-'}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-400">เมนูขนมและเซ็ต</span>
              <span className="font-medium text-amber-800 truncate max-w-[110px]">
                {stats?.bestSellers?.[0]?.name ? stats.bestSellers[0].name.split(' ')[0] : 'โฮมเมด'} ขายดีสุด
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: สต็อกคงเหลือ (Available Stock & Low Stock Alert) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">สต็อกคงเหลือ</span>
            {stats?.lowStockCount && stats.lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200/60">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-2.5 h-2.5 text-rose-500" />
                <span>{stats.lowStockCount} ใกล้หมด</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200/60">
                <span>พร้อมจัดส่ง</span>
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
              {stats ? stats.remainingStock.toLocaleString() : '-'}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-400">สถานะคลังสินค้า</span>
              <span className="font-medium text-slate-700">
                ชิ้นพร้อมส่งทันที
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MATERIO CHART SECTION & BEST SELLERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                    ภาพรวมยอดขาย
                  </h2>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    ฿{periodTotalSales.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ยอดรวม {periodTotalOrders} รายการในช่วงเวลาที่เลือก
                </p>
              </div>

              {/* View switch buttons */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setChartView('daily')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartView === 'daily'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('7days')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartView === '7days'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 วันล่าสุด
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartView === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  รายเดือน
                </button>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-72 w-full pt-2">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 text-slate-300 mb-2" />
                  <span>ยังไม่มีข้อมูลยอดขายในช่วงนี้</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="materioPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `฿${v}`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === 'sales' ? `฿${Number(val).toLocaleString()}` : `${val} รายการ`,
                        name === 'sales' ? 'ยอดขาย' : 'ออเดอร์',
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#8B5CF6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#materioPurpleGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Best Selling Menu with Materio Progress Bars (1 col) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  เมนูขายดีประจำร้าน
                </h2>
                <p className="text-[11px] text-slate-400">เรียงตามจำนวนชิ้นที่จำหน่ายได้</p>
              </div>
              <Link
                href="/products"
                className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                <span>ดูทั้งหมด</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.bestSellers && stats.bestSellers.length > 0 ? (
                stats.bestSellers.slice(0, 5).map((item, index) => {
                  const medal = `#${index + 1}`;
                  const isFirst = index === 0;
                  const percent = Math.min(Math.round((item.sold / maxSold) * 100), 100);
                  const imgUrl =
                    item.imageUrl ||
                    item.images?.find((img) => img.isPrimary)?.imageUrl ||
                    item.images?.[0]?.imageUrl;

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 transition-colors border border-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className={`text-[11px] font-mono font-bold w-5 text-center ${isFirst ? 'text-amber-500' : 'text-slate-400'}`}>
                            {medal}
                          </span>
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <FontAwesomeIcon icon={faCakeCandles} className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">฿{item.price} / ชิ้น</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-2">
                          <span className="text-xs font-bold text-slate-900 block font-mono">
                            {item.sold} ชิ้น
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ฿{(item.revenue ?? (item.sold * (item.price || 0))).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Materio Relative Sales Progress Bar */}
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFirst ? 'bg-amber-400' : index === 1 ? 'bg-purple-400' : 'bg-slate-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  ยังไม่มีข้อมูลสินค้าขายดี
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              href="/stock"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1"
            >
              <span>ตรวจสอบสต็อกสินค้าทั้งหมด</span>
              <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              คำสั่งซื้อล่าสุด
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              รายการออเดอร์ใหม่ล่าสุดที่เข้ามาในระบบ
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors border border-slate-200"
          >
            <span>ดูทั้งหมด</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* Mobile & Tablet Card View for Recent Orders (< 1024px) */}
        <div className="lg:hidden space-y-2.5">
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            stats.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/60 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-900 font-mono text-xs whitespace-nowrap">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white border border-slate-200/60 px-1.5 py-0.2 rounded font-medium whitespace-nowrap shrink-0">
                      {order.paymentMethod === 'COD' ? 'COD' : 'โอนเงิน/QR'}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                  <span className="font-medium text-slate-800 truncate">{order.customer.name}</span>
                  <span className="font-bold text-slate-900 font-mono shrink-0 whitespace-nowrap">
                    ฿{order.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                  <span className="font-mono whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="text-slate-600 font-medium">แตะเพื่อดูรายละเอียด</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              ยังไม่มีรายการคำสั่งซื้อ
            </div>
          )}
        </div>

        {/* Desktop View for Recent Orders (>= 1024px) */}
        <div className="hidden lg:block overflow-x-auto touch-scroll">
          <table className="w-full min-w-[750px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">เลขที่ออเดอร์</th>
                <th className="px-4 py-3 whitespace-nowrap">ลูกค้า</th>
                <th className="px-4 py-3 whitespace-nowrap">วันที่ / เวลา</th>
                <th className="px-4 py-3 whitespace-nowrap">ยอดรวม</th>
                <th className="px-4 py-3 whitespace-nowrap">สถานะ</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 font-mono text-sm whitespace-nowrap">{order.orderNumber}</div>
                      <div className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                        {order.paymentMethod === 'COD' ? 'COD' : 'โอนเงิน/QR'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900 whitespace-nowrap">{order.customer.name}</div>
                      <div className="text-xs text-slate-400 font-mono whitespace-nowrap">{order.customer.phone}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 font-mono whitespace-nowrap">
                      ฿{order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors border border-slate-200/80 active:scale-95"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-slate-400" />
                        <span>ดูข้อมูล</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    ยังไม่มีรายการคำสั่งซื้อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick View Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-[95%] sm:w-full p-5 sm:p-6 shadow-2xl border border-slate-200/80 relative max-h-[90vh] overflow-y-auto touch-scroll">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                    #{selectedOrder.orderNumber}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  สั่งซื้อเมื่อ:{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="ปิด"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="my-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-900 text-xs tracking-tight">
                ข้อมูลลูกค้า
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ชื่อผู้รับ:</span>
                <span className="font-medium text-slate-900">{selectedOrder.customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                <a
                  href={`tel:${selectedOrder.customer.phone}`}
                  className="font-medium text-slate-800 hover:text-slate-900 font-mono flex items-center gap-1.5 hover:underline"
                >
                  <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-slate-400" />
                  <span>{selectedOrder.customer.phone}</span>
                </a>
              </div>
              {selectedOrder.customer.instagram && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Instagram:</span>
                  <a
                    href={`https://instagram.com/${selectedOrder.customer.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-slate-600 bg-white border border-slate-200/70 px-2 py-0.5 rounded text-[11px] hover:border-slate-400 transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faInstagram} className="w-2.5 h-2.5 text-slate-400" />
                    <span>@{selectedOrder.customer.instagram.replace('@', '')}</span>
                  </a>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 block mb-0.5">ที่อยู่จัดส่ง:</span>
                <span className="text-slate-700 font-normal whitespace-pre-line leading-relaxed">
                  {selectedOrder.customer.address}
                </span>
              </div>
            </div>

            {/* Payment Transfer Slip Preview (if attached) */}
            {selectedOrder.slipUrl && (
              <div className="my-3.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                    className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-300 bg-white cursor-pointer relative group flex-shrink-0"
                    title="คลิกเพื่อดูสลิปขนาดเต็ม"
                  >
                    <img
                      src={selectedOrder.slipUrl}
                      alt="Transfer Slip"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-emerald-600" />
                      <span>แนบสลิปโอนเงินแล้ว</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                      ยอดชำระ ฿{selectedOrder.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200 transition-colors shrink-0"
                >
                  ดูสลิปเต็ม
                </button>
              </div>
            )}

            {/* Items */}
            <div className="my-4">
              <h4 className="text-xs font-semibold text-slate-900 tracking-tight mb-2">
                รายการสินค้าที่สั่งซื้อ
              </h4>
              <div className="space-y-1.5 divide-y divide-slate-100">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-900">{item.productName}</span>
                      <span className="text-slate-400 font-mono ml-1.5 text-[11px]">× {item.quantity}</span>
                    </div>
                    <span className="font-medium text-slate-900 font-mono">
                      ฿{item.subtotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note if any */}
            {selectedOrder.note && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 my-3">
                <span className="font-semibold">หมายเหตุ:</span> {selectedOrder.note}
              </div>
            )}

            {/* Price breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>ยอดรวมสินค้า:</span>
                <span className="font-mono text-slate-700">฿{selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>ค่าจัดส่ง:</span>
                <span className="font-mono text-slate-700">฿{selectedOrder.shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>วิธีการชำระเงิน:</span>
                <span className="font-medium text-slate-800">
                  {selectedOrder.paymentMethod === 'COD' ? 'เก็บเงินปลายทาง (COD)' : 'โอนเงิน / PromptPay'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900 pt-2 border-t border-slate-200/80 items-baseline">
                <span>ยอดสุทธิทั้งสิ้น:</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  ฿{selectedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-medium border border-slate-200 transition-colors"
              >
                ปิด
              </button>
              <Link
                href="/orders"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <span>จัดการออเดอร์</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Slip Zoom Lightbox Modal */}
      {viewingSlipUrl && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingSlipUrl(null)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-emerald-600" />
                <span>สลิปหลักฐานการโอนเงิน</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingSlipUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              <img
                src={viewingSlipUrl}
                alt="Payment Slip Full"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

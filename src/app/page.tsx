'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping,
  faBahtSign,
  faChartLine,
  faBoxesStacked,
  faEye,
  faRotate,
  faChevronRight,
  faPhone,
  faCakeCandles,
  faArrowRight,
  faReceipt,
  faTriangleExclamation,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import type { SalesChartPoint } from '@/components/charts/SalesAreaChart';
import { OrderDetail } from '@/types';

const SalesAreaChart = dynamic(
  () => import('@/components/charts/SalesAreaChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded bg-surface-secondary animate-pulse flex items-center justify-center text-xs text-ink-muted">
        กำลังโหลดกราฟยอดขาย...
      </div>
    ),
  }
);

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
  dailyChart: SalesChartPoint[];
  last7DaysChart: SalesChartPoint[];
  monthlyChart: SalesChartPoint[];
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

  const chartData = useMemo(() => {
    if (!stats) return [];
    if (chartView === 'daily') return stats.dailyChart || [];
    if (chartView === '7days') return stats.last7DaysChart || [];
    return stats.monthlyChart || [];
  }, [stats, chartView]);

  const periodTotalSales = chartData.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const periodTotalOrders = chartData.reduce((acc, curr) => acc + (curr.orders || 0), 0);
  const maxSold = stats?.bestSellers?.length
    ? Math.max(...stats.bestSellers.map((b) => b.sold), 1)
    : 1;

  const recentOrderColumns: DataTableColumn<OrderDetail>[] = [
    {
      key: 'orderNumber',
      header: 'เลขที่ออเดอร์',
      sortable: true,
      sortValue: (o) => o.orderNumber,
      render: (order) => (
        <div>
          <div className="font-semibold text-ink font-mono-num text-[13px]">
            #{order.orderNumber}
          </div>
          <div className="text-[11px] text-ink-muted">
            {order.paymentMethod === 'COD' ? 'เก็บเงินปลายทาง (COD)' : 'โอนเงิน / QR'}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'ลูกค้า',
      sortable: true,
      sortValue: (o) => o.customer?.name || '',
      render: (order) => (
        <div>
          <div className="font-medium text-ink">{order.customer?.name || 'ลูกค้าทั่วไป'}</div>
          <div className="text-[11px] text-ink-muted font-mono-num">
            {order.customer?.phone || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'วันที่ / เวลา',
      sortable: true,
      sortValue: (o) => new Date(o.createdAt).getTime(),
      render: (order) => (
        <span className="text-xs text-ink-secondary font-mono-num whitespace-nowrap">
          {new Date(order.createdAt || Date.now()).toLocaleString('th-TH', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'ยอดรวม',
      align: 'right',
      sortable: true,
      sortValue: (o) => o.total ?? 0,
      render: (order) => (
        <span className="font-semibold text-ink font-mono-num whitespace-nowrap">
          ฿{(order.total ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      sortable: true,
      sortValue: (o) => o.status,
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'actions',
      header: 'การจัดการ',
      align: 'right',
      render: (order) => (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
          }}
        >
          <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-ink-muted" />
          <span>ดูข้อมูล</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Clean Gentelella Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            แดชบอร์ดภาพรวมร้าน Bibi&apos;s Treats
          </h1>
          <p className="text-xs sm:text-[13px] text-ink-secondary mt-0.5">
            วันนี้มียอดขาย{' '}
            <span className="font-mono-num font-semibold text-primary-text">
              ฿{(stats?.todaySales ?? 0).toLocaleString()}
            </span>{' '}
            จาก{' '}
            <span className="font-mono-num font-semibold text-ink">
              {(stats?.todayOrders ?? 0).toLocaleString()}
            </span>{' '}
            คำสั่งซื้อวันนี้
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <FontAwesomeIcon
              icon={faRotate}
              className={`w-3.5 h-3.5 text-ink-muted ${loading ? 'animate-spin' : ''}`}
            />
            <span>รีเฟรช</span>
          </Button>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 rounded bg-primary hover:bg-primary-dk text-white text-xs font-medium shadow-subtle transition-colors"
          >
            <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5" />
            <span>จัดการออเดอร์</span>
          </Link>
        </div>
      </div>

      {/* 4-Column High-Density Gentelella KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Revenue */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              ยอดขายสะสม
            </span>
            <div className="w-7 h-7 rounded bg-primary-lt text-primary-text flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faBahtSign} className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold font-mono-num text-ink tracking-tight">
              ฿{(stats?.totalSales ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-border-light text-[11px]">
              <span className="text-ink-muted">ยอดขายวันนี้</span>
              <span className="font-mono-num font-semibold text-semantic-green">
                +฿{(stats?.todaySales ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Total Orders & AOV */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              ออเดอร์ทั้งหมด
            </span>
            <Badge variant="purple" size="sm">
              <span className="font-mono-num">{stats?.todayOrders ?? 0} วันนี้</span>
            </Badge>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold font-mono-num text-ink tracking-tight">
              {(stats?.totalOrders ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-border-light text-[11px]">
              <span className="text-ink-muted">เฉลี่ยต่อบิล (AOV)</span>
              <span className="font-mono-num font-semibold text-ink">
                ฿{(stats?.averageOrderValue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3: Products Count */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              เมนูในระบบ
            </span>
            <div className="w-7 h-7 rounded bg-semantic-blue-lt text-semantic-blue flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faUtensils} className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold font-mono-num text-ink tracking-tight">
              {(stats?.totalProducts ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-border-light text-[11px] gap-2">
              <span className="text-ink-muted shrink-0">ขายดีอันดับ 1</span>
              <span className="font-medium text-ink-secondary truncate">
                {stats?.bestSellers?.[0]?.name || '-'}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 4: Remaining Stock & Low Stock Alert */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              สต็อกคงเหลือ
            </span>
            {stats?.lowStockCount && stats.lowStockCount > 0 ? (
              <Badge variant="danger" size="sm">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-2.5 h-2.5" />
                <span className="font-mono-num">{stats.lowStockCount} ใกล้หมด</span>
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                <span>สต็อกปกติ</span>
              </Badge>
            )}
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold font-mono-num text-ink tracking-tight">
              {(stats?.remainingStock ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-border-light text-[11px]">
              <span className="text-ink-muted">คลังสินค้าทั้งหมด</span>
              <Link
                href="/stock"
                className="font-medium text-primary-text hover:underline inline-flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faBoxesStacked} className="w-2.5 h-2.5" />
                <span>จัดการสต็อก</span>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart + Best Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Overview Chart (2 cols) */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-ink">ภาพรวมยอดขาย</h2>
                <span className="font-mono-num text-xs font-semibold text-primary-text bg-primary-lt px-2 py-0.5 rounded-sm">
                  ฿{periodTotalSales.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                ยอดรวม {periodTotalOrders.toLocaleString()} รายการในช่วงเวลาที่เลือก
              </p>
            </div>

            <div className="inline-flex p-0.5 bg-surface-secondary rounded border border-surface-border text-xs">
              {(
                [
                  { key: 'daily', label: '30 วัน' },
                  { key: '7days', label: '7 วันล่าสุด' },
                  { key: 'monthly', label: 'รายเดือน' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setChartView(tab.key)}
                  className={`px-2.5 py-1 rounded-sm transition-colors ${
                    chartView === tab.key
                      ? 'bg-surface text-ink font-semibold shadow-subtle'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardBody className="flex-1">
            {chartData.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-ink-muted text-xs">
                <FontAwesomeIcon icon={faChartLine} className="w-7 h-7 mb-2 opacity-40" />
                <span>ยังไม่มีข้อมูลยอดขายในช่วงนี้</span>
              </div>
            ) : (
              <SalesAreaChart data={chartData} gradientId="dashboardSalesArea" />
            )}
          </CardBody>
        </Card>

        {/* Best Sellers Card (1 col) */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">เมนูขายดีประจำร้าน</h2>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  เรียงตามจำนวนชิ้นที่จำหน่ายได้
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs text-primary-text hover:underline font-medium inline-flex items-center gap-1 shrink-0"
              >
                <span>ดูทั้งหมด</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
              </Link>
            </CardHeader>

            <CardBody className="space-y-2.5">
              {stats?.bestSellers && stats.bestSellers.length > 0 ? (
                stats.bestSellers.slice(0, 5).map((item, index) => {
                  const percent = Math.min(Math.round((item.sold / maxSold) * 100), 100);
                  const imgUrl =
                    item.imageUrl ||
                    item.images?.find((img) => img.isPrimary)?.imageUrl ||
                    item.images?.[0]?.imageUrl;

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-surface-secondary/70 border border-surface-border-light"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-[11px] font-mono-num font-semibold w-5 text-center shrink-0 ${
                              index === 0 ? 'text-primary-text' : 'text-ink-muted'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <div className="w-9 h-9 rounded overflow-hidden bg-surface border border-surface-border shrink-0">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink-disabled">
                                <FontAwesomeIcon icon={faCakeCandles} className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{item.name}</p>
                            <p className="text-[11px] text-ink-muted font-mono-num">
                              ฿{item.price} / ชิ้น
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="text-xs font-semibold text-ink block font-mono-num">
                            {item.sold} ชิ้น
                          </span>
                          <span className="text-[10px] text-ink-muted font-mono-num">
                            ฿{(item.revenue ?? item.sold * (item.price || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-surface-border-light h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            index === 0
                              ? 'bg-primary'
                              : index === 1
                              ? 'bg-semantic-blue'
                              : 'bg-ink-muted/60'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-ink-muted text-xs">
                  ยังไม่มีข้อมูลสินค้าขายดี
                </div>
              )}
            </CardBody>
          </div>

          <CardFooter className="text-center py-2.5">
            <Link
              href="/stock"
              className="text-xs text-ink-secondary hover:text-ink font-medium inline-flex items-center gap-1"
            >
              <span>ตรวจสอบสต็อกสินค้าทั้งหมด</span>
              <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 text-ink-muted" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">คำสั่งซื้อล่าสุด</h2>
            <p className="text-xs text-ink-muted">รายการออเดอร์ใหม่ล่าสุดที่เข้ามาในระบบ</p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink bg-surface px-3 py-1.5 rounded border border-surface-border transition-colors"
          >
            <span>ดูทั้งหมด</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-ink-muted" />
          </Link>
        </div>

        {/* Mobile Card List (< lg) */}
        <div className="lg:hidden space-y-2.5">
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            stats.recentOrders.slice(0, 5).map((order) => (
              <Card
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-3.5 cursor-pointer hover:bg-surface-secondary/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-ink font-mono-num text-xs">
                      #{order.orderNumber}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {order.paymentMethod === 'COD' ? 'COD' : 'โอนเงิน/QR'}
                    </Badge>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-medium text-ink truncate">
                    {order.customer?.name || 'ลูกค้าทั่วไป'}
                  </span>
                  <span className="font-semibold text-ink font-mono-num shrink-0">
                    ฿{(order.total ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1.5 border-t border-surface-border-light">
                  <span className="font-mono-num">
                    {new Date(order.createdAt || Date.now()).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="text-primary-text font-medium">แตะเพื่อดูรายละเอียด</span>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-ink-muted text-xs">
              ยังไม่มีรายการคำสั่งซื้อ
            </Card>
          )}
        </div>

        {/* Desktop DataTable (>= lg) */}
        <div className="hidden lg:block">
          <DataTable
            data={stats?.recentOrders ?? []}
            columns={recentOrderColumns}
            rowKey={(o) => o.id}
            onRowClick={(o) => setSelectedOrder(o)}
            loading={loading}
            emptyMessage="ยังไม่มีรายการคำสั่งซื้อ"
            defaultPageSize={10}
          />
        </div>
      </div>

      {/* Quick View Order Detail Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        mobileSheet
        size="md"
        title={
          selectedOrder ? (
            <span className="inline-flex items-center gap-2 font-mono-num">
              <span>#{selectedOrder.orderNumber}</span>
              <OrderStatusBadge status={selectedOrder.status} />
            </span>
          ) : undefined
        }
        subtitle={
          selectedOrder ? (
            <span className="font-mono-num">
              สั่งซื้อเมื่อ:{' '}
              {new Date(selectedOrder.createdAt).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          ) : undefined
        }
        footer={
          selectedOrder ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                ปิด
              </Button>
              <Link
                href={`/orders?search=${encodeURIComponent(selectedOrder.orderNumber)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 h-8 rounded bg-primary hover:bg-primary-dk text-white text-xs font-medium shadow-subtle transition-colors"
              >
                <span>จัดการในหน้าออเดอร์</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
              </Link>
            </>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            {/* Customer Info */}
            <div className="p-3.5 rounded bg-surface-secondary border border-surface-border-light space-y-2">
              <div className="font-semibold text-ink">ข้อมูลลูกค้า</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-muted">ชื่อผู้รับ:</span>
                <span className="font-medium text-ink">{selectedOrder.customer.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-muted">เบอร์โทรศัพท์:</span>
                <a
                  href={`tel:${selectedOrder.customer.phone}`}
                  className="font-medium text-ink hover:text-primary-text font-mono-num inline-flex items-center gap-1.5 hover:underline"
                >
                  <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-ink-muted" />
                  <span>{selectedOrder.customer.phone}</span>
                </a>
              </div>
              {selectedOrder.customer.instagram && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-muted">Instagram:</span>
                  <a
                    href={`https://instagram.com/${selectedOrder.customer.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-ink-secondary bg-surface border border-surface-border px-2 py-0.5 rounded-sm text-[11px] inline-flex items-center gap-1.5 hover:border-primary"
                  >
                    <FontAwesomeIcon icon={faInstagram} className="w-2.5 h-2.5" />
                    <span>@{selectedOrder.customer.instagram.replace('@', '')}</span>
                  </a>
                </div>
              )}
              <div className="pt-2 border-t border-surface-border-light">
                <span className="text-ink-muted block mb-0.5">ที่อยู่จัดส่ง:</span>
                <span className="text-ink-secondary whitespace-pre-line leading-relaxed">
                  {selectedOrder.customer.address}
                </span>
              </div>
            </div>

            {/* Payment Slip Preview */}
            {selectedOrder.slipUrl && (
              <div className="p-3 rounded bg-semantic-green-lt border border-semantic-green/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                    className="w-11 h-11 rounded overflow-hidden border border-semantic-green/40 bg-white shrink-0"
                    title="คลิกเพื่อดูสลิปขนาดเต็ม"
                  >
                    <img
                      src={selectedOrder.slipUrl}
                      alt="Transfer Slip"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="min-w-0">
                    <div className="font-semibold text-semantic-green flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faReceipt} className="w-3 h-3" />
                      <span>แนบสลิปโอนเงินแล้ว</span>
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5 font-mono-num">
                      ยอดชำระ ฿{(selectedOrder.total ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                >
                  ดูสลิปเต็ม
                </Button>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-ink mb-2">รายการสินค้าที่สั่งซื้อ</h4>
              <div className="divide-y divide-surface-border-light border border-surface-border-light rounded">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-ink">{item.productName}</span>
                      <span className="text-ink-muted font-mono-num ml-1.5 text-[11px]">
                        × {item.quantity}
                      </span>
                    </div>
                    <span className="font-medium text-ink font-mono-num shrink-0">
                      ฿{(item.subtotal ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.note && (
              <div className="p-2.5 rounded bg-semantic-yellow-lt border border-semantic-yellow/30 text-ink">
                <span className="font-semibold">หมายเหตุ:</span> {selectedOrder.note}
              </div>
            )}

            {/* Breakdown */}
            <div className="pt-2.5 border-t border-surface-border-light space-y-1">
              <div className="flex justify-between text-ink-muted">
                <span>ยอดรวมสินค้า:</span>
                <span className="font-mono-num text-ink-secondary">
                  ฿{(selectedOrder.subtotal ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>ค่าจัดส่ง:</span>
                <span className="font-mono-num text-ink-secondary">
                  ฿{(selectedOrder.shippingFee ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>วิธีการชำระเงิน:</span>
                <span className="font-medium text-ink">
                  {selectedOrder.paymentMethod === 'COD'
                    ? 'เก็บเงินปลายทาง (COD)'
                    : 'โอนเงิน / PromptPay'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-ink pt-2 border-t border-surface-border-light items-baseline">
                <span>ยอดสุทธิทั้งสิ้น:</span>
                <span className="text-base font-bold font-mono-num text-primary-text">
                  ฿{(selectedOrder.total ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Slip Zoom Lightbox Modal */}
      <Modal
        isOpen={Boolean(viewingSlipUrl)}
        onClose={() => setViewingSlipUrl(null)}
        title={
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-semantic-green" />
            <span>สลิปหลักฐานการโอนเงิน</span>
          </span>
        }
        size="md"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewingSlipUrl(null)}>
            ปิด
          </Button>
        }
      >
        {viewingSlipUrl && (
          <div className="flex items-center justify-center bg-surface-secondary rounded p-3 border border-surface-border-light">
            <img
              src={viewingSlipUrl}
              alt="Payment Slip Full"
              className="max-w-full max-h-[65vh] object-contain rounded"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

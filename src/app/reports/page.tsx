'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCalendarDays,
  faDownload,
  faPrint,
  faBagShopping,
  faBahtSign,
  faBox,
  faChevronDown,
  faChevronUp,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { showToast } from '@/components/ui/Toast';
import type { SalesChartPoint } from '@/components/charts/SalesAreaChart';
import type { ProductChartPoint } from '@/components/charts/TopProductsBarChart';
import { OrderDetail } from '@/types';

const SalesAreaChart = dynamic(
  () => import('@/components/charts/SalesAreaChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded bg-surface-secondary animate-pulse flex items-center justify-center text-xs text-ink-muted">
        กำลังโหลดกราฟยอดขาย...
      </div>
    ),
  }
);

const TopProductsBarChart = dynamic(
  () => import('@/components/charts/TopProductsBarChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded bg-surface-secondary animate-pulse flex items-center justify-center text-xs text-ink-muted">
        กำลังโหลดกราฟเมนูขายดี...
      </div>
    ),
  }
);

type DatePreset = 'today' | '7days' | 'month' | 'all' | 'custom';

interface ProductSalesRow {
  name: string;
  quantity: number;
  revenue: number;
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [printedAt, setPrintedAt] = useState('');
  const [datesReady, setDatesReady] = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    const now = new Date();
    setEndDate(now.toISOString().split('T')[0]);
    setPrintedAt(now.toLocaleString('th-TH'));
    setDatesReady(true);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('status', 'ALL');

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        const fallback = await fetch('/api/orders');
        if (fallback.ok) {
          const list = await fallback.json();
          setOrders(list);
        }
      }
    } catch (err) {
      console.error('Failed to load orders for report', err);
      showToast({ title: 'โหลดข้อมูลรายงานไม่สำเร็จ', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!datesReady) return;
    fetchOrders();
  }, [datesReady, startDate, endDate]);

  const handleSetPreset = (preset: Exclude<DatePreset, 'custom'>) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    setEndDate(end);
    setActivePreset(preset);

    if (preset === 'today') {
      setStartDate(end);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const validOrders = useMemo(
    () => filteredOrders.filter((o) => o.status !== 'CANCELLED'),
    [filteredOrders]
  );
  const cancelledOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'CANCELLED'),
    [filteredOrders]
  );

  const totalOrdersCount = validOrders.length;
  const totalSalesRevenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalItemsSold = validOrders.reduce(
    (acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );
  const averageOrderValue =
    totalOrdersCount > 0 ? Math.round(totalSalesRevenue / totalOrdersCount) : 0;

  const productSalesList = useMemo<ProductSalesRow[]>(() => {
    const map: Record<string, ProductSalesRow> = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.productName;
        if (!map[name]) {
          map[name] = { name, quantity: 0, revenue: 0 };
        }
        map[name].quantity += item.quantity;
        map[name].revenue += item.subtotal;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [validOrders]);

  const dailySalesChartData = useMemo<SalesChartPoint[]>(() => {
    const byDay = new Map<string, { sales: number; orders: number }>();
    validOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
      const cur = byDay.get(dateKey) || { sales: 0, orders: 0 };
      cur.sales += o.total || 0;
      cur.orders += 1;
      byDay.set(dateKey, cur);
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, val]) => ({
        label: new Date(dateStr).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
        }),
        sales: val.sales,
        orders: val.orders,
      }));
  }, [validOrders]);

  const displayedProductSales = showAllProducts
    ? productSalesList
    : productSalesList.slice(0, 5);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const ordersSheetData = filteredOrders.map((o) => ({
        'เลขที่ออเดอร์': o.orderNumber,
        'วันที่-เวลา': new Date(o.createdAt).toLocaleString('th-TH'),
        'ชื่อลูกค้า': o.customer.name,
        'เบอร์โทรศัพท์': o.customer.phone,
        Instagram: o.customer.instagram || '-',
        'ที่อยู่จัดส่ง': o.customer.address,
        'รายการสินค้า': o.items
          .map((i) => `${i.productName} (x${i.quantity})`)
          .join(', '),
        'ยอดสินค้า (บาท)': o.subtotal,
        'ค่าจัดส่ง (บาท)': o.shippingFee,
        'ยอดรวมสุทธิ (บาท)': o.total,
        'สถานะ': o.status,
        'หมายเหตุ': o.note || '-',
      }));
      const wsOrders = XLSX.utils.json_to_sheet(ordersSheetData);
      XLSX.utils.book_append_sheet(wb, wsOrders, 'รายการคำสั่งซื้อ');

      const productsSheetData = productSalesList.map((p, idx) => ({
        'อันดับ': idx + 1,
        'ชื่อเมนู': p.name,
        'จำนวนที่ขายได้ (ชิ้น)': p.quantity,
        'ยอดขายรวม (บาท)': p.revenue,
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productsSheetData);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'สรุปยอดขายแยกเมนู');

      const summaryData = [
        {
          'หัวข้อสรุป': 'ช่วงเวลาที่เลือก',
          'ข้อมูล': `${startDate || 'เริ่มต้น'} ถึง ${endDate || 'ปัจจุบัน'}`,
        },
        { 'หัวข้อสรุป': 'จำนวนออเดอร์สำเร็จ/ดำเนินการ', 'ข้อมูล': totalOrdersCount },
        { 'หัวข้อสรุป': 'ยอดขายรวมทั้งสิ้น (บาท)', 'ข้อมูล': totalSalesRevenue },
        { 'หัวข้อสรุป': 'จำนวนชิ้นขนมที่ขายได้', 'ข้อมูล': totalItemsSold },
        { 'หัวข้อสรุป': 'ยอดสั่งซื้อเฉลี่ยต่อออเดอร์ (บาท)', 'ข้อมูล': averageOrderValue },
        { 'หัวข้อสรุป': 'จำนวนออเดอร์ที่ยกเลิก', 'ข้อมูล': cancelledOrders.length },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ภาพรวมสรุป');

      const filename = `bibi-treats-sales-report-${endDate || 'latest'}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast({
        title: 'ส่งออกไฟล์ Excel สำเร็จ',
        description: filename,
        variant: 'success',
      });
    } catch (err) {
      console.error('Error exporting Excel', err);
      showToast({ title: 'เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel', variant: 'error' });
    }
  };

  const productColumns: DataTableColumn<ProductSalesRow>[] = [
    {
      key: 'rank',
      header: 'อันดับ',
      width: '72px',
      render: (_, idx) => (
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-semibold font-mono-num ${
            idx === 0
              ? 'bg-primary-lt text-primary-text'
              : 'bg-surface-secondary text-ink-muted'
          }`}
        >
          #{idx + 1}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'ชื่อเมนูขนม',
      sortable: true,
      sortValue: (p) => p.name,
      render: (prod) => <span className="font-semibold text-ink">{prod.name}</span>,
    },
    {
      key: 'quantity',
      header: 'จำนวนที่ขายได้',
      align: 'center',
      sortable: true,
      sortValue: (p) => p.quantity,
      render: (prod) => (
        <span className="font-semibold text-ink font-mono-num">{prod.quantity} ชิ้น</span>
      ),
    },
    {
      key: 'revenue',
      header: 'ยอดขายรวม',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.revenue,
      render: (prod) => (
        <span className="font-semibold text-ink font-mono-num">
          ฿{prod.revenue.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'share',
      header: 'สัดส่วนยอดขาย',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.revenue,
      render: (prod) => {
        const share =
          totalSalesRevenue > 0
            ? Math.round((prod.revenue / totalSalesRevenue) * 100)
            : 0;
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="w-20 bg-surface-border-light h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.max(share, 3)}%` }}
              />
            </div>
            <span className="text-xs text-ink-muted font-mono-num w-9 text-right">
              {share}%
            </span>
          </div>
        );
      },
    },
  ];

  const orderColumns: DataTableColumn<OrderDetail>[] = [
    {
      key: 'orderNumber',
      header: 'เลขที่ออเดอร์',
      sortable: true,
      sortValue: (o) => o.orderNumber,
      render: (o) => (
        <span className="font-mono-num font-semibold text-ink">#{o.orderNumber}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'วันที่',
      sortable: true,
      sortValue: (o) => new Date(o.createdAt).getTime(),
      render: (o) => (
        <span className="text-ink-muted whitespace-nowrap font-mono-num text-xs">
          {new Date(o.createdAt).toLocaleDateString('th-TH')}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'ลูกค้า',
      sortable: true,
      sortValue: (o) => o.customer.name,
      render: (o) => <span className="font-medium text-ink">{o.customer.name}</span>,
    },
    {
      key: 'items',
      header: 'รายการ',
      render: (o) => (
        <span className="text-ink-secondary truncate block max-w-xs text-xs">
          {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'ยอดรวม',
      align: 'right',
      sortable: true,
      sortValue: (o) => o.total,
      render: (o) => (
        <span className="font-mono-num font-semibold text-ink">
          ฿{o.total.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      sortable: true,
      sortValue: (o) => o.status,
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
  ];

  return (
    <div className="space-y-5 pb-8 print:p-0 print:space-y-4">
      {/* Page Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            รายงานยอดขายและสรุปรายรับ
          </h1>
          <p className="text-xs sm:text-[13px] text-ink-secondary mt-0.5">
            เลือกช่วงเวลา วิเคราะห์ยอดขาย และส่งออกข้อมูลเป็น Excel หรือพิมพ์ PDF
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-ink-muted" />
            <span>พิมพ์ / บันทึก PDF</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportExcel}>
            <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <Card className="p-3.5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider hidden sm:inline mr-1">
              ช่วงเวลา:
            </span>
            {(
              [
                { key: 'today', label: 'วันนี้' },
                { key: '7days', label: '7 วันล่าสุด' },
                { key: 'month', label: 'เดือนนี้' },
                { key: 'all', label: 'ทั้งหมด' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSetPreset(preset.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap border ${
                  activePreset === preset.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-secondary text-ink-secondary border-surface-border hover:text-ink'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1.5 rounded border border-surface-border flex-1 sm:flex-initial">
              <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5 text-ink-muted" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent outline-none text-ink text-xs font-mono-num"
              />
            </div>
            <span className="text-ink-muted">ถึง</span>
            <div className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1.5 rounded border border-surface-border flex-1 sm:flex-initial">
              <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5 text-ink-muted" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent outline-none text-ink text-xs font-mono-num"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Printable Header */}
      <div className="hidden print:block pb-3 mb-3 border-b border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Bibi&apos;s Treats - รายงานสรุปยอดขาย
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              ช่วงวันที่:{' '}
              {startDate ? new Date(startDate).toLocaleDateString('th-TH') : 'ตั้งแต่เริ่มต้น'}{' '}
              ถึง {endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ปัจจุบัน'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            พิมพ์เมื่อ: {printedAt || '-'}
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 print:border print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">จำนวนออเดอร์</span>
            <div className="w-8 h-8 rounded bg-semantic-blue-lt text-semantic-blue flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold text-ink font-mono-num">
              {totalOrdersCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              (ยกเลิก {cancelledOrders.length} รายการ)
            </div>
          </div>
        </Card>

        <Card className="p-4 print:border print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">ยอดขายรวมสุทธิ</span>
            <div className="w-8 h-8 rounded bg-primary-lt text-primary-text flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faBahtSign} className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold text-primary-text font-mono-num">
              ฿{totalSalesRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">ในช่วงเวลาที่เลือก</div>
          </div>
        </Card>

        <Card className="p-4 print:border print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">จำนวนขนมที่ขายได้</span>
            <div className="w-8 h-8 rounded bg-semantic-yellow-lt text-semantic-yellow flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold text-ink font-mono-num">
              {totalItemsSold.toLocaleString()}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">ชิ้น ทั้งหมด</div>
          </div>
        </Card>

        <Card className="p-4 print:border print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">ยอดเฉลี่ยต่อออเดอร์</span>
            <div className="w-8 h-8 rounded bg-semantic-purple-lt text-semantic-purple flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-semibold text-ink font-mono-num">
              ฿{averageOrderValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">เฉลี่ย / ตะกร้า</div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Row (Hidden on Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
        <Card>
          <CardHeader>
            <h2 className="text-[15px] font-semibold text-ink">แนวโน้มยอดขายรายวัน</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              สรุปยอดขายสุทธิแยกตามวันที่ในช่วงที่เลือก
            </p>
          </CardHeader>
          <CardBody>
            {dailySalesChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-ink-muted text-xs">
                <FontAwesomeIcon icon={faChartLine} className="w-7 h-7 mb-2 opacity-40" />
                <span>ไม่มีข้อมูลยอดขายในช่วงเวลานี้</span>
              </div>
            ) : (
              <SalesAreaChart
                data={dailySalesChartData}
                heightClass="h-64"
                gradientId="reportsSalesArea"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-[15px] font-semibold text-ink">เมนูทำรายได้สูงสุด</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              เปรียบเทียบยอดขายรวม 6 อันดับแรก
            </p>
          </CardHeader>
          <CardBody>
            {productSalesList.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-ink-muted text-xs">
                <FontAwesomeIcon icon={faTrophy} className="w-7 h-7 mb-2 opacity-40" />
                <span>ไม่มีข้อมูลสินค้าในช่วงเวลานี้</span>
              </div>
            ) : (
              <TopProductsBarChart
                data={productSalesList as ProductChartPoint[]}
                heightClass="h-64"
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Product Sales Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2">
              {!showAllProducts && (
                <FontAwesomeIcon icon={faTrophy} className="w-3.5 h-3.5 text-semantic-yellow" />
              )}
              <span>
                {showAllProducts ? 'สรุปยอดขายแยกตามเมนูขนมทั้งหมด' : '5 อันดับเมนูขายดีที่สุด'}
              </span>
            </h2>
            <p className="text-xs text-ink-muted">
              ประสิทธิภาพยอดขายแต่ละรายการขนมตามช่วงเวลาที่เลือก
            </p>
          </div>
          <Badge variant={showAllProducts ? 'neutral' : 'warning'} size="sm">
            <span className="font-mono-num">
              {showAllProducts
                ? `${productSalesList.length} เมนู`
                : `Top 5 จาก ${productSalesList.length} เมนู`}
            </span>
          </Badge>
        </div>

        {/* Mobile Ranking Cards */}
        <div className="lg:hidden space-y-2.5">
          {displayedProductSales.length > 0 ? (
            displayedProductSales.map((prod, idx) => {
              const share =
                totalSalesRevenue > 0
                  ? Math.round((prod.revenue / totalSalesRevenue) * 100)
                  : 0;
              return (
                <Card key={prod.name} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-semibold font-mono-num bg-surface-secondary text-ink-secondary shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-ink truncate">{prod.name}</div>
                        <div className="text-[11px] text-ink-muted font-mono-num mt-0.5">
                          ขายได้ {prod.quantity} ชิ้น
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono-num font-semibold text-ink">
                        ฿{prod.revenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-ink-muted font-mono-num">
                        {share}% ของยอดขาย
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-surface-border-light h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.max(share, 4)}%` }}
                    />
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-6 text-center text-ink-muted text-xs">
              ไม่มีข้อมูลยอดขายในช่วงเวลาที่เลือก
            </Card>
          )}
        </div>

        {/* Desktop DataTable */}
        <div className="hidden lg:block">
          <DataTable
            data={displayedProductSales}
            columns={productColumns}
            rowKey={(p) => p.name}
            loading={loading}
            emptyMessage="ไม่มีข้อมูลยอดขายในช่วงเวลาที่เลือก"
            showPagination={showAllProducts}
            defaultPageSize={10}
            minWidthClass="min-w-[680px]"
          />
        </div>

        {productSalesList.length > 5 && (
          <div className="flex justify-center print:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAllProducts((s) => !s)}
            >
              <span>
                {showAllProducts
                  ? 'ย่อเหลือ 5 อันดับแรก'
                  : `ดูทั้งหมด (${productSalesList.length} เมนู)`}
              </span>
              <FontAwesomeIcon
                icon={showAllProducts ? faChevronUp : faChevronDown}
                className="w-3 h-3"
              />
            </Button>
          </div>
        )}
      </div>

      {/* Period Orders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">รายการคำสั่งซื้อในช่วงเวลา</h2>
            <p className="text-xs text-ink-muted">รายละเอียดออเดอร์ทั้งหมดตามช่วงเวลา</p>
          </div>
          <Badge variant="neutral" size="sm">
            <span className="font-mono-num">{filteredOrders.length} ออเดอร์</span>
          </Badge>
        </div>

        {/* Mobile Order Cards */}
        <div className="lg:hidden space-y-2.5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((o) => (
              <Card key={o.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num font-semibold text-ink text-xs">
                    #{o.orderNumber}
                  </span>
                  <span className="text-[11px] font-mono-num text-ink-muted">
                    {new Date(o.createdAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink">{o.customer.name}</div>
                  <div className="text-[11px] text-ink-secondary mt-0.5 line-clamp-2">
                    {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-surface-border-light">
                  <div className="text-sm font-mono-num font-semibold text-ink">
                    ฿{o.total.toLocaleString()}
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-ink-muted text-xs">
              ไม่พบออเดอร์ในช่วงเวลานี้
            </Card>
          )}
        </div>

        {/* Desktop DataTable */}
        <div className="hidden lg:block">
          <DataTable
            data={filteredOrders}
            columns={orderColumns}
            rowKey={(o) => o.id}
            loading={loading}
            emptyMessage="ไม่พบออเดอร์ในช่วงเวลานี้"
            defaultPageSize={10}
          />
        </div>
      </div>
    </div>
  );
}

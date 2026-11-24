'use client';

import React, { useState, useEffect } from 'react';
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
import * as XLSX from 'xlsx';
import { OrderDetail } from '@/types';

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(todayStr);

  // Toggle Top 5 vs All Products
  const [showAllProducts, setShowAllProducts] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate]);

  // Quick preset helper
  const handleSetPreset = (preset: 'today' | '7days' | 'month' | 'all') => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    setEndDate(end);

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

  // Filter orders by date range and exclude CANCELLED from sales totals (or display separately)
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;
    return true;
  });

  // Calculate Metrics (ignoring CANCELLED for revenues)
  const validOrders = filteredOrders.filter((o) => o.status !== 'CANCELLED');
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'CANCELLED');

  const totalOrdersCount = validOrders.length;
  const totalSalesRevenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalItemsSold = validOrders.reduce(
    (acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesRevenue / totalOrdersCount) : 0;

  // Group by Product
  const productSalesMap: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};

  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      const name = item.productName;
      if (!productSalesMap[name]) {
        productSalesMap[name] = { name, quantity: 0, revenue: 0 };
      }
      productSalesMap[name].quantity += item.quantity;
      productSalesMap[name].revenue += item.subtotal;
    });
  });

  const productSalesList = Object.values(productSalesMap).sort(
    (a, b) => b.revenue - a.revenue
  );

  const displayedProductSales = showAllProducts
    ? productSalesList
    : productSalesList.slice(0, 5);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Orders List
      const ordersSheetData = filteredOrders.map((o) => ({
        'เลขที่ออเดอร์': o.orderNumber,
        'วันที่-เวลา': new Date(o.createdAt).toLocaleString('th-TH'),
        'ชื่อลูกค้า': o.customer.name,
        'เบอร์โทรศัพท์': o.customer.phone,
        'Instagram': o.customer.instagram || '-',
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

      // Sheet 2: Product Sales Breakdown
      const productsSheetData = productSalesList.map((p, idx) => ({
        'อันดับ': idx + 1,
        'ชื่อเมนู': p.name,
        'จำนวนที่ขายได้ (ชิ้น)': p.quantity,
        'ยอดขายรวม (บาท)': p.revenue,
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productsSheetData);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'สรุปยอดขายแยกเมนู');

      // Sheet 3: Period Summary
      const summaryData = [
        { 'หัวข้อสรุป': 'ช่วงเวลาที่เลือก', 'ข้อมูล': `${startDate || 'เริ่มต้น'} ถึง ${endDate || 'ปัจจุบัน'}` },
        { 'หัวข้อสรุป': 'จำนวนออเดอร์สำเร็จ/ดำเนินการ', 'ข้อมูล': totalOrdersCount },
        { 'หัวข้อสรุป': 'ยอดขายรวมทั้งสิ้น (บาท)', 'ข้อมูล': totalSalesRevenue },
        { 'หัวข้อสรุป': 'จำนวนชิ้นขนมที่ขายได้', 'ข้อมูล': totalItemsSold },
        { 'หัวข้อสรุป': 'ยอดสั่งซื้อเฉลี่ยต่อออเดอร์ (บาท)', 'ข้อมูล': averageOrderValue },
        { 'หัวข้อสรุป': 'จำนวนออเดอร์ที่ยกเลิก', 'ข้อมูล': cancelledOrders.length },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ภาพรวมสรุป');

      // Generate filename
      const filename = `bibi-treats-sales-report-${endDate || 'latest'}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Error exporting Excel', err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    }
  };

  // Trigger Print / PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Page Header (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-bibi-100 shadow-sm print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 font-cute">
              รายงานยอดขายและสรุปรายรับ
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เลือกช่วงเวลา ดูสรุปยอดขาย และส่งออกข้อมูลเป็น Excel หรือพิมพ์ PDF
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
          >
            <FontAwesomeIcon icon={faPrint} className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / บันทึก PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Hidden during print) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-bibi-100 shadow-sm space-y-3 sm:space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Quick Presets */}
          <div className="flex items-center space-x-2 overflow-x-auto touch-scroll pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              เลือกช่วง:
            </span>
            <button
              type="button"
              onClick={() => handleSetPreset('today')}
              className="px-3.5 py-1.5 min-h-[40px] rounded-xl bg-slate-50 hover:bg-bibi-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('7days')}
              className="px-3.5 py-1.5 min-h-[40px] rounded-xl bg-slate-50 hover:bg-bibi-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap"
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('month')}
              className="px-3.5 py-1.5 min-h-[40px] rounded-xl bg-slate-50 hover:bg-bibi-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap"
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('all')}
              className="px-3.5 py-1.5 min-h-[40px] rounded-xl bg-bibi-100 text-bibi-700 text-xs font-semibold border border-bibi-200 transition-colors whitespace-nowrap"
            >
              ทั้งหมด
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-2 min-h-[44px] rounded-2xl border border-slate-200 flex-1 sm:flex-initial">
              <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent outline-none text-slate-700 text-xs"
              />
            </div>
            <span className="text-slate-400">ถึง</span>
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-2 min-h-[44px] rounded-2xl border border-slate-200 flex-1 sm:flex-initial">
              <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent outline-none text-slate-700 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Header (Visible only during print) */}
      <div className="hidden print:block pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-cute">
              Bibi&apos;s Treats - รายงานสรุปยอดขาย
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              ช่วงวันที่:{' '}
              {startDate ? new Date(startDate).toLocaleDateString('th-TH') : 'ตั้งแต่เริ่มต้น'}{' '}
              ถึง {new Date(endDate).toLocaleDateString('th-TH')}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Orders */}
        <div className="bg-white p-5 rounded-3xl border border-bibi-100 shadow-sm print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">จำนวนออเดอร์</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {totalOrdersCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              (ยกเลิก {cancelledOrders.length} รายการ)
            </div>
          </div>
        </div>

        {/* Card 2: Total Sales */}
        <div className="bg-white p-5 rounded-3xl border border-bibi-100 shadow-sm print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ยอดขายรวมสุทธิ</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faBahtSign} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
              ฿{totalSalesRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">ในช่วงเวลาที่เลือก</div>
          </div>
        </div>

        {/* Card 3: Items Sold */}
        <div className="bg-white p-5 rounded-3xl border border-bibi-100 shadow-sm print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">จำนวนขนมที่ขายได้</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {totalItemsSold.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">ชิ้น ทั้งหมด</div>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white p-5 rounded-3xl border border-bibi-100 shadow-sm print:border-slate-300 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ยอดเฉลี่ยต่อออเดอร์</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center print:hidden">
              <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600">
              ฿{averageOrderValue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">เฉลี่ย / ตะกร้า</div>
          </div>
        </div>
      </div>

      {/* Product Sales Breakdown Table */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm print:border-slate-300 print:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              {!showAllProducts && (
                <FontAwesomeIcon icon={faTrophy} className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>
                {showAllProducts ? 'สรุปยอดขายแยกตามเมนูขนมทั้งหมด' : '5 อันดับเมนูขายดีที่สุด'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {showAllProducts
                ? 'ประสิทธิภาพยอดขายแต่ละรายการขนมทั้งหมดตามช่วงเวลาที่เลือก'
                : 'เมนูขนมที่สร้างยอดขายสูงสุด 5 อันดับแรก'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-full font-semibold transition-colors ${
                showAllProducts
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {showAllProducts
                ? `${productSalesList.length} เมนู`
                : `Top 5 จาก ${productSalesList.length} เมนู`}
            </span>
          </div>
        </div>

        {/* Mobile View: Clean Luxury Ranking Cards */}
        <div className="lg:hidden space-y-2.5">
          {displayedProductSales.length > 0 ? (
            displayedProductSales.map((prod, idx) => {
              const share =
                totalSalesRevenue > 0
                  ? Math.round((prod.revenue / totalSalesRevenue) * 100)
                  : 0;
              return (
                <div
                  key={prod.name}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 transition-all hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold font-mono shrink-0 ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-900/70'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          ขายได้ {prod.quantity} ชิ้น
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-900">
                        ฿{prod.revenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {share}% ของยอดขาย
                      </div>
                    </div>
                  </div>
                  {/* Visual Proportion Bar */}
                  <div className="mt-2.5 w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(share, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              ไม่มีข้อมูลยอดขายในช่วงเวลาที่เลือก
            </div>
          )}
        </div>

        {/* Desktop View: 5-Star Luxury Table */}
        <div className="hidden lg:block overflow-x-auto touch-scroll">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 rounded-xl print:bg-slate-100">
              <tr>
                <th className="px-4 py-3 rounded-l-xl w-16">อันดับ</th>
                <th className="px-4 py-3">ชื่อเมนูขนม</th>
                <th className="px-4 py-3 text-center w-36">จำนวนที่ขายได้</th>
                <th className="px-4 py-3 text-right w-40">ยอดขายรวม</th>
                <th className="px-4 py-3 text-right rounded-r-xl w-44">สัดส่วนยอดขาย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProductSales.length > 0 ? (
                displayedProductSales.map((prod, idx) => {
                  const share =
                    totalSalesRevenue > 0
                      ? Math.round((prod.revenue / totalSalesRevenue) * 100)
                      : 0;
                  return (
                    <tr key={prod.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold font-mono ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-900/70'
                              : 'text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{prod.name}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700 font-mono">
                        {prod.quantity} ชิ้น
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono tabular-nums">
                        ฿{prod.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-700 h-full rounded-full"
                              style={{ width: `${Math.max(share, 3)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 font-mono w-9 text-right tabular-nums">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    ไม่มีข้อมูลยอดขายในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Toggle Button for More/Less Menus */}
        {productSalesList.length > 5 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center print:hidden">
            <button
              type="button"
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
            >
              <span>
                {showAllProducts
                  ? 'ย่อเหลือ 5 อันดับแรก'
                  : `ดูทั้งหมด (${productSalesList.length} เมนู)`}
              </span>
              <FontAwesomeIcon
                icon={showAllProducts ? faChevronUp : faChevronDown}
                className="w-3 h-3 text-slate-500"
              />
            </button>
          </div>
        )}
      </div>

      {/* Orders List for selected period */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm print:border-slate-300 print:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              รายการคำสั่งซื้อในช่วงเวลา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">รายละเอียดออเดอร์ทั้งหมดตามช่วงเวลา</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
            {filteredOrders.length} ออเดอร์
          </span>
        </div>

        {/* Mobile View: Sleek Luxury Order Cards (Zero horizontal scroll, perfect fit) */}
        <div className="lg:hidden space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((o) => {
              const statusCfg =
                o.status === 'COMPLETED'
                  ? { label: 'จัดส่งสำเร็จ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' }
                  : o.status === 'CANCELLED'
                  ? { label: 'ยกเลิก', bg: 'bg-rose-50 text-rose-700 border-rose-200/50' }
                  : o.status === 'CONFIRMED'
                  ? { label: 'ยืนยันแล้ว', bg: 'bg-blue-50 text-blue-700 border-blue-200/50' }
                  : o.status === 'PREPARING'
                  ? { label: 'เตรียมสินค้า', bg: 'bg-purple-50 text-purple-700 border-purple-200/50' }
                  : o.status === 'SHIPPING'
                  ? { label: 'กำลังจัดส่ง', bg: 'bg-amber-50 text-amber-700 border-amber-200/50' }
                  : { label: 'รอยืนยัน', bg: 'bg-amber-50 text-amber-700 border-amber-200/50' };

              return (
                <div
                  key={o.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2.5"
                >
                  {/* Top Bar: Order ID + Date */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      #{o.orderNumber}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>

                  {/* Middle: Customer + Order Items */}
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {o.customer.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </div>
                  </div>

                  {/* Bottom: Total + Status Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <div>
                      <div className="text-[10px] text-slate-400">ยอดรวมทั้งสิ้น</div>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        ฿{o.total.toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              ไม่พบออเดอร์ในช่วงเวลานี้
            </div>
          )}
        </div>

        {/* Desktop View: 5-Star Luxury Table */}
        <div className="hidden lg:block overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase tracking-wider text-slate-500 font-semibold print:bg-slate-100">
              <tr>
                <th className="px-4 py-3 rounded-l-xl w-28">เลขที่ออเดอร์</th>
                <th className="px-4 py-3 w-28">วันที่</th>
                <th className="px-4 py-3 w-44">ลูกค้า</th>
                <th className="px-4 py-3">รายการ</th>
                <th className="px-4 py-3 text-right w-28">ยอดรวม</th>
                <th className="px-4 py-3 text-center rounded-r-xl w-32">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => {
                  const statusCfg =
                    o.status === 'COMPLETED'
                      ? { label: 'จัดส่งสำเร็จ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' }
                      : o.status === 'CANCELLED'
                      ? { label: 'ยกเลิก', bg: 'bg-rose-50 text-rose-700 border-rose-200/50' }
                      : o.status === 'CONFIRMED'
                      ? { label: 'ยืนยันแล้ว', bg: 'bg-blue-50 text-blue-700 border-blue-200/50' }
                      : o.status === 'PREPARING'
                      ? { label: 'เตรียมสินค้า', bg: 'bg-purple-50 text-purple-700 border-purple-200/50' }
                      : o.status === 'SHIPPING'
                      ? { label: 'กำลังจัดส่ง', bg: 'bg-amber-50 text-amber-700 border-amber-200/50' }
                      : { label: 'รอยืนยัน', bg: 'bg-amber-50 text-amber-700 border-amber-200/50' };

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        #{o.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {o.customer.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-xs text-[11px]">
                        {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ฿{o.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    ไม่พบออเดอร์ในช่วงเวลานี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

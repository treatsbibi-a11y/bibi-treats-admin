'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCircleCheck,
  faKitchenSet,
  faTruck,
  faCircleXmark,
  faRotate,
  faMagnifyingGlass,
  faPhone,
  faEye,
  faPrint,
  faXmark,
  faLocationDot,
  faTriangleExclamation,
  faQrcode,
  faMoneyBillWave,
  faReceipt,
  faPaperclip,
  faMagnifyingGlassPlus,
  faArrowUpRightFromSquare,
  faCopy,
  faCheck,
  faDownload,
  faBuildingColumns,
  faArrowRight,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { OrderDetail, OrderStatus } from '@/types';

const ORDER_STATUS_CONFIG: {
  status: OrderStatus;
  label: string;
  icon: any;
  color: string;
  badgeBg: string;
}[] = [
  { status: 'PENDING', label: 'รอยืนยัน', icon: faClock, color: 'text-amber-500', badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-800' },
  { status: 'CONFIRMED', label: 'ยืนยันแล้ว', icon: faCircleCheck, color: 'text-blue-500', badgeBg: 'bg-blue-50 border-blue-200/80 text-blue-800' },
  { status: 'PREPARING', label: 'กำลังเตรียมสินค้า', icon: faKitchenSet, color: 'text-purple-500', badgeBg: 'bg-purple-50 border-purple-200/80 text-purple-800' },
  { status: 'SHIPPING', label: 'กำลังจัดส่ง', icon: faTruck, color: 'text-sky-500', badgeBg: 'bg-sky-50 border-sky-200/80 text-sky-800' },
  { status: 'COMPLETED', label: 'จัดส่งสำเร็จ', icon: faCircleCheck, color: 'text-emerald-500', badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-800' },
  { status: 'CANCELLED', label: 'ยกเลิกออเดอร์', icon: faCircleXmark, color: 'text-rose-500', badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-800' },
];

const STATUS_TABS: { key: string; label: string; status?: OrderStatus; color: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด', color: 'bg-slate-100 text-slate-700' },
  { key: 'PENDING', label: 'รอยืนยัน', status: 'PENDING', color: 'bg-amber-100 text-amber-700' },
  { key: 'CONFIRMED', label: 'ยืนยันแล้ว', status: 'CONFIRMED', color: 'bg-blue-100 text-blue-700' },
  { key: 'PREPARING', label: 'กำลังเตรียมสินค้า', status: 'PREPARING', color: 'bg-purple-100 text-purple-700' },
  { key: 'SHIPPING', label: 'กำลังจัดส่ง', status: 'SHIPPING', color: 'bg-sky-100 text-sky-700' },
  { key: 'COMPLETED', label: 'สำเร็จ', status: 'COMPLETED', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'CANCELLED', label: 'ยกเลิก', status: 'CANCELLED', color: 'bg-rose-100 text-rose-700' },
];

const DEFAULT_PAYMENT_INFO = {
  qrImageUrl: '/uploads/bibi-1795444192478-qiwqv1g.jpg',
  bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
  bankAccountNo: '142-1-52907-4',
  promptpayNumber: '086-296-5765',
  accountName: 'น.ส. ฮาบีบี บุตรแหล่',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [shopSettings, setShopSettings] = useState<typeof DEFAULT_PAYMENT_INFO>(DEFAULT_PAYMENT_INFO);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderDetail | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [showShopQrModal, setShowShopQrModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<OrderDetail | null>(null);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const handleSaveReceiptImage = async () => {
    const slipElement = document.getElementById('admin-printable-receipt');
    if (!slipElement || isSavingReceipt) return;

    try {
      setIsSavingReceipt(true);
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await (html2canvas as any)(slipElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc: Document) => {
          const clonedSlip = clonedDoc.getElementById('admin-printable-receipt');
          if (clonedSlip) {
            clonedSlip.style.borderRadius = '16px';
            clonedSlip.style.boxShadow = 'none';
          }
        },
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${viewingReceiptOrder?.orderNumber || 'bibi-treats'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export receipt image', err);
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleCopy = (text: string, fieldKey: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField((cur) => (cur === fieldKey ? null : cur));
      }, 2000);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setShopSettings({
          qrImageUrl: data.qrImageUrl || DEFAULT_PAYMENT_INFO.qrImageUrl,
          bankName: data.bankName || DEFAULT_PAYMENT_INFO.bankName,
          bankAccountNo: data.bankAccountNo || DEFAULT_PAYMENT_INFO.bankAccountNo,
          promptpayNumber: data.promptpayNumber || DEFAULT_PAYMENT_INFO.promptpayNumber,
          accountName: data.promptpayName || data.bankAccountName || DEFAULT_PAYMENT_INFO.accountName,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSettings();
  }, []);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) {
      setActiveTab(s);
    }
  }, [searchParams]);

  // Update order status handler
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update: immediately tick checkmark and update status across UI
    const prevOrder = selectedOrder;
    const prevOrders = [...orders];

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setOrders(prevOrders);
        if (prevOrder) setSelectedOrder(prevOrder);
        const data = await res.json().catch(() => ({}));
        console.error('Failed to update status', data);
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setOrders(prevOrders);
      if (prevOrder) setSelectedOrder(prevOrder);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Confirm cancel order
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${cancelModalOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === cancelModalOrder.id ? { ...o, status: 'CANCELLED' } : o))
        );
        if (selectedOrder && selectedOrder.id === cancelModalOrder.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        }
        setCancelModalOrder(null);
      }
    } catch (err) {
      console.error('Failed to cancel order', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchTab = activeTab === 'ALL' || order.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      order.orderNumber.toLowerCase().includes(q) ||
      order.customer.name.toLowerCase().includes(q) ||
      order.customer.phone.toLowerCase().includes(q) ||
      (order.customer.instagram && order.customer.instagram.toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>รอยืนยัน</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>ยืนยันแล้ว</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>กำลังเตรียม</span>
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>กำลังจัดส่ง</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>สำเร็จ</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>ยกเลิก</span>
          </span>
        );
    }
  };

  const getStatusCount = (key: string) => {
    if (key === 'ALL') return orders.length;
    return orders.filter((o) => o.status === key).length;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            รายการคำสั่งซื้อ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ตรวจสอบออเดอร์ จัดการสถานะ และหลักฐานการชำระเงิน
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm border border-slate-200 transition-colors"
        >
          <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto p-1 custom-scrollbar touch-scroll">
          {STATUS_TABS.map((tab) => {
            const count = getStatusCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : tab.key === 'PENDING' && count > 0
                      ? 'bg-amber-100 text-amber-800 font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ออเดอร์, ชื่อลูกค้า, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none text-xs sm:text-sm bg-slate-50/50"
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE & TABLET ORDERS CARDS (Visible on screens < 1024px) */}
      {/* ==================================================== */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
              >
                {/* Header: Order ID + Badges + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 font-mono text-sm tracking-tight flex items-center gap-2">
                      <span>#{order.orderNumber}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {order.paymentMethod === 'COD' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                          <FontAwesomeIcon icon={faTruck} className="w-2.5 h-2.5 text-amber-600" />
                          <span>COD</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                          <FontAwesomeIcon icon={faQrcode} className="w-2.5 h-2.5 text-slate-500" />
                          <span>โอนเงิน/QR</span>
                        </span>
                      )}

                      {order.slipUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingSlipUrl(order.slipUrl!);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors"
                          title="แตะเพื่อดูสลิปโอนเงิน"
                        >
                          <FontAwesomeIcon icon={faReceipt} className="w-2.5 h-2.5 text-emerald-600" />
                          <span>สลิป</span>
                          <img
                            src={order.slipUrl}
                            alt="Slip"
                            className="w-4 h-4 rounded-xs object-cover border border-emerald-300 ml-0.5"
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 text-sm">
                      {order.customer.name}
                    </span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono text-slate-600 hover:text-slate-900"
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-slate-400" />
                      <span>{order.customer.phone}</span>
                    </a>
                  </div>

                  {order.customer.instagram && (
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-slate-400 text-[11px]">Instagram:</span>
                      <span className="text-slate-600 font-mono text-[11px]">
                        @{order.customer.instagram.replace('@', '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Summary */}
                <div className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{itemCount} ชิ้น: </span>
                  <span className="text-slate-500 line-clamp-1">
                    {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </span>
                </div>

                {/* Footer: Date, Total & View Action */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 font-mono text-sm">
                      ฿{(order.total ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(order.createdAt || Date.now()).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingReceiptOrder(order);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors active:scale-95"
                      title="ดูใบเสร็จ 80mm"
                    >
                      <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-slate-500" />
                      <span>ใบเสร็จ</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors border border-slate-200/80 active:scale-95"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-slate-400" />
                      <span>ดูรายละเอียด</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200/80">
            {loading ? 'กำลังโหลดรายการออเดอร์...' : 'ไม่พบคำสั่งซื้อตามเงื่อนไขที่เลือก'}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* DESKTOP 5-STAR LUXURY TABLE (Screens >= 1024px)      */}
      {/* ==================================================== */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-sm text-slate-600 border-collapse table-fixed">
            <thead className="bg-slate-50/70 text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 border-b border-slate-200/70">
              <tr>
                <th className="w-[14%] pl-5 pr-2 py-3.5 whitespace-nowrap">เลขที่ออเดอร์</th>
                <th className="w-[17%] px-2 py-3.5 whitespace-nowrap">ลูกค้า & ช่องทางติดต่อ</th>
                <th className="w-[27%] px-2 py-3.5">รายการสินค้า</th>
                <th className="w-[10%] px-2 py-3.5 text-right whitespace-nowrap">ยอดสุทธิ</th>
                <th className="w-[11%] px-2 py-3.5 whitespace-nowrap">วันที่ / เวลา</th>
                <th className="w-[10%] px-2 py-3.5 text-center whitespace-nowrap">สถานะ</th>
                <th className="w-[11%] pl-2 pr-5 py-3.5 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="group bg-white hover:bg-slate-50/80 transition-all duration-150 cursor-pointer"
                    >
                      {/* Order Number & Method */}
                      <td className="pl-5 pr-2 py-3.5 truncate">
                        <div className="font-mono font-bold text-slate-900 text-sm tracking-tight group-hover:text-amber-700 transition-colors">
                          #{order.orderNumber}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {order.paymentMethod === 'COD' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60">
                              <FontAwesomeIcon icon={faTruck} className="w-2.5 h-2.5 text-amber-600" />
                              <span>COD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                              <FontAwesomeIcon icon={faQrcode} className="w-2.5 h-2.5 text-slate-400" />
                              <span>โอนเงิน/QR</span>
                            </span>
                          )}

                          {order.slipUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingSlipUrl(order.slipUrl!);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors cursor-pointer group/slip"
                              title="คลิกเพื่อดูสลิปโอนเงิน"
                            >
                              <FontAwesomeIcon icon={faReceipt} className="w-2.5 h-2.5 text-emerald-600" />
                              <img
                                src={order.slipUrl}
                                alt="Slip"
                                className="w-3.5 h-3.5 rounded-xs object-cover border border-emerald-300 ml-0.5 group-hover/slip:scale-110 transition-transform"
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-2 py-3.5 truncate">
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          {order.customer.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs mt-0.5 truncate">
                          <span className="font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {order.customer.phone}
                          </span>
                          {order.customer.instagram && (
                            <span className="text-pink-600 bg-pink-50/80 px-1.5 py-0.2 rounded text-[10px] border border-pink-200/50 font-mono truncate">
                              @{order.customer.instagram.replace('@', '')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-2 py-3.5 overflow-hidden">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/60 shrink-0">
                            {itemCount} ชิ้น
                          </span>
                          <span className="text-xs text-slate-500 truncate block">
                            {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-2 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-sm tracking-tight tabular-nums">
                          ฿{order.total.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ส่ง ฿{order.shippingFee}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-2 py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-2 py-3.5 text-center whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="pl-2 pr-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingReceiptOrder(order);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50/70 border border-transparent hover:border-amber-200/60 transition-colors"
                            title="ดู/พิมพ์ใบเสร็จ 80mm"
                          >
                            <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs group-hover:shadow-sm active:scale-95"
                          >
                            <span>จัดการ</span>
                            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    {loading ? 'กำลังโหลดรายการออเดอร์...' : 'ไม่พบคำสั่งซื้อตามเงื่อนไขที่เลือก'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* ORDER DETAIL MODAL                                   */}
      {/* ==================================================== */}
      {selectedOrder && (
        <div
          onClick={() => {
            setSelectedOrder(null);
            setStatusDropdownOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-x-hidden animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[88vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200/80 relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
          >
            {/* Mobile Sheet Handle Pill */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* STICKY HEADER */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white z-10">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                    #{selectedOrder.orderNumber}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate">
                  สั่งซื้อเมื่อ: {new Date(selectedOrder.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingReceiptOrder(selectedOrder)}
                  className="no-print inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors active:scale-95 shadow-xs"
                  title="เปิดดูและพิมพ์ใบเสร็จ 80mm"
                >
                  <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">ใบเสร็จรับเงิน 80mm</span>
                  <span className="sm:hidden">ใบเสร็จ 80mm</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setStatusDropdownOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="ปิดหน้าต่าง"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto touch-scroll p-4 sm:p-6 space-y-4">
              {/* Workflow Pipeline & Status Controls */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-3">
                {/* Stepper Pipeline (Active or Cancelled) */}
                {selectedOrder.status === 'CANCELLED' ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-800 text-xs">
                    <span className="font-medium">ออเดอร์นี้ถูกยกเลิกแล้ว</span>
                    <span className="text-[11px] text-rose-600">สามารถเปลี่ยนสถานะเพื่อนำกลับมาดำเนินการต่อได้</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2.5">
                      <span className="text-slate-400 uppercase tracking-wider font-mono text-[10px]">ขั้นตอนคำสั่งซื้อ</span>
                      <span className="text-slate-700 font-semibold">
                        {selectedOrder.status === 'PENDING' && '1/5: รอยืนยันจากร้าน'}
                        {selectedOrder.status === 'CONFIRMED' && '2/5: ยืนยันแล้ว / รอชำระเงิน'}
                        {selectedOrder.status === 'PREPARING' && '3/5: กำลังจัดเตรียมสินค้า'}
                        {selectedOrder.status === 'SHIPPING' && '4/5: กำลังนำส่งพัสดุ'}
                        {selectedOrder.status === 'COMPLETED' && '5/5: สำเร็จเรียบร้อย'}
                      </span>
                    </div>

                    {/* Visual 5-step progress bar with comfortable breathing gap */}
                    <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                      {['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'COMPLETED'].map((stepKey, idx) => {
                        const stepOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'COMPLETED'];
                        const currentIdx = stepOrder.indexOf(selectedOrder.status);
                        const isPastOrCurrent = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={stepKey} className="flex flex-col gap-1.5 min-w-0">
                            <div
                              className={`h-2 rounded-full transition-all duration-200 shadow-2xs ${
                                isCurrent
                                  ? 'bg-slate-900 ring-2 ring-slate-900/20'
                                  : isPastOrCurrent
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <div
                              className={`text-[10px] sm:text-[11px] text-center truncate tracking-tight transition-colors ${
                                isCurrent
                                  ? 'font-bold text-slate-900'
                                  : isPastOrCurrent
                                  ? 'text-slate-600 font-semibold'
                                  : 'text-slate-400 font-normal'
                              }`}
                            >
                              {idx === 0 && 'รอยืนยัน'}
                              {idx === 1 && 'ยืนยัน'}
                              {idx === 2 && 'เตรียม'}
                              {idx === 3 && 'จัดส่ง'}
                              {idx === 4 && 'สำเร็จ'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Switcher Row */}
                <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60 relative">
                  <span className="text-xs text-slate-500 font-medium">จัดการสถานะออเดอร์:</span>
                  <div className="relative">
                    {/* Custom Status Dropdown Trigger */}
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      {(() => {
                        const currentConfig =
                          ORDER_STATUS_CONFIG.find((c) => c.status === selectedOrder.status) ||
                          ORDER_STATUS_CONFIG[0];
                        return (
                          <>
                            <FontAwesomeIcon
                              icon={updatingStatus ? faRotate : currentConfig.icon}
                              className={`w-3.5 h-3.5 shrink-0 ${
                                updatingStatus ? 'animate-spin text-slate-400' : currentConfig.color
                              }`}
                            />
                            <span className="text-slate-800">{currentConfig.label}</span>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`w-2.5 h-2.5 text-slate-400 transition-transform duration-200 ${
                                statusDropdownOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </>
                        );
                      })()}
                    </button>

                    {/* Pop-up Dropdown Menu */}
                    {statusDropdownOpen && (
                      <>
                        {/* Backdrop to close on click outside */}
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setStatusDropdownOpen(false)}
                        />

                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                            <span>เลือกสถานะ</span>
                            <span className="text-[10px] text-slate-400 font-sans font-normal">คลิกเลือกได้ทันที</span>
                          </div>
                          <div className="py-1">
                            {ORDER_STATUS_CONFIG.map((opt) => {
                              const isSelected = selectedOrder.status === opt.status;
                              return (
                                <button
                                  key={opt.status}
                                  type="button"
                                  onClick={() => {
                                    if (!isSelected) {
                                      handleUpdateStatus(selectedOrder.id, opt.status);
                                    }
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50/70 font-semibold text-blue-900'
                                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FontAwesomeIcon
                                      icon={opt.icon}
                                      className={`w-3.5 h-3.5 shrink-0 ${opt.color}`}
                                    />
                                    <span className="truncate">{opt.label}</span>
                                  </div>
                                  {isSelected && (
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      className="w-3.5 h-3.5 text-blue-600 shrink-0"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{selectedOrder.customer.name}</span>
                    {selectedOrder.customer.instagram && (
                      <a
                        href={`https://instagram.com/${selectedOrder.customer.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-pink-600 hover:text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200/50"
                      >
                        @{selectedOrder.customer.instagram.replace('@', '')}
                      </a>
                    )}
                  </div>
                  <a
                    href={`tel:${selectedOrder.customer.phone}`}
                    className="text-slate-600 hover:text-slate-900 font-mono text-xs flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-slate-400" />
                    <span>{selectedOrder.customer.phone}</span>
                  </a>
                </div>

                {/* Delivery Address */}
                <div className="space-y-1">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{selectedOrder.customer.address}</span>
                  </div>
                  {selectedOrder.note && (
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50/60 border border-amber-200/50 text-[11px] text-amber-900">
                      <span className="font-semibold text-amber-800">หมายเหตุ:</span> {selectedOrder.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table (Receipt Style) */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  รายการขนมในออเดอร์ ({selectedOrder.items.length} รายการ)
                </div>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-semibold border-b border-slate-200/70">
                      <tr>
                        <th className="px-3.5 py-2.5">สินค้า</th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap">ราคา</th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap">จำนวน</th>
                        <th className="px-3.5 py-2.5 text-right whitespace-nowrap">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            {item.productName}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-500 whitespace-nowrap">
                            ฿{item.price}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                            ฿{item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seamless Payment & Receipt Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-3">
                {/* Slip / Payment State */}
                <div className="pb-3 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">วิธีชำระเงิน:</span>
                    {selectedOrder.paymentMethod === 'COD' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 font-mono">
                        <FontAwesomeIcon icon={faTruck} className="w-2.5 h-2.5 text-amber-600" />
                        <span>เก็บเงินปลายทาง (COD)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                        <FontAwesomeIcon icon={faQrcode} className="w-2.5 h-2.5 text-slate-500" />
                        <span>โอนเงิน / QR PromptPay</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrder.paymentMethod === 'TRANSFER' && (
                      <button
                        type="button"
                        onClick={() => setShowShopQrModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                        title="ดู QR Code รับเงินของทางร้าน"
                      >
                        <FontAwesomeIcon icon={faQrcode} className="w-3 h-3 text-slate-500" />
                        <span>ดู QR Code ร้าน</span>
                      </button>
                    )}

                    {selectedOrder.slipUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200/80 transition-colors"
                        title="คลิกเพื่อดูสลิปขนาดเต็ม"
                      >
                        <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-emerald-600" />
                        <span>ดูสลิปโอนเงิน</span>
                        <img
                          src={selectedOrder.slipUrl}
                          alt="Slip"
                          className="w-4 h-4 rounded-xs object-cover border border-emerald-300 ml-0.5"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>ยอดรวมค่าขนม:</span>
                    <span className="font-mono text-slate-700">฿{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่าจัดส่งพัสดุ:</span>
                    <span className="font-mono text-slate-700">฿{selectedOrder.shippingFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM ACTION BAR */}
            <div className="shrink-0 bg-white border-t border-slate-200/80 px-4 py-3 sm:px-6 sm:py-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0.5rem))] flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-10">
              {/* Left: Prominent Total */}
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none mb-1">ยอดสุทธิทั้งสิ้น</div>
                <div className="font-mono font-bold text-base sm:text-xl text-slate-900 leading-tight">
                  ฿{selectedOrder.total.toLocaleString()}
                </div>
              </div>

              {/* Right: Primary Action CTA & Close Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setStatusDropdownOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  ปิด
                </button>

                {/* Next Step CTA */}
                {selectedOrder.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ยืนยันออเดอร์</span>
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5 text-purple-400" />
                    <span>{selectedOrder.slipUrl ? 'ตรวจสลิปแล้ว · เริ่มเตรียม' : 'เริ่มเตรียมสินค้า'}</span>
                  </button>
                )}
                {selectedOrder.status === 'PREPARING' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPING')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faTruck} className="w-3.5 h-3.5 text-sky-400" />
                    <span>ส่งมอบจัดส่ง</span>
                  </button>
                )}
                {selectedOrder.status === 'SHIPPING' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-white" />
                    <span>บันทึกจัดส่งสำเร็จ</span>
                  </button>
                )}
                {selectedOrder.status === 'COMPLETED' && (
                  <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1 py-1">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">จัดส่งเรียบร้อยแล้ว</span>
                    <span className="sm:hidden">เรียบร้อย</span>
                  </span>
                )}
                {selectedOrder.status === 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PENDING')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 transition-colors"
                  >
                    <span>นำกลับมารอยืนยัน</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 80mm POS THERMAL RECEIPT PREVIEW & PRINT MODAL       */}
      {/* ==================================================== */}
      {viewingReceiptOrder && (
        <div
          onClick={() => setViewingReceiptOrder(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-[420px] h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 relative overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
          >
            {/* Mobile Sheet Drag Handle Pill (no-print) */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-2 sm:hidden shrink-0 no-print" />

            {/* HEADER CONTROL BAR: Clean White & Slate (no-print) */}
            <div className="no-print shrink-0 bg-white text-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
                  <FontAwesomeIcon icon={faReceipt} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-slate-900 truncate">
                      #{viewingReceiptOrder.orderNumber}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono shrink-0">
                      80mm
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-none mt-0.5">
                    ใบเสร็จรับเงิน / คำสั่งซื้อ
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isSavingReceipt}
                  onClick={handleSaveReceiptImage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 active:scale-95 disabled:opacity-50"
                  title="บันทึกเป็นรูปภาพ PNG คมชัดสูง"
                >
                  <FontAwesomeIcon
                    icon={isSavingReceipt ? faRotate : faDownload}
                    className={`w-3.5 h-3.5 ${isSavingReceipt ? 'animate-spin text-amber-500' : 'text-slate-600'}`}
                  />
                  <span className="hidden xs:inline">{isSavingReceipt ? 'กำลังบันทึก...' : 'บันทึกรูป'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceiptOrder(null)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors ml-0.5 active:scale-95"
                  aria-label="ปิด"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE RECEIPT PAPER BODY */}
            <div className="flex-1 overflow-y-auto touch-scroll bg-slate-100/60 p-2.5 sm:p-4 flex flex-col items-center">
              {/* Authentic 80mm Slip Paper Container */}
              <div
                id="admin-printable-receipt"
                className="w-full max-w-[380px] bg-white rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden text-slate-800 font-sans transition-all text-left mb-2"
              >
                {/* Top Sawtooth Paper Tear Effect (no-print) */}
                <div className="w-full h-2 overflow-hidden flex text-slate-100 no-print">
                  <svg className="w-full h-2" viewBox="0 0 300 6" preserveAspectRatio="none" fill="currentColor">
                    <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 Z" />
                  </svg>
                </div>

                <div className="p-4 sm:p-6 space-y-3.5">
                  {/* Store POS Header */}
                  <div className="text-center space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-mono font-medium">
                      ARTISANAL HOMEMADE BAKERY
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                      Bibi&apos;s Treats
                    </h1>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Sweet treats, happy hearts
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 flex items-center justify-center gap-2">
                      <span>IG: @bibis.treats.bkk</span>
                      <span>•</span>
                      <span>โทร: 086-296-5765</span>
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Receipt Meta */}
                  <div className="text-[11px] space-y-1.5 font-mono">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase">เอกสาร / DOC</span>
                      <span className="font-bold text-slate-900">RECEIPT / ORDER SLIP</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase">เลขที่ / ORDER NO.</span>
                      <span className="font-bold text-slate-900">#{viewingReceiptOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase">วันที่ / DATE</span>
                      <span>
                        {new Date(viewingReceiptOrder.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) + ' น.'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase">สถานะ / STATUS</span>
                      <span>
                        {getStatusBadge(viewingReceiptOrder.status)}
                      </span>
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Items List */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-slate-400 pb-1.5 border-b border-slate-200">
                      <span>รายการ (ITEM)</span>
                      <span>ยอดรวม (AMOUNT)</span>
                    </div>
                    <div className="divide-y divide-slate-100/80 pt-1">
                      {viewingReceiptOrder.items.map((item) => (
                        <div key={item.id} className="py-2 flex items-start justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 leading-tight">
                              {item.productName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {item.quantity} × ฿{item.price}
                            </div>
                          </div>
                          <div className="font-bold font-mono text-slate-900 text-xs shrink-0 pt-0.5">
                            ฿{item.subtotal.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Totals Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>ยอดรวมสินค้า (Subtotal)</span>
                      <span className="font-mono text-slate-800">฿{viewingReceiptOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>ค่าจัดส่งพัสดุ (Shipping)</span>
                      <span className="font-mono text-slate-800">
                        {viewingReceiptOrder.shippingFee === 0
                          ? 'ฟรี (฿0)'
                          : `฿${viewingReceiptOrder.shippingFee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>วิธีชำระเงิน (Payment)</span>
                      <span className="font-medium text-slate-900">
                        {viewingReceiptOrder.paymentMethod === 'COD'
                          ? 'เก็บเงินปลายทาง (COD)'
                          : 'โอนเงินผ่าน PromptPay / QR'}
                      </span>
                    </div>

                    {/* Dark Bold Total Line */}
                    <div className="border-t-2 border-dashed border-slate-800 pt-2 pb-1 flex justify-between items-baseline">
                      <span className="font-bold uppercase tracking-wider text-xs text-slate-900">
                        ยอดรวมสุทธิ (TOTAL)
                      </span>
                      <span className="text-xl font-black font-mono text-slate-900">
                        ฿{viewingReceiptOrder.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-b-2 border-dashed border-slate-800" />
                  </div>

                  {/* Delivery Info */}
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                      ข้อมูลจัดส่ง (DELIVER TO)
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{viewingReceiptOrder.customer.name}</span>
                        <span className="font-mono font-normal text-slate-500 text-[10px]">
                          ({viewingReceiptOrder.customer.phone})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 pl-4 leading-relaxed">
                        {viewingReceiptOrder.customer.address}
                      </div>
                      {viewingReceiptOrder.note && (
                        <div className="text-[10px] text-amber-800 pl-4 pt-1 italic">
                          * หมายเหตุ: {viewingReceiptOrder.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barcode Simulation */}
                  <div className="pt-2 text-center space-y-1">
                    <div className="flex justify-center items-end gap-[2px] h-9 px-4 overflow-hidden">
                      {Array.from({ length: 44 }).map((_, i) => {
                        const h = ((i * 7 + 13) % 16) + 20;
                        const w = ((i * 3 + 5) % 3) + 1;
                        return (
                          <div
                            key={i}
                            className="bg-slate-900"
                            style={{ height: `${h}px`, width: `${w}px` }}
                          />
                        );
                      })}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 tracking-[0.2em]">
                      *{viewingReceiptOrder.orderNumber}*
                    </div>
                  </div>

                  {/* Footer Message */}
                  <div className="pt-2 border-t border-dashed border-slate-200 text-center space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
                      THANK YOU FOR YOUR ORDER
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ขอบคุณที่อุดหนุนขนมโฮมเมด Bibi&apos;s Treats นะคะ ❤️
                    </p>
                  </div>
                </div>

                {/* Bottom Sawtooth Paper Tear Effect (no-print) */}
                <div className="w-full h-2 overflow-hidden flex text-slate-100 no-print rotate-180">
                  <svg className="w-full h-2" viewBox="0 0 300 6" preserveAspectRatio="none" fill="currentColor">
                    <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM ACTION BAR (Thumb-friendly & Professional) */}
            <div className="no-print shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 sm:p-4 flex items-center gap-2.5 z-10 shadow-lg">
              <button
                type="button"
                onClick={() => setViewingReceiptOrder(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5 text-slate-500" />
                <span>ปิด</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-[2] py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-slate-200" />
                <span>พิมพ์ใบเสร็จ (80mm)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Stylesheet for 80mm Slip */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #admin-printable-receipt,
          #admin-printable-receipt * {
            visibility: visible !important;
          }
          #admin-printable-receipt {
            position: fixed !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 80mm !important;
            max-width: 80mm !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ==================================================== */}
      {/* CANCEL CONFIRMATION MODAL                            */}
      {/* ==================================================== */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-rose-200 relative animate-in fade-in zoom-in-95 max-h-[88vh] overflow-y-auto touch-scroll">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center text-xl mb-4">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              ยืนยันการยกเลิกออเดอร์ #{cancelModalOrder.orderNumber}?
            </h3>

            <div className="my-3 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-rose-700 space-y-1.5 leading-relaxed">
              <p>
                <strong>ข้อมูลสำคัญ:</strong>
              </p>
              <p>
                เมื่อกดยืนยันการยกเลิก ระบบจะดำเนินการ{' '}
                <strong>คืนสต็อกสินค้าทั้งหมดในออเดอร์นี้กลับเข้าระบบโดยอัตโนมัติ</strong>{' '}
                ทันที เพื่อให้ลูกค้าท่านอื่นสามารถสั่งซื้อได้
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center transition-colors"
              >
                ไม่ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={updatingStatus}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                {updatingStatus ? 'กำลังยกเลิก...' : 'ยืนยันการยกเลิกและคืนสต็อก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FULL-SIZE SLIP VIEWER LIGHTBOX MODAL                 */}
      {/* ==================================================== */}
      {viewingSlipUrl && (
        <div
          onClick={() => setViewingSlipUrl(null)}
          className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full max-h-[88vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  สลิปหลักฐานการโอนเงิน (Transfer Slip)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={viewingSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="เปิดดูในแท็บใหม่"
                >
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingSlipUrl(null)}
                  className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  aria-label="ปิด"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center bg-slate-900/5 overflow-auto max-h-[60vh] min-h-[160px] touch-scroll">
              {viewingSlipUrl && viewingSlipUrl.trim() ? (
                <img
                  src={viewingSlipUrl}
                  alt="Payment Slip Full Size"
                  className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <FontAwesomeIcon icon={faReceipt} className="w-8 h-8 mb-2 opacity-40 block mx-auto text-slate-400" />
                  <span>ไม่พบรูปภาพสลิป หรือออเดอร์นี้ยังไม่ได้แนบสลิป</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center text-xs text-slate-500">
              <span className="text-[11px] truncate mr-2">แตะภายนอกหรือปุ่มปิดเพื่อกลับหน้าเดิม</span>
              <button
                type="button"
                onClick={() => setViewingSlipUrl(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center justify-center"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SHOP THAI QR PAYMENT VIEWER MODAL / LIGHTBOX        */}
      {/* ==================================================== */}
      {showShopQrModal && (
        <div
          onClick={() => setShowShopQrModal(false)}
          className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-[95%] sm:w-full max-h-[88vh] overflow-y-auto touch-scroll shadow-2xl border border-slate-200 flex flex-col p-4 sm:p-6 animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
                  <FontAwesomeIcon icon={faQrcode} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">
                    QR Code รับเงินของทางร้าน
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Thai QR Payment · พร้อมเพย์ &amp; บัญชีธนาคาร
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShopQrModal(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="ปิด"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Order total info badge if an order is selected */}
              {selectedOrder && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-900 font-bold font-mono">#{selectedOrder.orderNumber}</span>
                    <span className="text-slate-500 block text-[11px] truncate max-w-[150px]">{selectedOrder.customer.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">ยอดที่ต้องชำระ</span>
                    <span className="text-base font-bold text-slate-900 font-mono">฿{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Minimal Luxury QR Card (Unslop UI) */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 flex flex-col items-center">
                {/* PromptPay Label Bar */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-semibold text-slate-600 tracking-wide">THAI QR PAYMENT • พร้อมเพย์</span>
                </div>

                {/* QR Image Box */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs max-w-[220px] w-full aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={shopSettings.qrImageUrl}
                    alt="Thai QR Payment"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-3.5 w-full max-w-[240px]">
                  <a
                    href={shopSettings.qrImageUrl}
                    download="thai-qr-payment.jpg"
                    className="w-full sm:flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด QR</span>
                  </a>
                  <a
                    href={shopSettings.qrImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[42px] min-w-[42px] inline-flex items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs transition-colors"
                    title="เปิดรูปภาพในแท็บใหม่"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
                    <span className="sm:hidden ml-1">เปิดดูรูป</span>
                  </a>
                </div>
              </div>

              {/* Bank & PromptPay Details with Clean Copy */}
              <div className="space-y-2">
                {/* PromptPay */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium text-slate-400 block">
                      พร้อมเพย์ (PromptPay)
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-wide truncate block">
                      {shopSettings.promptpayNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(shopSettings.promptpayNumber, 'promptpay')}
                    className={`min-h-[38px] min-w-[76px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                      copiedField === 'promptpay'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={copiedField === 'promptpay' ? faCheck : faCopy}
                      className="w-3 h-3"
                    />
                    <span>{copiedField === 'promptpay' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                {/* Kasikorn Bank Account */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium text-slate-400 block flex items-center gap-1 truncate">
                      <FontAwesomeIcon icon={faBuildingColumns} className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{shopSettings.bankName}</span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-wide truncate block">
                      {shopSettings.bankAccountNo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(shopSettings.bankAccountNo, 'bankAccount')}
                    className={`min-h-[38px] min-w-[76px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                      copiedField === 'bankAccount'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={copiedField === 'bankAccount' ? faCheck : faCopy}
                      className="w-3 h-3"
                    />
                    <span>{copiedField === 'bankAccount' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                {/* Account Name */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium text-slate-400 block">
                      ชื่อบัญชี
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block">
                      {shopSettings.accountName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(shopSettings.accountName, 'accountName')}
                    className={`min-h-[38px] min-w-[76px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                      copiedField === 'accountName'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={copiedField === 'accountName' ? faCheck : faCopy}
                      className="w-3 h-3"
                    />
                    <span>{copiedField === 'accountName' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              {/* Copy Full Message For Customer Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const message = selectedOrder
                      ? `บัญชีสำหรับชำระเงิน Bibi's Treats\nยอดชำระ: ฿${selectedOrder.total.toLocaleString()} บาท (ออเดอร์ #${selectedOrder.orderNumber})\nธนาคารกสิกรไทย: 142-1-52907-4\nพร้อมเพย์: 086-296-5765\nชื่อบัญชี: น.ส. ฮาบีบี บุตรแหล่\n(เมื่อโอนเงินแล้ว กรุณาแนบสลิปเพื่อให้ทางร้านเริ่มเตรียมจัดส่งค่ะ ขอบคุณค่ะ)`
                      : `บัญชีสำหรับชำระเงิน Bibi's Treats\nธนาคารกสิกรไทย: 142-1-52907-4\nพร้อมเพย์: 086-296-5765\nชื่อบัญชี: น.ส. ฮาบีบี บุตรแหล่`;
                    handleCopy(message, 'fullMessage');
                  }}
                  className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    copiedField === 'fullMessage'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={copiedField === 'fullMessage' ? faCheck : faCopy}
                    className="w-3.5 h-3.5"
                  />
                  <span>
                    {copiedField === 'fullMessage'
                      ? 'คัดลอกข้อความสำหรับส่งให้ลูกค้าแล้ว ✓'
                      : 'คัดลอกข้อมูลทั้งหมดสำหรับส่งให้ลูกค้าในแชท'}
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
              <span className="text-[11px] text-center sm:text-left">สามารถแชร์รูป QR หรือข้อมูลบัญชีให้ลูกค้าได้</span>
              <button
                type="button"
                onClick={() => setShowShopQrModal(false)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors flex items-center justify-center"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลด...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

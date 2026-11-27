'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faKitchenSet,
  faTruck,
  faRotate,
  faMagnifyingGlass,
  faPhone,
  faEye,
  faLocationDot,
  faTriangleExclamation,
  faQrcode,
  faReceipt,
  faArrowUpRightFromSquare,
  faCheck,
  faArrowRight,
  faChevronDown,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { Modal } from '@/components/ui/Modal';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { showToast } from '@/components/ui/Toast';
import { downloadImageAsJpeg } from '@/lib/image-utils';
import { OrderStatusBadge, ORDER_STATUS_LIST } from '@/components/admin/OrderStatusBadge';
import OrderReceiptModal from '@/components/admin/OrderReceiptModal';
import ShopQrModal, { ShopPaymentInfo } from '@/components/admin/ShopQrModal';
import { OrderDetail, OrderStatus } from '@/types';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'PENDING', label: 'รอยืนยัน' },
  { key: 'CONFIRMED', label: 'รอชำระ' },
  { key: 'SLIP_UPLOADED', label: 'รอตรวจสลิป' },
  { key: 'PREPARING', label: 'กำลังเตรียม' },
  { key: 'SHIPPING', label: 'จัดส่ง' },
  { key: 'COMPLETED', label: 'เสร็จสิ้น' },
  { key: 'CANCELLED', label: 'ยกเลิก' },
];

function getPaymentMethodLabel(method: OrderDetail['paymentMethod']) {
  return method === 'COD' ? 'เก็บเงินปลายทาง' : 'PromptPay';
}

const DEFAULT_PAYMENT_INFO: ShopPaymentInfo = {
  qrImageUrl: '/images/thai-qr-payment.jpg',
  bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
  bankAccountNo: '142-1-52907-4',
  promptpayNumber: '086-296-5765',
  accountName: 'น.ส. ฮาบีบี บุตรแหล่',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [shopSettings, setShopSettings] = useState<ShopPaymentInfo>(DEFAULT_PAYMENT_INFO);

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderDetail | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [showShopQrModal, setShowShopQrModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<OrderDetail | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const fetchOrders = async (silentOrEvent?: boolean | unknown) => {
    const silent = silentOrEvent === true;
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setSelectedOrder((curr) =>
          curr ? data.find((o: OrderDetail) => o.id === curr.id) || curr : null
        );
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
      if (!silent) showToast({ title: 'โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ', variant: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setShopSettings({
          qrImageUrl: data.qrImageUrl || DEFAULT_PAYMENT_INFO.qrImageUrl,
          bankName: data.bankName || DEFAULT_PAYMENT_INFO.bankName,
          bankAccountNo: data.bankAccountNo || DEFAULT_PAYMENT_INFO.bankAccountNo,
          promptpayNumber: data.promptpayNumber || DEFAULT_PAYMENT_INFO.promptpayNumber,
          accountName:
            data.promptpayName || data.bankAccountName || DEFAULT_PAYMENT_INFO.accountName,
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchOrders(false);
    fetchSettings();
  }, []);

  useSmartPolling(() => {
    fetchOrders(true);
    fetchSettings();
  }, 3000);

  useEffect(() => {
    const s = searchParams.get('status');
    const q = searchParams.get('search');
    if (s) setActiveTab(s);
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
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
        setOrders(prevOrders);
        if (prevOrder) setSelectedOrder(prevOrder);
        const data = await res.json().catch(() => ({}));
        showToast({
          title: data.error || 'อัปเดตสถานะไม่สำเร็จ',
          variant: 'error',
        });
      } else {
        const updatedOrder = await res.json().catch(() => null);
        if (updatedOrder?.id) {
          setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
          setSelectedOrder((prev) => (prev && prev.id === updatedOrder.id ? updatedOrder : prev));
        }
        if (newStatus === 'CONFIRMED') {
          showToast({ title: 'ยืนยันออเดอร์แล้ว', variant: 'success' });
        } else if (newStatus === 'CANCELLED') {
          showToast({ title: 'ปฏิเสธออเดอร์และคืนสต็อกแล้ว', variant: 'warning' });
        } else {
          showToast({ title: 'อัปเดตสถานะคำสั่งซื้อแล้ว', variant: 'success' });
        }
      }
    } catch {
      setOrders(prevOrders);
      if (prevOrder) setSelectedOrder(prevOrder);
      showToast({ title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', variant: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSelectStatusOption = (order: OrderDetail, nextStatus: OrderStatus) => {
    setStatusDropdownOpen(false);
    if (order.status === nextStatus) return;
    if (nextStatus === 'CANCELLED') {
      setCancelModalOrder(order);
      return;
    }
    handleUpdateStatus(order.id, nextStatus);
  };

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
          prev.map((o) =>
            o.id === cancelModalOrder.id ? { ...o, status: 'CANCELLED' } : o
          )
        );
        if (selectedOrder && selectedOrder.id === cancelModalOrder.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        }
        setCancelModalOrder(null);
        showToast({
          title: 'ยกเลิกออเดอร์และคืนสต็อกแล้ว',
          variant: 'warning',
        });
      } else {
        const data = await res.json().catch(() => ({}));
        showToast({ title: data.error || 'ไม่สามารถยกเลิกออเดอร์ได้', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการยกเลิกออเดอร์', variant: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((order) => {
      const matchTab = activeTab === 'ALL' || order.status === activeTab;
      const matchSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer.name.toLowerCase().includes(q) ||
        order.customer.phone.toLowerCase().includes(q) ||
        (order.customer.instagram && order.customer.instagram.toLowerCase().includes(q));
      return matchTab && matchSearch;
    });
  }, [orders, activeTab, search]);

  const getStatusCount = (key: string) => {
    if (key === 'ALL') return orders.length;
    return orders.filter((o) => o.status === key).length;
  };

  const orderColumns: DataTableColumn<OrderDetail>[] = [
    {
      key: 'orderNumber',
      header: 'เลขที่ออเดอร์',
      sortable: true,
      sortValue: (o) => o.orderNumber,
      render: (order) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll pb-0.5 sm:flex-wrap sm:overflow-visible">
            <span className="font-mono-num font-semibold text-ink text-[13px]">
              #{order.orderNumber}
            </span>
            {order.status === 'PENDING' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-semantic-yellow-lt text-semantic-yellow border border-semantic-yellow/40">
                ออเดอร์ใหม่
              </span>
            )}
          </div>
          <div className="text-[11px] text-ink-muted font-mono-num">
            {new Date(order.createdAt).toLocaleString('th-TH', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll pb-0.5 sm:flex-wrap sm:overflow-visible">
            <Badge variant={order.paymentMethod === 'COD' ? 'warning' : 'neutral'} size="sm">
              <FontAwesomeIcon
                icon={order.paymentMethod === 'COD' ? faTruck : faQrcode}
                className="w-2.5 h-2.5"
              />
              <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
            </Badge>

            {order.slipUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingSlipUrl(order.slipUrl!);
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-medium border transition-opacity hover:opacity-85 ${
                  order.status === 'SLIP_UPLOADED'
                    ? 'bg-semantic-blue-lt text-semantic-blue border-semantic-blue/40 font-semibold ring-1 ring-semantic-blue/25'
                    : 'bg-semantic-green-lt text-semantic-green border-semantic-green/25'
                }`}
                title="คลิกเพื่อดูสลิปโอนเงิน"
              >
                <FontAwesomeIcon icon={faReceipt} className="w-2.5 h-2.5" />
                <span>{order.status === 'SLIP_UPLOADED' ? 'ตรวจสลิป' : 'สลิป'}</span>
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'ลูกค้า & ติดต่อ',
      sortable: true,
      sortValue: (o) => o.customer.name,
      render: (order) => (
        <div className="min-w-0">
          <div className="font-medium text-ink truncate">{order.customer.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
            <span className="font-mono-num">{order.customer.phone}</span>
            {order.customer.instagram && (
              <span className="text-semantic-purple bg-semantic-purple-lt px-1.5 rounded-sm font-mono truncate max-w-[100px]">
                @{order.customer.instagram.replace('@', '')}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'รายการสินค้า',
      render: (order) => {
        const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
        return (
          <div className="flex items-start gap-1.5 max-w-[260px]">
            <Badge variant="neutral" size="sm" className="shrink-0">
              <span className="font-mono-num">{itemCount} ชิ้น</span>
            </Badge>
            <span className="text-xs text-ink-secondary line-clamp-2">
              {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'total',
      header: 'ยอดสุทธิ',
      align: 'right',
      sortable: true,
      sortValue: (o) => o.total,
      render: (order) => (
        <div className="whitespace-nowrap">
          <div className="font-mono-num font-semibold text-ink">
            ฿{(order.total ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-ink-muted font-mono-num">
            รวม ฿{(order.subtotal ?? 0).toLocaleString()} · ส่ง ฿{(order.shippingFee ?? 0).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      sortable: true,
      sortValue: (o) => o.status,
      render: (order) => <OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} />,
    },
    {
      key: 'actions',
      header: 'การจัดการ',
      align: 'right',
      render: (order) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {order.status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="xs"
                disabled={updatingStatus}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(
                    order.id,
                    order.paymentMethod === 'COD' ? 'PREPARING' : 'CONFIRMED'
                  );
                }}
                className="bg-semantic-green hover:opacity-90 border-transparent"
              >
                <span>{order.paymentMethod === 'COD' ? 'ยืนยัน & เตรียมของ' : 'ยืนยัน'}</span>
              </Button>
              <Button
                variant="danger"
                size="xs"
                disabled={updatingStatus}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(order.id, 'CANCELLED');
                }}
              >
                <span>ปฏิเสธ</span>
              </Button>
            </>
          )}

          {order.status === 'CONFIRMED' && order.paymentMethod === 'COD' && (
            <Button
              variant="primary"
              size="xs"
              disabled={updatingStatus}
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(order.id, 'PREPARING');
              }}
            >
              <FontAwesomeIcon icon={faKitchenSet} className="w-3 h-3" />
              <span>กำลังเตรียมสินค้า</span>
            </Button>
          )}

          {order.status === 'SLIP_UPLOADED' && (
            <>
              {order.slipUrl && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingSlipUrl(order.slipUrl!);
                  }}
                  className="border-semantic-blue/40 text-semantic-blue bg-semantic-blue-lt"
                >
                  <FontAwesomeIcon icon={faReceipt} className="w-3 h-3" />
                  <span>ดูสลิป</span>
                </Button>
              )}
              <Button
                variant="primary"
                size="xs"
                disabled={updatingStatus}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(order.id, 'PREPARING');
                }}
              >
                <FontAwesomeIcon icon={faKitchenSet} className="w-3 h-3" />
                <span>กำลังเตรียมสินค้า</span>
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewingReceiptOrder(order);
            }}
            className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-surface-border bg-surface hover:bg-surface-secondary text-ink-muted hover:text-primary-text transition-colors"
            title="ดู/พิมพ์ใบเสร็จ"
          >
            <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5" />
          </button>
          <Button
            variant={order.status === 'PENDING' || order.status === 'SLIP_UPLOADED' ? 'outline' : 'primary'}
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
            }}
          >
            <span>จัดการ</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
          </Button>
        </div>
      ),
    },
  ];

  const currentStatusMeta = selectedOrder
    ? (() => {
        const meta =
          ORDER_STATUS_LIST.find((c) => c.status === selectedOrder.status) || ORDER_STATUS_LIST[0];
        if (selectedOrder.paymentMethod === 'COD' && selectedOrder.status === 'CONFIRMED') {
          return {
            ...meta,
            label: 'ร้านยืนยันแล้ว / เตรียมจัดส่ง',
          };
        }
        return meta;
      })()
    : ORDER_STATUS_LIST[0];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            รายการคำสั่งซื้อ
          </h1>
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <FontAwesomeIcon
            icon={faRotate}
            className={`w-3.5 h-3.5 text-ink-muted ${loading ? 'animate-spin' : ''}`}
          />
          <span>รีเฟรชข้อมูล</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Card */}
      <Card className="p-3.5 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll pb-0.5 sm:flex-wrap sm:overflow-visible">
          {STATUS_TABS.map((tab) => {
            const count = getStatusCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap border ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-secondary text-ink-secondary border-surface-border hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-num ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.key === 'PENDING' && count > 0
                      ? 'bg-semantic-yellow-lt text-semantic-yellow font-semibold'
                      : tab.key === 'SLIP_UPLOADED' && count > 0
                      ? 'bg-semantic-blue-lt text-semantic-blue font-semibold'
                      : 'bg-surface text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ออเดอร์, ชื่อลูกค้า, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs sm:text-[13px] bg-surface-secondary text-ink placeholder:text-ink-muted"
          />
        </div>
      </Card>

      {/* Mobile & Tablet Cards (< lg) */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
            return (
              <Card
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-3.5 space-y-2.5 cursor-pointer hover:bg-surface-secondary/50 transition-colors ${
                  order.status === 'PENDING'
                    ? 'border-semantic-yellow/50 ring-1 ring-semantic-yellow/20'
                    : order.status === 'SLIP_UPLOADED'
                    ? 'border-semantic-blue/50 ring-1 ring-semantic-blue/20'
                    : ''
                }`}
              >
                {order.status === 'PENDING' && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-semantic-yellow/25">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-semantic-yellow-lt text-semantic-yellow border border-semantic-yellow/40 animate-pulse">
                      🔔 มีคำสั่งซื้อใหม่
                    </span>
                    <span className="text-[10px] text-ink-muted">รอร้านยืนยันรับออเดอร์</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-ink font-mono-num text-sm">
                      #{order.orderNumber}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={order.paymentMethod === 'COD' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        <FontAwesomeIcon
                          icon={order.paymentMethod === 'COD' ? faTruck : faQrcode}
                          className="w-2.5 h-2.5"
                        />
                        <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                      </Badge>

                      {order.slipUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingSlipUrl(order.slipUrl!);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            order.status === 'SLIP_UPLOADED'
                              ? 'bg-semantic-blue-lt text-semantic-blue border-semantic-blue/40 font-semibold'
                              : 'bg-semantic-green-lt text-semantic-green border-semantic-green/25'
                          }`}
                        >
                          <FontAwesomeIcon icon={faReceipt} className="w-2.5 h-2.5" />
                          <span>{order.status === 'SLIP_UPLOADED' ? 'ดูสลิปที่แนบ' : 'ดูสลิป'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="bg-surface-secondary p-2.5 rounded border border-surface-border-light text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">{order.customer.name}</span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono-num text-ink-secondary hover:text-primary-text"
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-ink-muted" />
                      <span>{order.customer.phone}</span>
                    </a>
                  </div>
                  {order.customer.instagram && (
                    <div className="text-[11px] text-ink-muted font-mono">
                      IG: @{order.customer.instagram.replace('@', '')}
                    </div>
                  )}
                </div>

                <div className="text-xs text-ink-secondary space-y-1">
                  <div className="font-medium text-ink">รายการสินค้า ({itemCount} ชิ้น):</div>
                  <div className="space-y-0.5 pl-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate">
                          • {item.productName} <span className="font-mono-num text-ink">× {item.quantity}</span>
                        </span>
                        <span className="font-mono-num text-ink shrink-0">
                          ฿{(item.subtotal ?? 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status === 'SLIP_UPLOADED' && order.slipUrl && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingSlipUrl(order.slipUrl!);
                    }}
                    className="p-2.5 rounded bg-semantic-blue-lt border border-semantic-blue/30 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={order.slipUrl}
                        alt="Slip preview"
                        className="w-11 h-11 rounded object-cover border border-semantic-blue/40 bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-semantic-blue">
                          ลูกค้าแนบสลิปโอนเงินแล้ว
                        </div>
                        <div className="text-[11px] text-ink-secondary font-mono-num">
                          ยอดสุทธิ ฿{(order.total ?? 0).toLocaleString()} · แตะเพื่อดูรูปใหญ่
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-surface-border-light space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-ink-muted font-mono-num">
                      รวม ฿{(order.subtotal ?? 0).toLocaleString()} · ค่าส่ง ฿{(order.shippingFee ?? 0).toLocaleString()}
                    </div>
                    <div className="font-semibold text-ink font-mono-num text-sm">
                      สุทธิ ฿{(order.total ?? 0).toLocaleString()}
                    </div>
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(
                            order.id,
                            order.paymentMethod === 'COD' ? 'PREPARING' : 'CONFIRMED'
                          );
                        }}
                        className="w-full bg-semantic-green hover:opacity-90 border-transparent"
                      >
                        <span>{order.paymentMethod === 'COD' ? '✅ ยืนยัน & เตรียมของ' : '✅ ยืนยันออเดอร์'}</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(order.id, 'CANCELLED');
                        }}
                        className="w-full"
                      >
                        <span>❌ ปฏิเสธออเดอร์</span>
                      </Button>
                    </div>
                  )}

                  {order.status === 'CONFIRMED' && order.paymentMethod === 'COD' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updatingStatus}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, 'PREPARING');
                      }}
                      className="w-full"
                    >
                      <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5" />
                      <span>กำลังเตรียมสินค้า</span>
                    </Button>
                  )}

                  {order.status === 'SLIP_UPLOADED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updatingStatus}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, 'PREPARING');
                      }}
                      className="w-full"
                    >
                      <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5" />
                      <span>ตรวจสลิปแล้ว · กำลังเตรียมสินค้า</span>
                    </Button>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] text-ink-muted font-mono-num">
                      {new Date(order.createdAt || Date.now()).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingReceiptOrder(order);
                        }}
                      >
                        <FontAwesomeIcon icon={faReceipt} className="w-3 h-3" />
                        <span>ใบเสร็จ</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                        <span>รายละเอียด</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2 p-8 text-center text-ink-muted text-xs">
            {loading ? 'กำลังโหลดรายการออเดอร์...' : 'ไม่พบคำสั่งซื้อตามเงื่อนไขที่เลือก'}
          </Card>
        )}
      </div>

      {/* Desktop DataTable (>= lg) */}
      <div className="hidden lg:block">
        <DataTable
          data={filteredOrders}
          columns={orderColumns}
          rowKey={(o) => o.id}
          onRowClick={(o) => setSelectedOrder(o)}
          loading={loading}
          loadingMessage="กำลังโหลดรายการออเดอร์..."
          emptyMessage="ไม่พบคำสั่งซื้อตามเงื่อนไขที่เลือก"
          defaultPageSize={10}
          minWidthClass="min-w-0"
        />
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrder(null);
          setStatusDropdownOpen(false);
        }}
        mobileSheet
        size="lg"
        title={
          selectedOrder ? (
            <span className="inline-flex flex-wrap items-center gap-2 font-mono-num">
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
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          ) : undefined
        }
        headerRight={
          selectedOrder ? (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setViewingReceiptOrder(selectedOrder)}
              className="no-print"
            >
              <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-primary-text" />
              <span className="hidden sm:inline">ใบเสร็จรับเงิน</span>
              <span className="sm:hidden">ใบเสร็จ</span>
            </Button>
          ) : undefined
        }
        footer={
          selectedOrder ? (
            <div className="w-full flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-ink-muted">ยอดสุทธิทั้งสิ้น</div>
                <div className="font-mono-num font-bold text-base sm:text-lg text-ink">
                  ฿{selectedOrder.total.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(null);
                    setStatusDropdownOpen(false);
                  }}
                >
                  ปิด
                </Button>

                {selectedOrder.status === 'PENDING' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    >
                      <span>ปฏิเสธออเดอร์</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() =>
                        handleUpdateStatus(
                          selectedOrder.id,
                          selectedOrder.paymentMethod === 'COD' ? 'PREPARING' : 'CONFIRMED'
                        )
                      }
                      className="bg-semantic-green hover:opacity-90 border-transparent"
                    >
                      <span>{selectedOrder.paymentMethod === 'COD' ? 'ยืนยัน & เตรียมของ' : 'ยืนยันออเดอร์'}</span>
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  >
                    <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5" />
                    <span>
                      {selectedOrder.paymentMethod === 'COD'
                        ? 'กำลังเตรียมสินค้า'
                        : selectedOrder.slipUrl
                        ? 'ตรวจสลิปแล้ว · กำลังเตรียมสินค้า'
                        : 'กำลังเตรียมสินค้า'}
                    </span>
                  </Button>
                )}
                {selectedOrder.status === 'SLIP_UPLOADED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  >
                    <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5" />
                    <span>กำลังเตรียมสินค้า</span>
                  </Button>
                )}
                {selectedOrder.status === 'PREPARING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPING')}
                  >
                    <FontAwesomeIcon icon={faTruck} className="w-3.5 h-3.5" />
                    <span>ส่งมอบจัดส่ง</span>
                  </Button>
                )}
                {selectedOrder.status === 'SHIPPING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
                    <span>บันทึกจัดส่งสำเร็จ</span>
                  </Button>
                )}
                {selectedOrder.status === 'COMPLETED' && (
                  <Badge variant="success" size="md">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
                    <span>จัดส่งเรียบร้อย</span>
                  </Badge>
                )}
                {selectedOrder.status === 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PENDING')}
                  >
                    <span>นำกลับมารอยืนยัน</span>
                  </Button>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            {/* Highlight Slip Verification Banner for SLIP_UPLOADED Orders */}
            {selectedOrder.status === 'SLIP_UPLOADED' && selectedOrder.paymentMethod !== 'COD' && (
              <div className="p-3.5 rounded bg-semantic-blue-lt border border-semantic-blue/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedOrder.slipUrl ? (
                    <button
                      type="button"
                      onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                      className="w-14 h-14 rounded overflow-hidden border-2 border-semantic-blue/50 bg-white shrink-0 hover:opacity-90 transition-opacity"
                      title="คลิกเพื่อดูสลิปขนาดเต็ม"
                    >
                      <img
                        src={selectedOrder.slipUrl}
                        alt="Uploaded Slip Preview"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded bg-white/80 border border-semantic-blue/30 flex items-center justify-center text-semantic-blue shrink-0">
                      <FontAwesomeIcon icon={faReceipt} className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-semibold text-semantic-blue text-[13px]">
                      🔵 ลูกค้าชำระเงินแล้ว / รอตรวจสอบสลิป
                    </div>
                    <p className="text-[11px] text-ink-secondary font-mono-num">
                      ยอดโอนที่ต้องตรวจ: ฿{(selectedOrder.total ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedOrder.slipUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                      className="bg-surface border-semantic-blue/40 text-semantic-blue"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                      <span>ดูสลิปเต็ม</span>
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  >
                    <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5" />
                    <span>กำลังเตรียมสินค้า</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Informational Banner for Cash on Delivery (COD) */}
            {selectedOrder.paymentMethod === 'COD' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'COMPLETED' && (
              <div className="p-3.5 rounded bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faTruck} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-semibold text-sky-300 text-[13px]">
                      📦 ชำระเงินปลายทาง (COD) · รอเก็บเงินสดเมื่อจัดส่งถึงผู้รับ
                    </div>
                    <p className="text-[11px] text-ink-secondary font-mono-num">
                      ยอดเก็บเงินปลายทาง: ฿{(selectedOrder.total ?? 0).toLocaleString()} (ไม่ต้องตรวจสลิป)
                    </p>
                  </div>
                </div>
                {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'CONFIRMED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                    className="shrink-0"
                  >
                    <FontAwesomeIcon icon={faKitchenSet} className="w-3.5 h-3.5" />
                    <span>กำลังเตรียมสินค้า</span>
                  </Button>
                )}
              </div>
            )}

            {/* Pipeline & Status Switcher */}
            <div className="p-3.5 rounded bg-surface-secondary border border-surface-border-light space-y-3">
              {selectedOrder.status === 'CANCELLED' ? (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-semantic-red-lt border border-semantic-red/25 text-semantic-red">
                  <span className="font-semibold">🔴 ปฏิเสธออเดอร์ / ยกเลิกแล้ว</span>
                  <span className="text-[11px]">
                    สามารถเปลี่ยนสถานะเพื่อนำกลับมาดำเนินการต่อได้
                  </span>
                </div>
              ) : selectedOrder.paymentMethod === 'COD' ? (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-ink-muted mb-2">
                    <span className="uppercase tracking-wider font-mono text-[10px]">
                      ขั้นตอนคำสั่งซื้อ (เก็บเงินปลายทาง)
                    </span>
                    <span className="text-ink font-semibold">
                      {selectedOrder.status === 'PENDING' && '1/4: รอร้านยืนยัน'}
                      {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'SLIP_UPLOADED' || selectedOrder.status === 'PREPARING') && '2/4: กำลังเตรียมสินค้า'}
                      {selectedOrder.status === 'SHIPPING' && '3/4: กำลังจัดส่ง'}
                      {selectedOrder.status === 'COMPLETED' && '4/4: เสร็จสิ้น (เก็บเงินสำเร็จ)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'PENDING', label: 'รอยืนยัน' },
                      { key: 'PREPARING', label: 'เตรียมสินค้า' },
                      { key: 'SHIPPING', label: 'จัดส่ง' },
                      { key: 'COMPLETED', label: 'เสร็จสิ้น' },
                    ].map((step, idx) => {
                      const codStepOrder = ['PENDING', 'PREPARING', 'SHIPPING', 'COMPLETED'];
                      let normalizedStatus = selectedOrder.status;
                      if (normalizedStatus === 'CONFIRMED' || normalizedStatus === 'SLIP_UPLOADED') {
                        normalizedStatus = 'PREPARING';
                      }
                      const currentIdx = codStepOrder.indexOf(normalizedStatus);
                      const isPastOrCurrent = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div key={step.key} className="flex flex-col gap-1 min-w-0">
                          <div
                            className={`h-1.5 rounded-full transition-colors ${
                              isCurrent
                                ? 'bg-primary'
                                : isPastOrCurrent
                                ? 'bg-semantic-green'
                                : 'bg-surface-border'
                            }`}
                          />
                          <div
                            className={`text-[10px] text-center truncate ${
                              isCurrent
                                ? 'font-semibold text-ink'
                                : isPastOrCurrent
                                ? 'text-ink-secondary font-medium'
                                : 'text-ink-muted'
                            }`}
                          >
                            {step.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-ink-muted mb-2">
                    <span className="uppercase tracking-wider font-mono text-[10px]">
                      ขั้นตอนคำสั่งซื้อ
                    </span>
                    <span className="text-ink font-semibold">
                      {selectedOrder.status === 'PENDING' && '1/6: รอร้านยืนยัน'}
                      {selectedOrder.status === 'CONFIRMED' && '2/6: ร้านยืนยันแล้ว / รอชำระเงิน'}
                      {selectedOrder.status === 'SLIP_UPLOADED' && '3/6: ชำระเงินแล้ว / รอตรวจสอบ'}
                      {selectedOrder.status === 'PREPARING' && '4/6: กำลังเตรียมสินค้า'}
                      {selectedOrder.status === 'SHIPPING' && '5/6: กำลังจัดส่ง'}
                      {selectedOrder.status === 'COMPLETED' && '6/6: เสร็จสิ้น'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(
                      [
                        'PENDING',
                        'CONFIRMED',
                        'SLIP_UPLOADED',
                        'PREPARING',
                        'SHIPPING',
                        'COMPLETED',
                      ] as const
                    ).map((stepKey, idx) => {
                      const stepOrder = [
                        'PENDING',
                        'CONFIRMED',
                        'SLIP_UPLOADED',
                        'PREPARING',
                        'SHIPPING',
                        'COMPLETED',
                      ];
                      const currentIdx = stepOrder.indexOf(selectedOrder.status);
                      const isPastOrCurrent = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      const labels = ['รอยืนยัน', 'รอชำระ', 'ตรวจสลิป', 'เตรียม', 'จัดส่ง', 'เสร็จสิ้น'];

                      return (
                        <div key={stepKey} className="flex flex-col gap-1 min-w-0">
                          <div
                            className={`h-1.5 rounded-full transition-colors ${
                              isCurrent
                                ? 'bg-primary'
                                : isPastOrCurrent
                                ? 'bg-semantic-green'
                                : 'bg-surface-border'
                            }`}
                          />
                          <div
                            className={`text-[10px] text-center truncate ${
                              isCurrent
                                ? 'font-semibold text-ink'
                                : isPastOrCurrent
                                ? 'text-ink-secondary font-medium'
                                : 'text-ink-muted'
                            }`}
                          >
                            {labels[idx]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Dropdown */}
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-surface-border-light">
                <span className="text-ink-secondary font-medium">จัดการสถานะออเดอร์:</span>

                <DropdownMenu
                  isOpen={statusDropdownOpen}
                  onOpenChange={setStatusDropdownOpen}
                  widthClass="w-56"
                  trigger={
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => setStatusDropdownOpen((o) => !o)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-surface hover:bg-surface-secondary text-ink border border-surface-border transition-colors disabled:opacity-50"
                    >
                      <FontAwesomeIcon
                        icon={updatingStatus ? faRotate : currentStatusMeta.icon}
                        className={`w-3.5 h-3.5 ${
                          updatingStatus
                            ? 'animate-spin text-ink-muted'
                            : currentStatusMeta.iconColorClass
                        }`}
                      />
                      <span>{currentStatusMeta.label}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`w-2.5 h-2.5 text-ink-muted transition-transform ${
                          statusDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  }
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-ink-muted border-b border-surface-border-light">
                    เลือกสถานะออเดอร์
                  </div>
                  <div className="py-1">
                    {(selectedOrder.paymentMethod === 'COD'
                      ? ORDER_STATUS_LIST.filter(
                          (opt) => opt.status !== 'CONFIRMED' && opt.status !== 'SLIP_UPLOADED'
                        )
                      : ORDER_STATUS_LIST
                    ).map((opt) => {
                      const isSelected = selectedOrder.status === opt.status;
                      return (
                        <button
                          key={opt.status}
                          type="button"
                          onClick={() => handleSelectStatusOption(selectedOrder, opt.status)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? 'bg-primary-lt font-semibold text-primary-text'
                              : 'hover:bg-surface-secondary text-ink-secondary hover:text-ink'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <FontAwesomeIcon
                              icon={opt.icon}
                              className={`w-3.5 h-3.5 shrink-0 ${opt.iconColorClass}`}
                            />
                            <span className="truncate">{opt.label}</span>
                          </span>
                          {isSelected && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="w-3 h-3 text-primary-text shrink-0"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </DropdownMenu>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-3.5 rounded bg-surface-secondary border border-surface-border-light space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-border-light">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-[13px]">
                    {selectedOrder.customer.name}
                  </span>
                  {selectedOrder.customer.instagram && (
                    <a
                      href={`https://instagram.com/${selectedOrder.customer.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-semantic-purple bg-semantic-purple-lt px-1.5 py-0.5 rounded-sm"
                    >
                      @{selectedOrder.customer.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
                <a
                  href={`tel:${selectedOrder.customer.phone}`}
                  className="text-ink-secondary hover:text-primary-text font-mono-num flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5 text-ink-muted" />
                  <span>{selectedOrder.customer.phone}</span>
                </a>
              </div>

              <div className="flex items-start gap-1.5 text-ink-secondary">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="w-3 h-3 text-ink-muted mt-0.5 shrink-0"
                />
                <span className="leading-relaxed">{selectedOrder.customer.address}</span>
              </div>

              {selectedOrder.note && (
                <div className="p-2 rounded bg-semantic-yellow-lt border border-semantic-yellow/30 text-[11px] text-ink">
                  <span className="font-semibold">หมายเหตุ:</span> {selectedOrder.note}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                รายการขนมในออเดอร์ ({selectedOrder.items.length} รายการ)
              </div>
              <div className="border border-surface-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary text-ink-muted text-[10px] uppercase font-semibold border-b border-surface-border">
                    <tr>
                      <th className="px-3 py-2">สินค้า</th>
                      <th className="px-3 py-2 text-right">ราคา</th>
                      <th className="px-3 py-2 text-center">จำนวน</th>
                      <th className="px-3 py-2 text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border-light">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2.5 sm:px-3 py-2 font-medium text-ink">{item.productName}</td>
                        <td className="px-2 sm:px-3 py-2 text-right font-mono-num text-ink-muted whitespace-nowrap">
                          ฿{item.price}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-center font-mono-num font-semibold text-ink">
                          {item.quantity}
                        </td>
                        <td className="px-2.5 sm:px-3 py-2 text-right font-mono-num font-semibold text-ink whitespace-nowrap">
                          ฿{item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="p-3.5 rounded bg-surface-secondary border border-surface-border-light space-y-2.5">
              <div className="pb-2.5 border-b border-surface-border-light flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-ink-muted">วิธีชำระเงิน:</span>
                  <Badge
                    variant={selectedOrder.paymentMethod === 'COD' ? 'warning' : 'neutral'}
                    size="sm"
                  >
                    <FontAwesomeIcon
                      icon={selectedOrder.paymentMethod === 'COD' ? faTruck : faQrcode}
                      className="w-2.5 h-2.5"
                    />
                    <span>{getPaymentMethodLabel(selectedOrder.paymentMethod)}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedOrder.paymentMethod === 'TRANSFER' && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setShowShopQrModal(true)}
                    >
                      <FontAwesomeIcon icon={faQrcode} className="w-3 h-3" />
                      <span>ดู QR ร้าน</span>
                    </Button>
                  )}

                  {selectedOrder.slipUrl && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setViewingSlipUrl(selectedOrder.slipUrl!)}
                      className="border-semantic-green/30 text-semantic-green bg-semantic-green-lt"
                    >
                      <FontAwesomeIcon icon={faReceipt} className="w-3 h-3" />
                      <span>ดูสลิปโอนเงิน</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-ink-secondary">
                <div className="flex justify-between">
                  <span>ยอดรวมค่าขนม:</span>
                  <span className="font-mono-num text-ink">
                    ฿{selectedOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าจัดส่งพัสดุ:</span>
                  <span className="font-mono-num text-ink">
                    ฿{selectedOrder.shippingFee.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 80mm POS Receipt Modal */}
      <OrderReceiptModal
        order={viewingReceiptOrder}
        onClose={() => setViewingReceiptOrder(null)}
      />

      {/* Cancel Order Confirmation Modal */}
      <Modal
        isOpen={Boolean(cancelModalOrder)}
        onClose={() => setCancelModalOrder(null)}
        size="sm"
        title={
          cancelModalOrder
            ? `ยืนยันการยกเลิกออเดอร์ #${cancelModalOrder.orderNumber}?`
            : undefined
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              autoFocus
              onClick={() => setCancelModalOrder(null)}
            >
              ไม่ยกเลิก
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={updatingStatus}
              onClick={handleConfirmCancel}
            >
              ยืนยันการยกเลิกและคืนสต็อก
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="w-10 h-10 rounded bg-semantic-red-lt text-semantic-red flex items-center justify-center">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />
          </div>
          <div className="p-3 rounded bg-semantic-red-lt border border-semantic-red/25 text-ink space-y-1 leading-relaxed">
            <p className="font-semibold text-semantic-red">ข้อมูลสำคัญ:</p>
            <p>
              เมื่อกดยืนยันการยกเลิก ระบบจะดำเนินการ{' '}
              <strong>คืนสต็อกสินค้าทั้งหมดในออเดอร์นี้กลับเข้าระบบโดยอัตโนมัติ</strong> ทันที
            </p>
          </div>
        </div>
      </Modal>

      {/* Slip Lightbox Modal */}
      <Modal
        isOpen={Boolean(viewingSlipUrl)}
        onClose={() => setViewingSlipUrl(null)}
        size="md"
        title={
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-semantic-green" />
            <span>สลิปหลักฐานการโอนเงิน (Transfer Slip)</span>
          </span>
        }
        headerRight={
          viewingSlipUrl ? (
            <a
              href={viewingSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
              title="เปิดดูในแท็บใหม่"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
            </a>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            {viewingSlipUrl && (
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  try {
                    await downloadImageAsJpeg(
                      viewingSlipUrl,
                      `slip-${selectedOrder?.orderNumber || 'payment'}.jpg`
                    );
                  } catch (err: any) {
                    showToast({ title: err?.message || 'ดาวน์โหลดไม่สำเร็จ', variant: 'error' });
                  }
                }}
              >
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5 mr-1.5" />
                ดาวน์โหลด JPEG
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setViewingSlipUrl(null)}>
              ปิด
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-center bg-surface-secondary rounded p-3 border border-surface-border-light min-h-[160px]">
          {viewingSlipUrl?.trim() ? (
            <img
              src={viewingSlipUrl}
              alt="Payment Slip Full Size"
              className="max-w-full max-h-[60vh] object-contain rounded border border-surface-border"
            />
          ) : (
            <div className="text-center py-8 text-ink-muted text-xs">
              ไม่พบรูปภาพสลิป หรือออเดอร์นี้ยังไม่ได้แนบสลิป
            </div>
          )}
        </div>
      </Modal>

      {/* Shop Thai QR Modal */}
      <ShopQrModal
        isOpen={showShopQrModal}
        onClose={() => setShowShopQrModal(false)}
        shopSettings={shopSettings}
        selectedOrder={selectedOrder}
      />
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-muted text-xs">กำลังโหลด...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

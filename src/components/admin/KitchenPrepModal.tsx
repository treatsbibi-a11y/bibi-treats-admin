'use client';

import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKitchenSet,
  faCalendarDays,
  faCopy,
  faPrint,
  faXmark,
  faCheck,
  faBox,
  faUtensils,
  faFilter,
  faDownload,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';
import { OrderDetail } from '@/types';

interface KitchenPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderDetail[];
}

type DateScope = 'today' | 'all_pending' | 'custom';

interface AggregatedItem {
  productName: string;
  productId?: string;
  totalQuantity: number;
  orderCount: number;
  orders: {
    orderNumber: string;
    customerName: string;
    quantity: number;
    status: string;
  }[];
}

export default function KitchenPrepModal({
  isOpen,
  onClose,
  orders,
}: KitchenPrepModalProps) {
  const [dateScope, setDateScope] = useState<DateScope>('today');
  const [customDate, setCustomDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [includePending, setIncludePending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter orders according to date and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Exclude cancelled and already completed orders for kitchen prep
      if (order.status === 'CANCELLED') return false;

      // Status check
      if (!includePending && order.status === 'PENDING') {
        return false;
      }

      // Date check
      if (dateScope === 'all_pending') {
        // All active orders waiting to be prepared or shipped
        return ['PENDING', 'CONFIRMED', 'SLIP_UPLOADED', 'PREPARING'].includes(order.status);
      }

      const orderDate = new Date(order.createdAt);
      const targetDateStr = dateScope === 'today' 
        ? new Date().toISOString().split('T')[0]
        : customDate;

      // Match local date YYYY-MM-DD
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const orderDateStr = `${year}-${month}-${day}`;

      return orderDateStr === targetDateStr;
    });
  }, [orders, dateScope, customDate, includePending]);

  // Aggregate items across filtered orders
  const aggregatedItems: AggregatedItem[] = useMemo(() => {
    const map = new Map<string, AggregatedItem>();

    for (const order of filteredOrders) {
      if (!order.items || !Array.isArray(order.items)) continue;

      for (const item of order.items) {
        const name = (item.productName || (item.product as any)?.name || 'ขนมไม่ระบุชื่อ').trim();
        const qty = Number(item.quantity) || 1;

        if (!map.has(name)) {
          map.set(name, {
            productName: name,
            productId: item.productId || (item.product as any)?.id,
            totalQuantity: 0,
            orderCount: 0,
            orders: [],
          });
        }

        const entry = map.get(name)!;
        entry.totalQuantity += qty;
        entry.orderCount += 1;
        entry.orders.push({
          orderNumber: order.orderNumber,
          customerName: order.customer?.name || 'ลูกค้า',
          quantity: qty,
          status: order.status,
        });
      }
    }

    // Sort by quantity descending
    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredOrders]);

  const totalPieces = useMemo(() => {
    return aggregatedItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  }, [aggregatedItems]);

  const dateLabel = useMemo(() => {
    if (dateScope === 'all_pending') return 'ออเดอร์ทั้งหมดที่รอเตรียมจัดส่ง';
    const dateObj = dateScope === 'today' ? new Date() : new Date(customDate);
    return dateObj.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [dateScope, customDate]);

  // Handle Copy to LINE Text Format
  const handleCopyForLine = async () => {
    if (aggregatedItems.length === 0) {
      showToast({ title: 'ไม่มีรายการขนมที่ต้องเตรียม', variant: 'info' });
      return;
    }

    let text = `📋 *สรุปยอดอบขนม Bibi's Treats*\n`;
    text += `📅 รอบ: ${dateLabel}\n`;
    text += `🏷️ สถานะ: ${includePending ? 'รวมออเดอร์ทั้งหมด' : 'เฉพาะที่ชำระเงิน/ยืนยันแล้ว'}\n`;
    text += `----------------------------------\n`;

    aggregatedItems.forEach((item, idx) => {
      text += `${idx + 1}. *${item.productName}*: *${item.totalQuantity} ชิ้น* (${item.orderCount} ออเดอร์)\n`;
      const orderList = item.orders.map((o) => `#${o.orderNumber} (x${o.quantity})`).join(', ');
      text += `   └ ${orderList}\n`;
    });

    text += `----------------------------------\n`;
    text += `📦 *รวมขนมทั้งหมด:* *${totalPieces} ชิ้น*\n`;
    text += `🛍️ *จากจำนวนคำสั่งซื้อ:* *${filteredOrders.length} ออเดอร์*\n`;
    text += `✨ *Bibi's Treats - อบสดใหม่ด้วยความพิถีพิถัน* 💖`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast({ title: 'คัดลอกสรุปยอดสำหรับส่ง LINE สำเร็จ', variant: 'success' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast({ title: 'ไม่สามารถคัดลอกข้อความได้', variant: 'error' });
    }
  };

  // Handle Print Sheet
  const handlePrint = () => {
    window.print();
  };

  // Handle Export Image
  const handleExportImage = async () => {
    const element = document.getElementById('kitchen-printable-sheet');
    if (!element || isExporting) return;

    try {
      setIsExporting(true);
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await (html2canvas as any)(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `kitchen-prep-${dateScope === 'today' ? 'today' : customDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast({ title: 'บันทึกรูปภาพใบเตรียมของสำเร็จ', variant: 'success' });
    } catch (err) {
      console.error('Export error', err);
      showToast({ title: 'ไม่สามารถบันทึกรูปภาพได้', variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="p-0 overflow-hidden bg-surface-primary border border-surface-border text-ink-primary max-w-4xl"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-secondary/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faKitchenSet} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-ink-primary flex items-center gap-2">
                ใบสรุปยอดอบ & เตรียมของประจำวัน
                <Badge variant="neutral" className="text-xs font-normal border-primary/30 text-primary">
                  Kitchen Prep Sheet
                </Badge>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                รวบรวมจำนวนชิ้นขนมแต่ละเมนูจากคำสั่งซื้อ เพื่อเข้าเตาอบและจัดแพ็กอย่างแม่นยำ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-secondary flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-surface-border bg-surface-secondary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Scope Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-secondary rounded-lg border border-surface-border">
            <button
              type="button"
              onClick={() => setDateScope('today')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                dateScope === 'today'
                  ? 'bg-primary text-black shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              วันนี้ (Today)
            </button>
            <button
              type="button"
              onClick={() => setDateScope('all_pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                dateScope === 'all_pending'
                  ? 'bg-primary text-black shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              ทั้งหมดที่รอเตรียมจัดส่ง
            </button>
            <button
              type="button"
              onClick={() => setDateScope('custom')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                dateScope === 'custom'
                  ? 'bg-primary text-black shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              เลือกวันที่
            </button>
          </div>

          {/* Custom Date Input */}
          {dateScope === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">วันที่:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-surface-primary border border-surface-border rounded-lg px-2.5 py-1 text-ink-primary focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Include Pending Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-ink-secondary hover:text-ink-primary ml-auto">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
              className="rounded border-surface-border text-primary focus:ring-primary w-3.5 h-3.5 accent-primary"
            />
            <span>รวมออเดอร์รอชำระเงิน (Pending)</span>
          </label>
        </div>

        {/* Printable & Scrollable Sheet Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" id="kitchen-printable-sheet">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-surface-border">
              <div className="text-xs text-ink-muted">ขนมที่ต้องอบ/เตรียมรวม</div>
              <div className="text-2xl font-bold text-primary mt-1 flex items-baseline gap-1.5">
                {totalPieces}
                <span className="text-xs font-normal text-ink-muted">ชิ้น</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-surface-border">
              <div className="text-xs text-ink-muted">จำนวนคำสั่งซื้อในรอบนี้</div>
              <div className="text-2xl font-bold text-ink-primary mt-1 flex items-baseline gap-1.5">
                {filteredOrders.length}
                <span className="text-xs font-normal text-ink-muted">ออเดอร์</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-surface-border">
              <div className="text-xs text-ink-muted">จำนวนเมนูที่ต้องทำ</div>
              <div className="text-2xl font-bold text-ink-primary mt-1 flex items-baseline gap-1.5">
                {aggregatedItems.length}
                <span className="text-xs font-normal text-ink-muted">เมนู</span>
              </div>
            </div>
          </div>

          {/* Current Date Banner */}
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarDays} className="text-primary w-3.5 h-3.5" />
              <span>สรุปสำหรับ: <strong className="text-ink-primary font-medium">{dateLabel}</strong></span>
            </div>
            <span>
              สถานะ: <strong className="text-primary font-medium">{includePending ? 'รวมทุกสถานะ' : 'เฉพาะที่ยืนยันแล้ว'}</strong>
            </span>
          </div>

          {/* Items Table */}
          {aggregatedItems.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-surface-border/80">
              <FontAwesomeIcon icon={faBox} className="w-10 h-10 text-ink-muted/50 mb-3" />
              <p className="text-sm text-ink-muted">ยังไม่มีรายการออเดอร์ในรอบวันที่หรือสถานะที่เลือก</p>
            </div>
          ) : (
            <div className="border border-surface-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/90 border-b border-surface-border text-ink-muted font-medium">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">ชื่อเมนูขนม</th>
                    <th className="py-3 px-4 text-center w-28">จำนวนที่ต้องอบ</th>
                    <th className="py-3 px-4 text-center w-28">จำนวนออเดอร์</th>
                    <th className="py-3 px-4">รายละเอียดคำสั่งซื้อที่สั่ง</th>
                    <th className="py-3 px-4 text-center w-16 print:table-cell hidden sm:table-cell">เช็ก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {aggregatedItems.map((item, idx) => (
                    <tr
                      key={item.productName}
                      className="hover:bg-surface-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-ink-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-ink-primary">
                          {item.productName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-primary/15 text-primary border border-primary/25 min-w-[3rem]">
                          {item.totalQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-ink-secondary">
                        {item.orderCount} ออเดอร์
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {item.orders.map((o) => (
                            <span
                              key={o.orderNumber}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-secondary border border-surface-border/80 text-[11px] text-ink-secondary"
                              title={`${o.customerName} - ${o.status}`}
                            >
                              <strong className="text-ink-primary font-mono">{o.orderNumber}</strong>
                              <span className="text-primary font-semibold">x{o.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        <div className="w-4 h-4 rounded border border-surface-border mx-auto print:border-black" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-border bg-surface-secondary/40 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-ink-muted">
            เคล็ดลับ: สามารถกด <strong>คัดลอกส่ง LINE</strong> เพื่อนำยอดไปวางในแชทกลุ่มครัวได้ทันที
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportImage}
              disabled={isExporting || aggregatedItems.length === 0}
              className="text-xs gap-1.5"
            >
              <FontAwesomeIcon icon={isExporting ? faRotate : faDownload} className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              <span>บันทึกรูปภาพ</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={aggregatedItems.length === 0}
              className="text-xs gap-1.5"
            >
              <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
              <span>พิมพ์ใบเตรียมของ</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopyForLine}
              disabled={aggregatedItems.length === 0}
              className={`text-xs gap-1.5 font-medium transition-all ${
                copied ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-primary text-black hover:bg-primary-hover'
              }`}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3.5 h-3.5" />
              <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกส่ง LINE'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

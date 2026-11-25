'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReceipt,
  faRotate,
  faDownload,
  faPrint,
  faXmark,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderDetail } from '@/types';

interface OrderReceiptModalProps {
  order: OrderDetail | null;
  onClose: () => void;
}

export default function OrderReceiptModal({
  order,
  onClose,
}: OrderReceiptModalProps) {
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);

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
            clonedSlip.style.borderRadius = '8px';
            clonedSlip.style.boxShadow = 'none';
          }
        },
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${order?.orderNumber || 'bibi-treats'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast({ title: 'บันทึกภาพใบเสร็จสำเร็จ', variant: 'success' });
    } catch (err) {
      console.error('Failed to export receipt image', err);
      showToast({ title: 'ไม่สามารถบันทึกภาพใบเสร็จได้', variant: 'error' });
    } finally {
      setIsSavingReceipt(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={Boolean(order)}
        onClose={onClose}
        mobileSheet
        size="sm"
        className="sm:max-w-[430px]"
        bodyClassName="p-0 bg-surface-secondary"
        title={
          order ? (
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-primary-text" />
              <span className="font-mono-num">#{order.orderNumber}</span>
              <span className="text-[10px] bg-surface-secondary border border-surface-border text-ink-muted px-1.5 py-0.5 rounded-sm font-mono">
                80mm
              </span>
            </span>
          ) : undefined
        }
        subtitle="ใบเสร็จรับเงิน / คำสั่งซื้อ"
        headerRight={
          order ? (
            <Button
              variant="outline"
              size="xs"
              disabled={isSavingReceipt}
              onClick={handleSaveReceiptImage}
              title="บันทึกเป็นรูปภาพ PNG"
            >
              <FontAwesomeIcon
                icon={isSavingReceipt ? faRotate : faDownload}
                className={`w-3 h-3 ${isSavingReceipt ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">
                {isSavingReceipt ? 'กำลังบันทึก...' : 'บันทึกรูป'}
              </span>
            </Button>
          ) : undefined
        }
        footer={
          order ? (
            <div className="w-full flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                <span>ปิด</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => window.print()}
                className="flex-[2]"
              >
                <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
                <span>พิมพ์ใบเสร็จ (80mm)</span>
              </Button>
            </div>
          ) : undefined
        }
      >
        {order && (
          <div className="p-3 sm:p-4 flex justify-center">
            {/* Thermal 80mm paper container forced light even in Dark Mode */}
            <div
              id="admin-printable-receipt"
              className="force-light-surface w-full max-w-[380px] rounded-md border border-slate-200 shadow-subtle overflow-hidden text-left"
            >
              <div className="w-full h-2 overflow-hidden flex text-slate-100 no-print">
                <svg className="w-full h-2" viewBox="0 0 300 6" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 Z" />
                </svg>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5 text-slate-800">
                <div className="text-center space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-mono">
                    ARTISANAL HOMEMADE BAKERY
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Bibi&apos;s Treats
                  </h2>
                  <p className="text-[11px] text-slate-500">Sweet treats, happy hearts</p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1 flex items-center justify-center gap-2">
                    <span>IG: @bibi.streats</span>
                    <span>•</span>
                    <span>โทร: 086-296-5765</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300" />

                <div className="text-[11px] space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">DOC</span>
                    <span className="font-bold text-slate-900">RECEIPT / ORDER SLIP</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">ORDER NO.</span>
                    <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">DATE</span>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      น.
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">STATUS</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300" />

                <div>
                  <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-slate-400 pb-1.5 border-b border-slate-200">
                    <span>รายการ (ITEM)</span>
                    <span>ยอดรวม (AMOUNT)</span>
                  </div>
                  <div className="divide-y divide-slate-100 pt-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 leading-tight">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.quantity} × ฿{item.price}
                          </div>
                        </div>
                        <div className="font-semibold font-mono text-slate-900 text-xs shrink-0 pt-0.5">
                          ฿{item.subtotal.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300" />

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>ยอดรวมสินค้า (Subtotal)</span>
                    <span className="font-mono text-slate-800">
                      ฿{order.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ค่าจัดส่งพัสดุ (Shipping)</span>
                    <span className="font-mono text-slate-800">
                      {order.shippingFee === 0
                        ? 'ฟรี (฿0)'
                        : `฿${order.shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>วิธีชำระเงิน (Payment)</span>
                    <span className="font-medium text-slate-900">
                      {order.paymentMethod === 'COD'
                        ? 'เก็บเงินปลายทาง (COD)'
                        : 'โอนเงินผ่าน PromptPay / QR'}
                    </span>
                  </div>

                  <div className="border-t-2 border-dashed border-slate-800 pt-2 pb-1 flex justify-between items-baseline">
                    <span className="font-bold uppercase tracking-wider text-xs text-slate-900">
                      ยอดรวมสุทธิ (TOTAL)
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      ฿{order.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-b-2 border-dashed border-slate-800" />
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                    DELIVER TO
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="w-3 h-3 text-slate-400 shrink-0"
                      />
                      <span>{order.customer.name}</span>
                      <span className="font-mono font-normal text-slate-500 text-[10px]">
                        ({order.customer.phone})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 pl-4 leading-relaxed">
                      {order.customer.address}
                    </div>
                    {order.note && (
                      <div className="text-[10px] text-amber-800 pl-4 pt-1 italic">
                        * หมายเหตุ: {order.note}
                      </div>
                    )}
                  </div>
                </div>

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
                    *{order.orderNumber}*
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200 text-center space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
                    THANK YOU FOR YOUR ORDER
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ขอบคุณที่อุดหนุนขนมโฮมเมด Bibi&apos;s Treats นะคะ
                  </p>
                </div>
              </div>

              <div className="w-full h-2 overflow-hidden flex text-slate-100 no-print rotate-180">
                <svg className="w-full h-2" viewBox="0 0 300 6" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 Z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
    </>
  );
}

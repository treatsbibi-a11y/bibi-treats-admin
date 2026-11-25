'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQrcode,
  faDownload,
  faArrowUpRightFromSquare,
  faCheck,
  faCopy,
  faBuildingColumns,
} from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { OrderDetail } from '@/types';

export interface ShopPaymentInfo {
  qrImageUrl: string;
  bankName: string;
  bankAccountNo: string;
  promptpayNumber: string;
  accountName: string;
}

interface ShopQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopSettings: ShopPaymentInfo;
  selectedOrder?: OrderDetail | null;
}

export default function ShopQrModal({
  isOpen,
  onClose,
  shopSettings,
  selectedOrder,
}: ShopQrModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldKey: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      showToast({ title: 'คัดลอกข้อมูลแล้ว', variant: 'info', duration: 2000 });
      setTimeout(() => {
        setCopiedField((cur) => (cur === fieldKey ? null : cur));
      }, 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="inline-flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-primary-lt text-primary-text inline-flex items-center justify-center">
            <FontAwesomeIcon icon={faQrcode} className="w-3.5 h-3.5" />
          </span>
          <span>QR Code รับเงินของทางร้าน</span>
        </span>
      }
      subtitle="Thai QR Payment · พร้อมเพย์ & บัญชีธนาคาร"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          ปิดหน้าต่าง
        </Button>
      }
    >
      <div className="space-y-4">
        {selectedOrder && (
          <div className="p-3 bg-surface-secondary border border-surface-border-light rounded flex items-center justify-between text-xs">
            <div>
              <span className="text-ink font-semibold font-mono-num">
                #{selectedOrder.orderNumber}
              </span>
              <span className="text-ink-muted block text-[11px] truncate max-w-[160px]">
                {selectedOrder.customer.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-ink-muted block">ยอดที่ต้องชำระ</span>
              <span className="text-base font-bold text-primary-text font-mono-num">
                ฿{selectedOrder.total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="bg-surface-secondary border border-surface-border-light rounded-lg p-4 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-green" />
            <span className="text-[11px] font-semibold text-ink-secondary tracking-wide">
              THAI QR PAYMENT • พร้อมเพย์
            </span>
          </div>

          <div className="bg-white p-2.5 rounded border border-surface-border max-w-[200px] w-full aspect-square flex items-center justify-center overflow-hidden">
            <img
              src={shopSettings.qrImageUrl}
              alt="Thai QR Payment"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2 mt-3 w-full max-w-[240px]">
            <a
              href={shopSettings.qrImageUrl}
              download="thai-qr-payment.jpg"
              className="flex-1 h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded bg-primary hover:bg-primary-dk text-white text-xs font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
              <span>ดาวน์โหลด QR</span>
            </a>
            <a
              href={shopSettings.qrImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 inline-flex items-center justify-center rounded bg-surface hover:bg-surface-secondary text-ink-secondary border border-surface-border transition-colors"
              title="เปิดรูปภาพในแท็บใหม่"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="space-y-2">
          {[
            {
              key: 'promptpay',
              label: 'พร้อมเพย์ (PromptPay)',
              value: shopSettings.promptpayNumber,
              mono: true,
            },
            {
              key: 'bankAccount',
              label: shopSettings.bankName,
              value: shopSettings.bankAccountNo,
              icon: faBuildingColumns,
              mono: true,
            },
            {
              key: 'accountName',
              label: 'ชื่อบัญชี',
              value: shopSettings.accountName,
              mono: false,
            },
          ].map((field) => (
            <div
              key={field.key}
              className="p-2.5 bg-surface rounded border border-surface-border flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-ink-muted flex items-center gap-1 truncate">
                  {field.icon && <FontAwesomeIcon icon={field.icon} className="w-2.5 h-2.5" />}
                  <span className="truncate">{field.label}</span>
                </span>
                <span
                  className={`text-xs sm:text-[13px] font-semibold text-ink truncate block mt-0.5 ${
                    field.mono ? 'font-mono-num' : ''
                  }`}
                >
                  {field.value}
                </span>
              </div>
              <Button
                variant={copiedField === field.key ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => handleCopy(field.value, field.key)}
              >
                <FontAwesomeIcon
                  icon={copiedField === field.key ? faCheck : faCopy}
                  className="w-3 h-3"
                />
                <span>{copiedField === field.key ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant={copiedField === 'fullMessage' ? 'primary' : 'outline'}
          size="md"
          className="w-full"
          onClick={() => {
            const message = selectedOrder
              ? `บัญชีสำหรับชำระเงิน Bibi's Treats\nยอดชำระ: ฿${selectedOrder.total.toLocaleString()} บาท (ออเดอร์ #${selectedOrder.orderNumber})\n${shopSettings.bankName}: ${shopSettings.bankAccountNo}\nพร้อมเพย์: ${shopSettings.promptpayNumber}\nชื่อบัญชี: ${shopSettings.accountName}\n(เมื่อโอนเงินแล้ว กรุณาแนบสลิปเพื่อให้ทางร้านเริ่มเตรียมจัดส่งค่ะ ขอบคุณค่ะ)`
              : `บัญชีสำหรับชำระเงิน Bibi's Treats\n${shopSettings.bankName}: ${shopSettings.bankAccountNo}\nพร้อมเพย์: ${shopSettings.promptpayNumber}\nชื่อบัญชี: ${shopSettings.accountName}`;
            handleCopy(message, 'fullMessage');
          }}
        >
          <FontAwesomeIcon
            icon={copiedField === 'fullMessage' ? faCheck : faCopy}
            className="w-3.5 h-3.5"
          />
          <span>
            {copiedField === 'fullMessage'
              ? 'คัดลอกข้อความสำหรับส่งให้ลูกค้าแล้ว'
              : 'คัดลอกข้อมูลทั้งหมดสำหรับส่งให้ลูกค้าในแชท'}
          </span>
        </Button>
      </div>
    </Modal>
  );
}

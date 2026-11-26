'use client';

import React from 'react';
import {
  faClock,
  faCircleCheck,
  faReceipt,
  faKitchenSet,
  faTruck,
  faCircleXmark,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus } from '@/types';

export interface OrderStatusMeta {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  variant: 'warning' | 'info' | 'purple' | 'primary' | 'success' | 'danger' | 'neutral';
  icon: IconDefinition;
  iconColorClass: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  PENDING: {
    status: 'PENDING',
    label: 'รอร้านยืนยัน',
    shortLabel: 'รอร้านยืนยัน',
    variant: 'warning',
    icon: faClock,
    iconColorClass: 'text-semantic-yellow',
  },
  CONFIRMED: {
    status: 'CONFIRMED',
    label: 'ร้านยืนยันแล้ว / รอชำระเงิน',
    shortLabel: 'ร้านยืนยันแล้ว / รอชำระเงิน',
    variant: 'success',
    icon: faCircleCheck,
    iconColorClass: 'text-semantic-green',
  },
  SLIP_UPLOADED: {
    status: 'SLIP_UPLOADED',
    label: 'ชำระเงินแล้ว / รอตรวจสอบ',
    shortLabel: 'ชำระเงินแล้ว / รอตรวจสอบ',
    variant: 'info',
    icon: faReceipt,
    iconColorClass: 'text-semantic-blue',
  },
  PREPARING: {
    status: 'PREPARING',
    label: 'กำลังเตรียมสินค้า',
    shortLabel: 'กำลังเตรียมสินค้า',
    variant: 'purple',
    icon: faKitchenSet,
    iconColorClass: 'text-semantic-purple',
  },
  SHIPPING: {
    status: 'SHIPPING',
    label: 'กำลังจัดส่ง',
    shortLabel: 'กำลังจัดส่ง',
    variant: 'primary',
    icon: faTruck,
    iconColorClass: 'text-primary-text',
  },
  COMPLETED: {
    status: 'COMPLETED',
    label: 'เสร็จสิ้น',
    shortLabel: 'เสร็จสิ้น',
    variant: 'success',
    icon: faCircleCheck,
    iconColorClass: 'text-semantic-green',
  },
  CANCELLED: {
    status: 'CANCELLED',
    label: 'ปฏิเสธออเดอร์',
    shortLabel: 'ปฏิเสธออเดอร์',
    variant: 'danger',
    icon: faCircleXmark,
    iconColorClass: 'text-semantic-red',
  },
};

export const ORDER_STATUS_LIST: OrderStatusMeta[] = [
  ORDER_STATUS_META.PENDING,
  ORDER_STATUS_META.CONFIRMED,
  ORDER_STATUS_META.SLIP_UPLOADED,
  ORDER_STATUS_META.PREPARING,
  ORDER_STATUS_META.SHIPPING,
  ORDER_STATUS_META.COMPLETED,
  ORDER_STATUS_META.CANCELLED,
];

export function OrderStatusBadge({
  status,
  size = 'sm',
}: {
  status: OrderStatus | string;
  size?: 'sm' | 'md';
}) {
  const meta = ORDER_STATUS_META[status as OrderStatus];
  if (!meta) {
    return (
      <Badge variant="neutral" size={size} dot>
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant={meta.variant} size={size}>
      {meta.label}
    </Badge>
  );
}

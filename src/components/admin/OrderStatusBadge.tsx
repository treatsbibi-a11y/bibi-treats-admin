'use client';

import React from 'react';
import {
  faClock,
  faCircleCheck,
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
    label: 'รอยืนยัน',
    shortLabel: 'รอยืนยัน',
    variant: 'warning',
    icon: faClock,
    iconColorClass: 'text-semantic-yellow',
  },
  CONFIRMED: {
    status: 'CONFIRMED',
    label: 'ยืนยันแล้ว',
    shortLabel: 'ยืนยัน',
    variant: 'info',
    icon: faCircleCheck,
    iconColorClass: 'text-semantic-blue',
  },
  PREPARING: {
    status: 'PREPARING',
    label: 'กำลังเตรียมสินค้า',
    shortLabel: 'เตรียม',
    variant: 'purple',
    icon: faKitchenSet,
    iconColorClass: 'text-semantic-purple',
  },
  SHIPPING: {
    status: 'SHIPPING',
    label: 'กำลังจัดส่ง',
    shortLabel: 'จัดส่ง',
    variant: 'primary',
    icon: faTruck,
    iconColorClass: 'text-primary-text',
  },
  COMPLETED: {
    status: 'COMPLETED',
    label: 'จัดส่งสำเร็จ',
    shortLabel: 'สำเร็จ',
    variant: 'success',
    icon: faCircleCheck,
    iconColorClass: 'text-semantic-green',
  },
  CANCELLED: {
    status: 'CANCELLED',
    label: 'ยกเลิกออเดอร์',
    shortLabel: 'ยกเลิก',
    variant: 'danger',
    icon: faCircleXmark,
    iconColorClass: 'text-semantic-red',
  },
};

export const ORDER_STATUS_LIST: OrderStatusMeta[] = [
  ORDER_STATUS_META.PENDING,
  ORDER_STATUS_META.CONFIRMED,
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
    <Badge variant={meta.variant} size={size} dot>
      {meta.shortLabel}
    </Badge>
  );
}

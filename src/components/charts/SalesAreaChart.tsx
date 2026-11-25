'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useChartTheme } from './useChartTheme';

export interface SalesChartPoint {
  label: string;
  sales: number;
  orders: number;
}

export default function SalesAreaChart({
  data,
  heightClass = 'h-72',
  gradientId = 'gentelellaTealArea',
}: {
  data: SalesChartPoint[];
  heightClass?: string;
  gradientId?: string;
}) {
  const colors = useChartTheme();

  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.26} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.borderLight} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: colors.textMuted }}
            axisLine={{ stroke: colors.borderColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.textMuted }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `฿${Number(v).toLocaleString()}`}
          />
          <Tooltip
            formatter={(val: unknown, name: unknown) => [
              name === 'sales'
                ? `฿${Number(val ?? 0).toLocaleString()}`
                : `${Number(val ?? 0)} รายการ`,
              name === 'sales' ? 'ยอดขาย' : 'ออเดอร์',
            ]}
            contentStyle={{
              backgroundColor: colors.bgSurface,
              borderRadius: '6px',
              border: `1px solid ${colors.borderColor}`,
              color: colors.text,
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
            labelStyle={{ color: colors.textMuted, marginBottom: '2px' }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke={colors.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

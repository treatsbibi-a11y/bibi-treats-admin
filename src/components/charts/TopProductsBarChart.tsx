'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useChartTheme } from './useChartTheme';

export interface ProductChartPoint {
  name: string;
  revenue: number;
  quantity: number;
}

export default function TopProductsBarChart({
  data,
  heightClass = 'h-72',
}: {
  data: ProductChartPoint[];
  heightClass?: string;
}) {
  const colors = useChartTheme();
  const chartData = data.slice(0, 6).map((d) => ({
    ...d,
    shortName: d.name.length > 14 ? `${d.name.slice(0, 14)}…` : d.name,
  }));

  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.borderLight} />
          <XAxis
            dataKey="shortName"
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
            formatter={(val: unknown, name: unknown): [string, string] => [
              name === 'revenue'
                ? `฿${Number(val ?? 0).toLocaleString()}`
                : `${Number(val ?? 0)} ชิ้น`,
              name === 'revenue' ? 'ยอดขายรวม' : 'จำนวนที่ขาย',
            ]}
            labelFormatter={(_label, payload) =>
              String((payload?.[0] as { payload?: { name?: string } } | undefined)?.payload?.name ?? '')
            }
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
          <Bar dataKey="revenue" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

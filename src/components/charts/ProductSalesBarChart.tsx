'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@/components/theme/ThemeProvider';
import { getChartThemeTokens, ChartThemeTokens } from '@/theme/tokens';

export interface ProductBarPoint {
  name: string;
  revenue: number;
  quantity: number;
}

interface ProductSalesBarChartProps {
  data: ProductBarPoint[];
  heightClass?: string;
}

export default function ProductSalesBarChart({
  data,
  heightClass = 'h-64',
}: ProductSalesBarChartProps) {
  const { resolvedTheme } = useTheme();
  const [tokens, setTokens] = useState<ChartThemeTokens>(() => getChartThemeTokens());

  useEffect(() => {
    setTokens(getChartThemeTokens());
  }, [resolvedTheme]);

  const chartItems = data.slice(0, 6).map((item) => ({
    ...item,
    shortName: item.name.length > 16 ? `${item.name.slice(0, 15)}…` : item.name,
  }));

  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartItems}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={tokens.borderLight}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: tokens.textMuted }}
            axisLine={{ stroke: tokens.borderColor }}
            tickLine={false}
            tickFormatter={(v) => `฿${Number(v).toLocaleString()}`}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={110}
            tick={{ fontSize: 11, fill: tokens.textMuted }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(val: any, name: any) => [
              name === 'revenue' ? `฿${Number(val).toLocaleString()}` : `${val} ชิ้น`,
              name === 'revenue' ? 'ยอดขาย' : 'จำนวนขาย',
            ]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
            labelStyle={{ color: tokens.text, fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: tokens.text }}
            contentStyle={{
              backgroundColor: tokens.bgSurface,
              borderRadius: '6px',
              border: `1px solid ${tokens.borderColor}`,
              boxShadow: 'var(--shadow-overlay)',
              fontSize: '12px',
              color: tokens.text,
            }}
          />
          <Bar
            dataKey="revenue"
            fill={tokens.primary}
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

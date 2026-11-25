'use client';

import { useEffect, useState } from 'react';
import { ChartThemeTokens, getChartThemeTokens } from '@/theme/tokens';

export function useChartTheme(): ChartThemeTokens {
  const [tokens, setTokens] = useState<ChartThemeTokens>(() => getChartThemeTokens());

  useEffect(() => {
    const refresh = () => {
      setTokens(getChartThemeTokens());
    };

    refresh();

    const observer = new MutationObserver(() => {
      refresh();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', refresh);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', refresh);
    };
  }, []);

  return tokens;
}

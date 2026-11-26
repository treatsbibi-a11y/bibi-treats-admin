'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faBagShopping,
  faBox,
  faArrowRight,
  faBolt,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@/components/ui/Modal';
import { ALL_NAV_ITEMS } from '@/lib/admin-nav';
import { OrderDetail, ProductWithImages } from '@/types';

interface PaletteItem {
  id: string;
  group: 'หน้าเมนู' | 'คำสั่งซื้อ' | 'สินค้า';
  title: string;
  subtitle?: string;
  icon: typeof faMagnifyingGlass;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    async function loadQuickSearchData() {
      setLoadingEntities(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/products?all=true'),
        ]);
        if (cancelled) return;
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          if (Array.isArray(data)) setOrders(data.slice(0, 30));
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          if (Array.isArray(data)) setProducts(data.slice(0, 40));
        }
      } catch {
        // Non-blocking quick search
      } finally {
        if (!cancelled) setLoadingEntities(false);
      }
    }

    loadQuickSearchData();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const allItems = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();

    const pageItems: PaletteItem[] = ALL_NAV_ITEMS.filter((item) => {
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }).map((item) => ({
      id: `page-${item.key}`,
      group: 'หน้าเมนู',
      title: item.label,
      subtitle: item.href,
      icon: item.icon,
      onSelect: () => {
        router.push(item.href);
        onClose();
      },
    }));

    const orderItems: PaletteItem[] = q
      ? orders
          .filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.customer.name.toLowerCase().includes(q) ||
              o.customer.phone.toLowerCase().includes(q)
          )
          .slice(0, 6)
          .map((o) => ({
            id: `order-${o.id}`,
            group: 'คำสั่งซื้อ',
            title: `#${o.orderNumber} · ${o.customer.name}`,
            subtitle: `฿${o.total.toLocaleString()} · ${o.customer.phone}`,
            icon: faBagShopping,
            onSelect: () => {
              router.push(`/orders?search=${encodeURIComponent(o.orderNumber)}`);
              onClose();
            },
          }))
      : [];

    const productItems: PaletteItem[] = q
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q)
          )
          .slice(0, 6)
          .map((p) => ({
            id: `product-${p.id}`,
            group: 'สินค้า',
            title: p.name,
            subtitle: `${p.category} · ฿${p.price} · คงเหลือ ${p.stock} ชิ้น`,
            icon: faBox,
            onSelect: () => {
              router.push(`/products?search=${encodeURIComponent(p.name)}`);
              onClose();
            },
          }))
      : [];

    return q
      ? [...orderItems, ...productItems, ...pageItems]
      : pageItems;
  }, [query, orders, products, router, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [allItems.length, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx) => (idx + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx) => (idx - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      allItems[activeIndex]?.onSelect();
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { item: PaletteItem; flatIndex: number }[]>();
    allItems.forEach((item, flatIndex) => {
      const list = map.get(item.group) || [];
      list.push({ item, flatIndex });
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [allItems]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader
      ariaLabel="ค้นหาด่วน"
      size="md"
      bodyClassName="p-0"
    >
      <div onKeyDown={handleKeyDown} className="flex flex-col max-h-[75dvh]">
        <div className="px-4 py-3 border-b border-surface-border-light flex items-center gap-2.5">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="w-4 h-4 text-ink-muted shrink-0"
          />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาด่วน: เลขออเดอร์, ชื่อลูกค้า, เบอร์โทร, สินค้า หรือหน้าเมนู..."
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
              aria-label="ล้างคำค้นหา"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-secondary text-ink-muted hover:text-ink border border-surface-border rounded-sm transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {grouped.length > 0 ? (
            grouped.map(([groupName, entries]) => (
              <div key={groupName}>
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {groupName}
                </div>
                <div className="space-y-0.5">
                  {entries.map(({ item, flatIndex }) => {
                    const isFocused = flatIndex === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={item.onSelect}
                        className={`w-full px-3 py-2 rounded flex items-center justify-between gap-3 text-left transition-colors ${
                          isFocused
                            ? 'bg-primary-lt text-ink'
                            : 'text-ink-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                              isFocused
                                ? 'bg-primary text-white'
                                : 'bg-surface-secondary text-ink-muted'
                            }`}
                          >
                            <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-ink truncate">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-[11px] text-ink-muted truncate font-mono">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className={`w-3 h-3 shrink-0 ${
                            isFocused ? 'text-primary-text' : 'text-ink-disabled'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-ink-muted">
              {loadingEntities ? 'กำลังค้นหาข้อมูล...' : 'ไม่พบผลลัพธ์ที่ตรงกัน'}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-surface-border-light bg-surface-secondary flex items-center justify-between text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faBolt} className="w-3 h-3 text-primary-text" />
            <span>ค้นหาออเดอร์และสินค้าได้ทันที</span>
          </span>
          <span className="hidden sm:inline font-mono">↑↓ เลือก · Enter เปิด</span>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faBagShopping,
  faBox,
  faBoxesStacked,
  faChartLine,
  faGear,
  faArrowUpRightFromSquare,
  faRightFromBracket,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  pendingOrdersCount?: number;
}

export default function AdminSidebar({
  isOpen = false,
  onClose,
  pendingOrdersCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const navItems = [
    {
      href: '/',
      label: 'ภาพรวมร้านค้า',
      icon: faChartPie,
      exact: true,
    },
    {
      href: '/orders',
      label: 'รายการคำสั่งซื้อ',
      icon: faBagShopping,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      href: '/products',
      label: 'สินค้าและรูปภาพ',
      icon: faBox,
    },
    {
      href: '/stock',
      label: 'จัดการสต็อกสินค้า',
      icon: faBoxesStacked,
    },
    {
      href: '/reports',
      label: 'รายงานยอดขาย',
      icon: faChartLine,
    },
    {
      href: '/settings',
      label: 'ตั้งค่าร้านค้า',
      icon: faGear,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-sm animate-in fade-in duration-150"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[280px] max-w-[85vw] lg:w-64 h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-300 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 sm:px-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover bg-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
                BT
              </div>
            )}
            <div>
              <span className="font-bold text-sm text-white tracking-tight">
                BIBI&apos;S TREATS
              </span>
              <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Operations Console
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="ปิดเมนู"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 sm:py-6 space-y-1.5 overflow-y-auto touch-scroll">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
            ระบบจัดการ
          </div>

          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href || (item.href === '/' && pathname === '/admin')
              : pathname.startsWith(item.href) || pathname.startsWith(`/admin${item.href}`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white border-l-2 border-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60 active:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={item.icon} className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pb-6 sm:pb-4 border-t border-slate-800/80 space-y-1.5 flex-shrink-0 bg-slate-950">
          <Link
            href={process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3002'}
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 min-h-[42px] text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-900/60 transition-colors"
          >
            <span>ดูหน้าร้านออนไลน์</span>
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors active:scale-98"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}

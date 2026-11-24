'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faBagShopping,
  faBox,
  faBoxesStacked,
  faChartLine,
  faGear,
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // If on login page, render clean layout without sidebar or header
  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

  // Fetch pending orders count for notification badges
  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;
    async function checkPendingOrders() {
      try {
        const res = await fetch('/api/orders?status=PENDING');
        if (res.ok) {
          const orders = await res.json();
          if (isMounted && Array.isArray(orders)) {
            setPendingCount(orders.length);
          }
        }
      } catch (err) {
        // Silently catch or fallback
      }
    }

    checkPendingOrders();
    // Poll every 30 seconds
    const interval = setInterval(checkPendingOrders, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoginPage, pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const mobileNavItems = [
    { href: '/', label: 'แดชบอร์ด', icon: faChartPie, exact: true },
    { href: '/orders', label: 'คำสั่งซื้อ', icon: faBagShopping, badge: pendingCount > 0 ? pendingCount : undefined },
    { href: '/products', label: 'สินค้า', icon: faBox },
    { href: '/stock', label: 'สต็อก', icon: faBoxesStacked },
    { href: '/reports', label: 'รายงาน', icon: faChartLine },
    { href: '/settings', label: 'ตั้งค่า', icon: faGear },
  ];

  return (
    <div className="min-h-screen bg-[#F8FBFE] flex flex-col lg:flex-row antialiased text-slate-800">
      {/* Sidebar Drawer Navigation */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingOrdersCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <AdminHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          pendingOrdersCount={pendingCount}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile & Tablet Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="แถบนำทางด่วนสำหรับมือถือและแท็บเล็ต"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 flex items-center justify-around lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        {mobileNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href || (item.href === '/' && pathname === '/admin')
            : pathname.startsWith(item.href) || pathname.startsWith(`/admin${item.href}`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 min-h-[46px] py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'text-brand-600 font-bold bg-brand-50/70'
                  : 'text-slate-500 hover:text-slate-900 active:bg-slate-100'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-brand-600' : 'text-slate-400'}`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

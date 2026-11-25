'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import CommandPalette from '@/components/admin/CommandPalette';
import { showToast } from '@/components/ui/Toast';
import { OrderDetail, StoreSettingsData } from '@/types';

const SIDEBAR_STORAGE_KEY = 'bibi-admin-sidebar-collapsed';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<OrderDetail[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettingsData | null>(null);
  const [togglingStore, setTogglingStore] = useState(false);

  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === '1') setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    if (isLoginPage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLoginPage]);

  // Fetch store settings & pending orders
  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok && isMounted) {
          const data = await res.json();
          setStoreSettings(data);
        }
      } catch {}
    }

    async function checkPendingOrders() {
      try {
        const res = await fetch('/api/orders?status=PENDING');
        if (res.ok && isMounted) {
          const orders = await res.json();
          if (Array.isArray(orders)) {
            setPendingOrders(orders);
          }
        }
      } catch {}
    }

    loadSettings();
    checkPendingOrders();
    const handleSettingsUpdated = (e: Event) => {
      const detail = (e as CustomEvent<StoreSettingsData>).detail;
      if (detail) setStoreSettings(detail);
    };
    window.addEventListener('bibi-settings-updated', handleSettingsUpdated);
    const interval = setInterval(checkPendingOrders, 30000);
    return () => {
      isMounted = false;
      window.removeEventListener('bibi-settings-updated', handleSettingsUpdated);
      clearInterval(interval);
    };
  }, [isLoginPage, pathname]);

  const handleToggleStoreStatus = useCallback(async () => {
    if (!storeSettings || togglingStore) return;
    const newStatus = !storeSettings.isStoreOpen;
    setTogglingStore(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoreOpen: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStoreSettings(updated);
        showToast({
          title: newStatus ? 'เปิดรับออเดอร์หน้าร้านแล้ว' : 'ปิดรับออเดอร์ชั่วคราวแล้ว',
          variant: newStatus ? 'success' : 'warning',
        });
      } else {
        showToast({ title: 'เปลี่ยนสถานะร้านค้าไม่สำเร็จ', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', variant: 'error' });
    } finally {
      setTogglingStore(false);
    }
  }, [storeSettings, togglingStore]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface-body text-ink flex flex-col lg:flex-row">
      <AdminSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        pendingOrdersCount={pendingOrders.length}
        logoUrl={storeSettings?.logoUrl}
        shopName={storeSettings?.shopName || "BIBI'S TREATS"}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          sidebarCollapsed
            ? 'lg:pl-[var(--sidebar-w-collapsed)]'
            : 'lg:pl-[var(--sidebar-w)]'
        }`}
      >
        <AdminHeader
          onOpenMobileSidebar={() => setSidebarOpen(true)}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          onOpenCommandPalette={() => setCommandOpen(true)}
          pendingOrders={pendingOrders}
          storeSettings={storeSettings}
          togglingStore={togglingStore}
          onToggleStoreStatus={handleToggleStoreStatus}
        />

        <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        isStoreOpen={storeSettings?.isStoreOpen}
        onToggleStoreStatus={handleToggleStoreStatus}
      />
    </div>
  );
}

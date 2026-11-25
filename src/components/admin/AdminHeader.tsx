'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBell,
  faMagnifyingGlass,
  faMoon,
  faSun,
  faGear,
  faArrowUpRightFromSquare,
  faRightFromBracket,
  faChevronRight,
  faBagShopping,
} from '@fortawesome/free-solid-svg-icons';
import { getBreadcrumbs } from '@/lib/admin-nav';
import { useTheme } from '@/components/theme/ThemeProvider';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { OrderDetail, StoreSettingsData } from '@/types';

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
  onOpenCommandPalette: () => void;
  pendingOrders?: OrderDetail[];
  storeSettings: StoreSettingsData | null;
  togglingStore?: boolean;
  onToggleStoreStatus: () => void;
}

export default function AdminHeader({
  onOpenMobileSidebar,
  onToggleDesktopSidebar,
  onOpenCommandPalette,
  pendingOrders = [],
  storeSettings,
  togglingStore = false,
  onToggleStoreStatus,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);
  const pendingCount = pendingOrders.length;

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface border-b border-surface-border px-3 sm:px-5 flex items-center justify-between gap-2 no-print">
      {/* Left: Sidebar Toggle & Auto-linked Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors"
          aria-label="เปิดเมนูนำทาง"
        >
          <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          className="hidden lg:inline-flex p-2 min-h-[36px] min-w-[36px] items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors"
          aria-label="ย่อหรือขยายแถบเมนูด้านข้าง"
          title="ย่อ/ขยายเมนู"
        >
          <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-[13px]">
          {breadcrumbs.map((seg, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${seg.label}-${idx}`}>
                {idx > 0 && (
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="w-2.5 h-2.5 text-ink-muted shrink-0 hidden sm:inline"
                  />
                )}
                {isLast || !seg.href ? (
                  <span className="font-semibold text-ink truncate">{seg.label}</span>
                ) : (
                  <Link
                    href={seg.href}
                    className="text-ink-muted hover:text-ink transition-colors truncate hidden sm:inline"
                  >
                    {seg.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Command Palette, Store Toggle, Theme Toggle, Bell Menu, Profile Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 h-8 rounded border border-surface-border bg-surface-secondary hover:border-ink-muted text-ink-muted hover:text-ink text-xs transition-colors"
          title="ค้นหาด่วน (⌘K / Ctrl+K)"
          aria-label="เปิด Command Palette"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-xs">ค้นหาด่วน...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-surface-border rounded-sm text-ink-muted leading-none">
            ⌘K
          </kbd>
        </button>

        {/* Store Active Toggle */}
        <button
          type="button"
          onClick={onToggleStoreStatus}
          disabled={togglingStore || !storeSettings}
          className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded text-xs font-medium border transition-colors disabled:opacity-50 ${
            storeSettings?.isStoreOpen
              ? 'bg-semantic-green-lt border-semantic-green/25 text-semantic-green hover:opacity-90'
              : 'bg-surface-secondary border-surface-border text-ink-secondary hover:text-ink'
          }`}
          title="คลิกเพื่อสลับสถานะเปิด/ปิดรับออเดอร์"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              storeSettings?.isStoreOpen ? 'bg-semantic-green' : 'bg-ink-muted'
            }`}
          />
          <span className="hidden sm:inline">
            {storeSettings?.isStoreOpen ? 'เปิดรับออเดอร์' : 'ปิดรับชั่วคราว'}
          </span>
          <span className="sm:hidden">
            {storeSettings?.isStoreOpen ? 'เปิด' : 'ปิด'}
          </span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 h-8 w-8 inline-flex items-center justify-center rounded border border-transparent hover:border-surface-border hover:bg-surface-secondary text-ink-secondary hover:text-ink transition-colors"
          title={resolvedTheme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          aria-label={resolvedTheme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        >
          <FontAwesomeIcon
            icon={resolvedTheme === 'dark' ? faSun : faMoon}
            className="w-3.5 h-3.5"
          />
        </button>

        {/* Notifications Bell Dropdown */}
        <DropdownMenu
          isOpen={notifOpen}
          onOpenChange={setNotifOpen}
          widthClass="w-72 sm:w-80"
          trigger={
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 h-8 w-8 inline-flex items-center justify-center rounded border border-transparent hover:border-surface-border hover:bg-surface-secondary text-ink-secondary hover:text-ink transition-colors"
              aria-label="แจ้งเตือนออเดอร์รอดำเนินการ"
              aria-expanded={notifOpen}
            >
              <FontAwesomeIcon icon={faBell} className="w-3.5 h-3.5" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-semantic-red text-white text-[10px] font-mono-num font-semibold flex items-center justify-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-surface-border-light flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">ออเดอร์รอยืนยัน</span>
            <span className="text-[11px] font-mono-num text-ink-muted">
              {pendingCount} รายการ
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-surface-border-light">
            {pendingOrders.length > 0 ? (
              pendingOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/orders?status=PENDING&search=${encodeURIComponent(order.orderNumber)}`}
                  onClick={() => setNotifOpen(false)}
                  className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-surface-secondary transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-ink font-mono-num truncate">
                      #{order.orderNumber}
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {order.customer?.name || 'ลูกค้าทั่วไป'}
                    </div>
                  </div>
                  <span className="text-xs font-semibold font-mono-num text-primary-text shrink-0">
                    ฿{(order.total ?? 0).toLocaleString()}
                  </span>
                </Link>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-ink-muted">
                ไม่มีออเดอร์รอยืนยันในขณะนี้
              </div>
            )}
          </div>

          <div className="p-1.5 border-t border-surface-border-light bg-surface-secondary">
            <Link
              href="/orders?status=PENDING"
              onClick={() => setNotifOpen(false)}
              className="w-full py-1.5 px-2.5 rounded text-xs font-medium text-primary-text hover:bg-primary-lt flex items-center justify-center gap-1.5 transition-colors"
            >
              <FontAwesomeIcon icon={faBagShopping} className="w-3 h-3" />
              <span>ดูรายการคำสั่งซื้อทั้งหมด</span>
            </Link>
          </div>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu
          isOpen={profileOpen}
          onOpenChange={setProfileOpen}
          widthClass="w-56"
          trigger={
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 pl-2 border-l border-surface-border py-1 pr-1 rounded-r hover:bg-surface-secondary transition-colors"
              aria-label="เมนูร้านค้าและบัญชีผู้ดูแล"
              aria-expanded={profileOpen}
            >
              {storeSettings?.logoUrl ? (
                <img
                  src={storeSettings.logoUrl}
                  alt={storeSettings.shopName}
                  className="w-7 h-7 rounded object-cover bg-white border border-surface-border shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded bg-sidebar-bg text-white font-mono text-[11px] flex items-center justify-center font-semibold shrink-0">
                  BT
                </div>
              )}
              <span className="text-xs font-medium text-ink hidden md:inline max-w-[140px] truncate">
                {storeSettings?.shopName || 'ผู้ดูแลระบบ'}
              </span>
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-surface-border-light">
            <div className="text-xs font-semibold text-ink truncate">
              {storeSettings?.shopName || "Bibi's Treats"}
            </div>
            <div className="text-[11px] text-ink-muted truncate">
              ผู้ดูแลระบบร้านค้า
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setProfileOpen(false)}
              className="px-3 py-2 text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary flex items-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5 text-ink-muted" />
              <span>ตั้งค่าร้านค้า</span>
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3002'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProfileOpen(false)}
              className="px-3 py-2 text-xs text-ink-secondary hover:text-ink hover:bg-surface-secondary flex items-center gap-2 transition-colors"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-3.5 h-3.5 text-ink-muted"
              />
              <span>ดูหน้าร้านออนไลน์</span>
            </Link>
          </div>

          <div className="py-1 border-t border-surface-border-light">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 text-left text-xs text-semantic-red hover:bg-semantic-red-lt flex items-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </DropdownMenu>
      </div>
    </header>
  );
}

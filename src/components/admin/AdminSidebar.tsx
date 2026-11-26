'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faRightFromBracket,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { NAV_GROUPS, isNavItemActive } from '@/lib/admin-nav';
import { getStorefrontUrl } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  pendingOrdersCount?: number;
  logoUrl?: string | null;
  shopName?: string;
}

export default function AdminSidebar({
  isOpen = false,
  isCollapsed = false,
  onClose,
  pendingOrdersCount = 0,
  logoUrl = null,
  shopName = "BIBI'S TREATS",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-[1px] animate-in fade-in duration-150"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="เมนูหลักผู้ดูแลระบบ"
        className={`fixed top-0 bottom-0 left-0 z-50 w-[252px] max-w-[85vw] no-print print:hidden ${
          isCollapsed ? 'lg:w-[var(--sidebar-w-collapsed)]' : 'lg:w-[var(--sidebar-w)]'
        } h-[100dvh] max-h-[100dvh] bg-sidebar-bg text-sidebar-text border-r border-sidebar-border flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-14 border-b border-sidebar-border flex items-center shrink-0 ${
            isCollapsed ? 'lg:justify-center lg:px-2 px-4 justify-between' : 'px-4 justify-between'
          }`}
        >
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5 min-w-0"
            title={shopName}
          >
            <img
              src={logoUrl || '/uploads/bibi-1795498989551-27zh7uk.png'}
              alt={shopName}
              className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border border-white/10"
              onError={(e) => {
                e.currentTarget.src = '/uploads/bibi-1795498989551-27zh7uk.png';
              }}
            />

            <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
              <span className="font-semibold text-[13px] text-sidebar-text-active tracking-tight block truncate">
                {shopName.toUpperCase()}
              </span>
              <span className="block text-[10px] text-sidebar-text font-mono uppercase tracking-wider leading-tight">
                Admin Console
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover transition-colors"
              aria-label="ปิดเมนู"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto touch-scroll space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="space-y-1">
              {isCollapsed ? (
                <div className="hidden lg:block mx-2 my-2 border-t border-sidebar-border" />
              ) : null}
              <div
                className={`px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/70 ${
                  isCollapsed ? 'lg:hidden' : ''
                }`}
              >
                {group.label}
              </div>

              {group.items.map((item) => {
                const isActive = isNavItemActive(pathname, item);
                const badgeCount =
                  item.key === 'orders' && pendingOrdersCount > 0
                    ? pendingOrdersCount
                    : undefined;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative group flex items-center ${
                      isCollapsed ? 'lg:justify-center lg:px-0 px-3 justify-between' : 'justify-between px-3'
                    } py-2 min-h-[38px] rounded text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active border-l-[3px] border-primary'
                        : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-hover border-l-[3px] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FontAwesomeIcon
                        icon={item.icon}
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-primary'
                            : 'text-sidebar-text group-hover:text-sidebar-text-hover'
                        }`}
                      />
                      <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>
                        {item.label}
                      </span>
                    </div>

                    {badgeCount !== undefined && (
                      <span
                        className={`bg-primary text-white text-[10px] font-mono-num font-semibold rounded-full ${
                          isCollapsed
                            ? 'lg:absolute lg:top-1.5 lg:right-1.5 lg:w-2 lg:h-2 lg:p-0 lg:text-[0px] px-1.5 py-0.5'
                            : 'px-1.5 py-0.5 leading-none'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-2.5 border-t border-sidebar-border space-y-1 shrink-0 bg-sidebar-bg">
          <a
            href={getStorefrontUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            title={isCollapsed ? 'ดูหน้าร้านออนไลน์' : undefined}
            className={`flex items-center ${
              isCollapsed ? 'lg:justify-center lg:px-0 px-3 justify-between' : 'justify-between px-3'
            } py-2 min-h-[36px] text-xs font-medium text-sidebar-text hover:text-sidebar-text-active rounded hover:bg-sidebar-hover transition-colors`}
          >
            <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>
              ดูหน้าร้านออนไลน์
            </span>
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="w-3.5 h-3.5 shrink-0 opacity-80"
            />
          </a>

          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'ออกจากระบบ' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'
            } gap-2.5 py-2 min-h-[36px] text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors`}
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5 shrink-0" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}

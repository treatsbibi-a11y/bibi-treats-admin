'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell } from '@fortawesome/free-solid-svg-icons';
import { StoreSettingsData } from '@/types';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  pendingOrdersCount?: number;
}

export default function AdminHeader({
  onOpenSidebar,
  pendingOrdersCount = 0,
}: AdminHeaderProps) {
  const [storeSettings, setStoreSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setStoreSettings(data);
        }
      } catch (err) {
        console.error('Failed to load store settings in header', err);
      }
    }
    fetchSettings();
  }, []);

  const toggleStoreStatus = async () => {
    if (!storeSettings) return;
    const newStatus = !storeSettings.isStoreOpen;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoreOpen: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStoreSettings(updated);
      }
    } catch (err) {
      console.error('Error toggling store status', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
          aria-label="เปิดเมนูนำทาง"
        >
          <FontAwesomeIcon icon={faBars} className="w-5 h-5 text-slate-700" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline">
            Console
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            ระบบจัดการร้านค้า
          </span>
        </div>
      </div>

      {/* Right Actions: Store Toggle & Notifications */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Store Active Toggle */}
        <button
          type="button"
          onClick={toggleStoreStatus}
          disabled={loading || !storeSettings}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] sm:min-h-[40px] rounded-full text-[11px] sm:text-xs font-semibold border transition-all active:scale-95 ${
            storeSettings?.isStoreOpen
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
          title="คลิกเพื่อสลับสถานะเปิด/ปิดรับออเดอร์"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              storeSettings?.isStoreOpen ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="hidden sm:inline">
            {storeSettings?.isStoreOpen ? 'เปิดรับออเดอร์' : 'ปิดรับชั่วคราว'}
          </span>
          <span className="sm:hidden">
            {storeSettings?.isStoreOpen ? 'เปิดร้าน' : 'ปิดร้าน'}
          </span>
        </button>

        {/* Notifications Bell */}
        <Link
          href="/orders"
          className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="ออเดอร์ใหม่รอดำเนินการ"
          aria-label="ออเดอร์ใหม่รอดำเนินการ"
        >
          <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
          {pendingOrdersCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </Link>

        {/* Store Profile Avatar / Logo */}
        <Link
          href="/settings"
          className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 group"
          title="จัดการการตั้งค่าและโลโก้ร้าน"
        >
          {storeSettings?.logoUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
              <img
                src={storeSettings.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover scale-110"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold shadow-xs">
              AD
            </div>
          )}
          <span className="text-xs font-semibold text-slate-800 hidden md:inline group-hover:text-amber-800 transition-colors">
            {storeSettings?.shopName || 'ผู้ดูแลระบบ'}
          </span>
        </Link>
      </div>
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faUser,
  faEye,
  faEyeSlash,
  faArrowLeft,
  faRotate,
  faStore,
  faKey,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin1234');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50/80 flex flex-col justify-center items-center px-4 py-6 sm:py-10 select-none">
      {/* Top Bar: Return Link */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <Link
          href={process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3002'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-200/50"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 text-slate-400" />
          <span>กลับหน้าร้านค้า</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">Admin Console</span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-7">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-3 shadow-xs">
            <FontAwesomeIcon icon={faStore} className="w-5 h-5 text-amber-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Bibi&apos;s Treats Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            ระบบจัดการร้านและสต็อกสินค้า
          </p>
        </div>

        {/* Demo Fast Fill Button */}
        <button
          type="button"
          onClick={handleFillDemo}
          className="w-full mb-5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all flex items-center justify-between group active:scale-[0.99]"
          title="คลิกเพื่อกรอกชื่อผู้ใช้และรหัสผ่านทดสอบอัตโนมัติ"
        >
          <div className="flex items-center gap-1.5 truncate">
            <FontAwesomeIcon icon={faKey} className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">
              บัญชีทดสอบ: <strong className="font-mono text-slate-900">admin</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-700 font-mono shrink-0 ml-1">
            คลิกเพื่อกรอก ↵
          </span>
        </button>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none text-sm bg-slate-50/50 hover:bg-white focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none text-sm bg-slate-50/50 hover:bg-white focus:bg-white transition-all text-slate-900 font-mono text-xs tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-xs transition-colors active:scale-98 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faRotate} className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบหลังบ้าน</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-[11px] text-slate-400 font-mono">
          Bibi&apos;s Treats Bakery Portal &copy; 2026
        </div>
      </div>
    </div>
  );
}

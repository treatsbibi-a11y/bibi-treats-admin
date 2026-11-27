'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faUser,
  faEye,
  faEyeSlash,
  faArrowLeft,
  faTriangleExclamation,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/theme/ThemeProvider';
import { getStorefrontUrl } from '@/lib/utils';
import { Turnstile } from '@marsidev/react-turnstile';

export default function AdminLoginPage() {
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>('/uploads/bibi-1795498989551-27zh7uk.png');
  const [shopName, setShopName] = useState<string>("Bibi's Treats");

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.shopName) setShopName(data.shopName);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
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
    <div className="min-h-[100dvh] bg-surface-body text-ink flex flex-col justify-center items-center px-4 py-8">
      {/* Top Bar */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <a
          href={getStorefrontUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink transition-colors py-1 px-2 -ml-2 rounded hover:bg-surface-secondary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 text-ink-muted" />
          <span>กลับหน้าร้านค้า</span>
        </a>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-muted">Admin Console</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded border border-surface-border bg-surface text-ink-secondary hover:text-ink transition-colors"
            aria-label={resolvedTheme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            title={resolvedTheme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          >
            <FontAwesomeIcon
              icon={resolvedTheme === 'dark' ? faSun : faMoon}
              className="w-3 h-3"
            />
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white p-1 mb-3 shadow-md border-2 border-surface-border overflow-hidden ring-2 ring-primary/20">
            <img
              src={logoUrl || '/uploads/bibi-1795498989551-27zh7uk.png'}
              alt={shopName}
              className="w-full h-full object-cover rounded-full scale-110"
              onError={(e) => {
                // fallback to default upload image if dynamic URL fails
                e.currentTarget.src = '/uploads/bibi-1795498989551-27zh7uk.png';
              }}
            />
          </div>
          <h1 className="text-lg font-semibold text-ink tracking-tight">
            {shopName} Admin
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            ระบบจัดการร้านและสต็อกสินค้า
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-semantic-red-lt border border-semantic-red/30 rounded text-semantic-red text-xs flex items-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] bg-surface text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              รหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-9 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] bg-surface text-ink font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink transition-colors"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="w-3.5 h-3.5"
                />
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
            <div className="pt-1 pb-1 flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                options={{
                  theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                  size: 'flexible',
                }}
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full mt-1"
          >
            เข้าสู่ระบบหลังบ้าน
          </Button>
        </form>

        <div className="mt-5 text-center text-[11px] text-ink-muted font-mono">
          Bibi&apos;s Treats Bakery Portal &copy; 2026
        </div>
      </Card>
    </div>
  );
}

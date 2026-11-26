'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faMagnifyingGlass,
  faEye,
  faEyeSlash,
  faTrashCan,
  faUser,
  faRotate,
  faXmark,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { downloadImageAsJpeg } from '@/lib/image-utils';
import type { ReviewItem } from '@/types';

type AdminReviewItem = ReviewItem;

interface AdminReviewStats {
  totalCount: number;
  visibleCount: number;
  hiddenCount: number;
  averageRating: number;
}

function formatThaiDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [stats, setStats] = useState<AdminReviewStats>({
    totalCount: 0,
    visibleCount: 0,
    hiddenCount: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);

  const loadReviews = useCallback(async (silentOrEvent?: boolean | unknown) => {
    const silent = silentOrEvent === true;
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (ratingFilter !== 'all') params.set('rating', ratingFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, ratingFilter, statusFilter]);

  useEffect(() => {
    loadReviews(false);
  }, [loadReviews]);

  useSmartPolling(() => loadReviews(true), 5000);

  const handleToggleStatus = async (review: AdminReviewItem) => {
    const nextStatus = review.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    setBusyId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await loadReviews();
      }
    } catch (err) {
      console.error('Failed to toggle review status:', err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review: AdminReviewItem) => {
    if (!window.confirm(`ยืนยันการลบรีวิวของ "${review.customerName}" ถาวร?`)) {
      return;
    }
    setBusyId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadReviews();
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            จัดการรีวิวจากลูกค้า
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            ตรวจสอบ แสดง/ซ่อน หรือลบรีวิวบนหน้าร้าน Bibi&apos;s Treats
          </p>
        </div>
        <button
          type="button"
          onClick={loadReviews}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface border border-surface-border text-xs font-medium text-ink hover:bg-surface-secondary transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <span className="text-xs text-ink-muted block">รีวิวทั้งหมด</span>
          <span className="text-2xl font-bold text-ink font-mono mt-1 block">
            {stats.totalCount}
          </span>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <span className="text-xs text-ink-muted block">คะแนนเฉลี่ย (ที่แสดง)</span>
          <span className="text-2xl font-bold text-amber-500 font-mono mt-1 flex items-center gap-1.5">
            <span>{stats.averageRating.toFixed(2)}</span>
            <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
          </span>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <span className="text-xs text-ink-muted block">🟢 แสดงบนเว็บ</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono mt-1 block">
            {stats.visibleCount}
          </span>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <span className="text-xs text-ink-muted block">🔴 ซ่อนไว้</span>
          <span className="text-2xl font-bold text-rose-600 font-mono mt-1 block">
            {stats.hiddenCount}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-xl border border-surface-border p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า หรือข้อความรีวิว..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-secondary border border-surface-border rounded-lg text-ink focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-secondary border border-surface-border rounded-lg text-ink focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกคะแนนดาว</option>
            <option value="5">⭐ 5 ดาว</option>
            <option value="4">⭐ 4 ดาว</option>
            <option value="3">⭐ 3 ดาว</option>
            <option value="2">⭐ 2 ดาว</option>
            <option value="1">⭐ 1 ดาว</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-secondary border border-surface-border rounded-lg text-ink focus:outline-none cursor-pointer"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="VISIBLE">🟢 แสดงบนเว็บ</option>
            <option value="HIDDEN">🔴 ซ่อนไว้</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-10 text-center text-xs text-ink-muted">
          กำลังโหลดข้อมูลรีวิว...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-10 text-center text-xs text-ink-muted">
          ไม่พบรีวิวตามเงื่อนไขที่ค้นหา
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isVisible = review.status === 'VISIBLE';
            const isBusy = busyId === review.id;
            return (
              <div
                key={review.id}
                className={`bg-surface rounded-xl border p-4 sm:p-5 transition-all ${
                  isVisible ? 'border-surface-border' : 'border-rose-200/70 bg-rose-50/20 opacity-85'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-lt text-primary-text flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-sm text-ink">
                        {review.customerName}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <FontAwesomeIcon
                            key={idx}
                            icon={faStar}
                            className={`w-3.5 h-3.5 ${
                              idx < review.rating ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        }`}
                      >
                        {isVisible ? '🟢 แสดง' : '🔴 ซ่อน'}
                      </span>
                      <span className="text-[11px] text-ink-muted font-mono">
                        {formatThaiDate(review.createdAt)}
                      </span>
                      {review.productName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/80">
                          {review.productName}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink-secondary leading-relaxed">
                      “{review.comment}”
                    </p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {review.images.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewImages(review.images)}
                            className="w-16 h-16 rounded-lg overflow-hidden border border-surface-border bg-surface-secondary hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <img
                              src={url}
                              alt={`รูปประกอบรีวิว ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStatus(review)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                        isVisible
                          ? 'bg-surface-secondary hover:bg-amber-50 text-ink border-surface-border'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={isVisible ? faEyeSlash : faEye}
                        className="w-3.5 h-3.5"
                      />
                      <span>{isVisible ? 'ซ่อนรีวิว' : 'แสดงรีวิว'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(review)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewImages && (
        <div
          onClick={() => setPreviewImages(null)}
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-2xl max-w-2xl w-full p-5 space-y-4 border border-surface-border shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">รูปภาพจากรีวิวลูกค้า</h3>
              <button
                type="button"
                onClick={() => setPreviewImages(null)}
                className="w-8 h-8 rounded-full bg-surface-secondary text-ink-muted hover:text-ink flex items-center justify-center cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {previewImages.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-surface-border">
                  <img
                    src={url}
                    alt={`รูปภาพ ${idx + 1}`}
                    className="w-full h-56 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => downloadImageAsJpeg(url, `review-photo-${idx + 1}.jpg`).catch(() => {})}
                    className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-medium shadow-md cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                    <span>JPEG</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faPlus,
  faMinus,
  faMagnifyingGlass,
  faRotate,
  faXmark,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { ProductWithImages } from '@/types';

type StockStatus = 'READY' | 'LOW' | 'OUT' | 'INACTIVE';

export default function AdminStockPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockStatus>('ALL');

  // Quick Restock modal
  const [restockProduct, setRestockProduct] = useState<ProductWithImages | null>(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?all=true');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load stock products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStockStatus = (p: ProductWithImages): StockStatus => {
    if (p.status === 'INACTIVE') return 'INACTIVE';
    if (p.stock === 0) return 'OUT';
    if (p.stock <= 5) return 'LOW';
    return 'READY';
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>พร้อมขาย</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>ใกล้หมด</span>
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>หมดแล้ว</span>
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>ปิดการขาย</span>
          </span>
        );
    }
  };

  // Update stock quantity
  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick Restock submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const newStock = restockProduct.stock + Number(restockAmount);
    await handleUpdateStock(restockProduct.id, newStock);
    setRestockProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(p);
    const matchStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const readyCount = products.filter((p) => getStockStatus(p) === 'READY').length;
  const lowCount = products.filter((p) => getStockStatus(p) === 'LOW').length;
  const outCount = products.filter((p) => getStockStatus(p) === 'OUT').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            จัดการสต็อกขนม
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ปรับสต็อกสินค้าแบบด่วน ตรวจสอบสถานะพร้อมขาย และเติมสต็อก
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm border border-slate-200 transition-colors active:scale-95"
        >
          <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชสต็อก</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">คงเหลือทั้งหมด</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1">
              {totalStock.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ชิ้น พร้อมส่ง</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faBoxesStacked} className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">พร้อมขาย (&gt;5)</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono mt-1">
              {readyCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">เมนูในระบบ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">ใกล้หมด (1-5)</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 font-mono mt-1">
              {lowCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ควรเติมเพิ่ม</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">หมดสต็อก (0)</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 font-mono mt-1">
              {outCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ปิดรับออเดอร์</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCircleXmark} className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อขนม เพื่อปรับสต็อก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none text-xs sm:text-sm bg-slate-50/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto p-1 touch-scroll custom-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('READY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'READY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              พร้อมขาย ({readyCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'LOW'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              ใกล้หมด ({lowCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OUT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'OUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              หมดแล้ว ({outCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'INACTIVE'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              ปิดการขาย
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE & TABLET STOCK CARDS (< 1024px)              */}
      {/* ==================================================== */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const status = getStockStatus(product);
            const primaryImage =
              product.images?.find((img) => img.isPrimary) || product.images?.[0];
            const sold = product.sold || 0;
            const soldPercent = Math.min(100, Math.round((sold / (product.stock + sold || 1)) * 100));

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3.5"
              >
                {/* Top Row: Thumbnail + Title + Category + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-center">
                      {primaryImage ? (
                        <img
                          src={primaryImage.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faCakeCandles} className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm tracking-tight truncate">
                        {product.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-block whitespace-nowrap text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {product.category}
                        </span>
                        <span className="font-semibold text-slate-900 font-mono text-xs whitespace-nowrap">
                          ฿{product.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getStatusBadge(status)}
                  </div>
                </div>

                {/* Stock Ratio & Progress Bar */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">
                      ขายแล้ว {sold} ชิ้น
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      คงเหลือ {product.stock} ชิ้น
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        product.stock === 0
                          ? 'bg-rose-500'
                          : product.stock <= 5
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, 100 - soldPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Touch-friendly Quick Stepper + Restock Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  {/* Stepper Controls */}
                  <div className="inline-flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      disabled={product.stock <= 0 || updatingId === product.id}
                      onClick={() => handleUpdateStock(product.id, product.stock - 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shadow-2xs border border-slate-200/70 transition-all active:scale-95 disabled:opacity-30"
                      title="ลด 1 ชิ้น"
                      aria-label="ลดสต็อก 1 ชิ้น"
                    >
                      <FontAwesomeIcon icon={faMinus} className="w-2.5 h-2.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0) {
                          handleUpdateStock(product.id, val);
                        }
                      }}
                      className="w-12 text-center font-mono font-bold text-sm bg-transparent outline-none text-slate-900"
                    />

                    <button
                      type="button"
                      disabled={updatingId === product.id}
                      onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shadow-2xs border border-slate-200/70 transition-all active:scale-95"
                      title="เพิ่ม 1 ชิ้น"
                      aria-label="เพิ่มสต็อก 1 ชิ้น"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Restock Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setRestockProduct(product);
                      setRestockAmount(10);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors active:scale-95 shadow-xs shrink-0"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                    <span>เติมสต็อก</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200/80">
            {loading ? 'กำลังโหลดรายการสต็อก...' : 'ไม่พบรายการขนมตามเงื่อนไขที่เลือก'}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* DESKTOP TABLE (Visible on screens >= 1024px)         */}
      {/* ==================================================== */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[850px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">เมนูขนม</th>
                <th className="px-5 py-3.5 whitespace-nowrap">หมวดหมู่</th>
                <th className="px-5 py-3.5 whitespace-nowrap">ราคาขาย</th>
                <th className="px-5 py-3.5 whitespace-nowrap">สถานะสต็อก</th>
                <th className="px-5 py-3.5 whitespace-nowrap">สัดส่วนขายแล้ว / คงเหลือ</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">ปรับจำนวนสต็อกด่วน</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">เติมสต็อก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  const primaryImage =
                    product.images?.find((img) => img.isPrimary) || product.images?.[0];
                  const sold = product.sold || 0;
                  const soldPercent = Math.min(100, Math.round((sold / (product.stock + sold || 1)) * 100));

                  return (
                    <tr key={product.id} className="bg-white hover:bg-slate-50/70 transition-colors">
                      {/* Name & Photo */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-center">
                            {primaryImage ? (
                              <img
                                src={primaryImage.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FontAwesomeIcon icon={faCakeCandles} className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm whitespace-nowrap">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-semibold text-slate-900 font-mono whitespace-nowrap">
                        ฿{product.price}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>

                      {/* Ratio Bar */}
                      <td className="px-5 py-3.5 min-w-[170px] whitespace-nowrap">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 font-mono text-[11px]">ขายแล้ว {sold}</span>
                          <span className="font-semibold text-slate-900 font-mono text-[11px]">คงเหลือ {product.stock}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              product.stock === 0
                                ? 'bg-rose-500'
                                : product.stock <= 5
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, 100 - soldPercent)}%` }}
                          />
                        </div>
                      </td>

                      {/* Quick Adjust (+ / - / input) */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            disabled={product.stock <= 0 || updatingId === product.id}
                            onClick={() => handleUpdateStock(product.id, product.stock - 1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs border border-slate-200/70 transition-all disabled:opacity-30 active:scale-95"
                            title="ลดลง 1 ชิ้น"
                            aria-label="ลด 1 ชิ้น"
                          >
                            <FontAwesomeIcon icon={faMinus} className="w-2.5 h-2.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={product.stock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0) {
                                handleUpdateStock(product.id, val);
                              }
                            }}
                            className="w-12 text-center font-mono font-bold text-xs bg-transparent outline-none text-slate-900"
                          />

                          <button
                            type="button"
                            disabled={updatingId === product.id}
                            onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs border border-slate-200/70 transition-all active:scale-95"
                            title="เพิ่ม 1 ชิ้น"
                            aria-label="เพิ่ม 1 ชิ้น"
                          >
                            <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* Restock Button */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setRestockProduct(product);
                            setRestockAmount(10);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors border border-slate-200/80 active:scale-95"
                        >
                          <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5 text-slate-400" />
                          <span>เติมสต็อก</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    {loading ? 'กำลังโหลดรายการสต็อก...' : 'ไม่พบรายการขนมตามเงื่อนไขที่เลือก'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-[95%] sm:w-full p-5 sm:p-6 shadow-2xl border border-slate-200/80 relative animate-in zoom-in-95 max-h-[88vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                เติมสต็อกด่วน
              </h3>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="ปิด"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1">
                <p className="text-slate-500">
                  ขนม: <strong className="text-slate-900 font-semibold">{restockProduct.name}</strong>
                </p>
                <p className="text-slate-500">
                  สต็อกปัจจุบัน: <span className="font-bold text-slate-900 font-mono">{restockProduct.stock} ชิ้น</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  เลือกจำนวนที่ต้องการเติมเพิ่ม:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border flex items-center justify-center active:scale-95 ${
                        restockAmount === amt
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">หรือระบุ:</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none text-sm font-mono font-bold text-slate-900"
                  />
                  <span className="text-xs text-slate-500 font-medium">ชิ้น</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
                <span>สต็อกใหม่จะเป็น:</span>
                <strong className="text-slate-900 font-bold font-mono text-sm">
                  {restockProduct.stock + Number(restockAmount)} ชิ้น
                </strong>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs active:scale-95"
                >
                  บันทึกเติมสต็อก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

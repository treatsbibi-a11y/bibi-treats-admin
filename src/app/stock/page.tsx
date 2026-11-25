'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faPlus,
  faMinus,
  faMagnifyingGlass,
  faRotate,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { showToast } from '@/components/ui/Toast';
import { ProductWithImages } from '@/types';

type StockStatus = 'READY' | 'LOW' | 'OUT' | 'INACTIVE';

export default function AdminStockPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockStatus>('ALL');

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
      showToast({ title: 'โหลดรายการสต็อกไม่สำเร็จ', variant: 'error' });
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

  const renderStockBadge = (status: StockStatus) => {
    switch (status) {
      case 'READY':
        return (
          <Badge variant="success" dot>
            พร้อมขาย
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="warning" dot>
            ใกล้หมด
          </Badge>
        );
      case 'OUT':
        return (
          <Badge variant="danger" dot>
            หมดแล้ว
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="neutral" dot>
            ปิดการขาย
          </Badge>
        );
    }
  };

  const handleUpdateStock = async (
    productId: string,
    newStock: number,
    notifySuccess = false
  ) => {
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
        if (notifySuccess) {
          showToast({
            title: 'เติมสต็อกสำเร็จ',
            description: `อัปเดตจำนวนคงเหลือเป็น ${newStock} ชิ้นแล้ว`,
            variant: 'success',
          });
        }
      } else {
        showToast({ title: 'อัปเดตสต็อกไม่สำเร็จ', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการอัปเดตสต็อก', variant: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const newStock = restockProduct.stock + Number(restockAmount);
    await handleUpdateStock(restockProduct.id, newStock, true);
    setRestockProduct(null);
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const status = getStockStatus(p);
      const matchStatus = statusFilter === 'ALL' || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const readyCount = products.filter((p) => getStockStatus(p) === 'READY').length;
  const lowCount = products.filter((p) => getStockStatus(p) === 'LOW').length;
  const outCount = products.filter((p) => getStockStatus(p) === 'OUT').length;

  const stockColumns: DataTableColumn<ProductWithImages>[] = [
    {
      key: 'name',
      header: 'เมนูขนม',
      sortable: true,
      sortValue: (p) => p.name,
      render: (product) => {
        const primaryImage =
          product.images?.find((img) => img.isPrimary) || product.images?.[0];
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <div className="w-10 h-10 rounded overflow-hidden bg-surface-secondary border border-surface-border shrink-0 flex items-center justify-center">
              {primaryImage ? (
                <img
                  src={primaryImage.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FontAwesomeIcon icon={faCakeCandles} className="w-4 h-4 text-ink-disabled" />
              )}
            </div>
            <span className="font-semibold text-ink text-[13px]">{product.name}</span>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'หมวดหมู่',
      sortable: true,
      sortValue: (p) => p.category,
      render: (product) => (
        <Badge variant="neutral" size="sm">
          {product.category}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'ราคาขาย',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.price,
      render: (product) => (
        <span className="font-semibold text-ink font-mono-num">฿{product.price}</span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะสต็อก',
      sortable: true,
      sortValue: (p) => getStockStatus(p),
      render: (product) => renderStockBadge(getStockStatus(product)),
    },
    {
      key: 'stock',
      header: 'ขายแล้ว / คงเหลือ',
      sortable: true,
      sortValue: (p) => p.stock,
      render: (product) => {
        const sold = product.sold || 0;
        const soldPercent = Math.min(
          100,
          Math.round((sold / (product.stock + sold || 1)) * 100)
        );
        return (
          <div className="min-w-[155px]">
            <div className="flex justify-between text-[11px] mb-1 font-mono-num">
              <span className="text-ink-muted">ขาย {sold}</span>
              <span className="font-semibold text-ink">เหลือ {product.stock}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-border-light overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  product.stock === 0
                    ? 'bg-semantic-red'
                    : product.stock <= 5
                    ? 'bg-semantic-yellow'
                    : 'bg-semantic-green'
                }`}
                style={{ width: `${Math.max(5, 100 - soldPercent)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'adjust',
      header: 'ปรับจำนวนด่วน',
      align: 'center',
      render: (product) => (
        <div className="inline-flex items-center gap-1 bg-surface-secondary p-0.5 rounded border border-surface-border">
          <button
            type="button"
            disabled={product.stock <= 0 || updatingId === product.id}
            onClick={() => handleUpdateStock(product.id, product.stock - 1)}
            className="w-6 h-6 rounded-sm bg-surface hover:bg-surface-border text-ink flex items-center justify-center border border-surface-border disabled:opacity-35 transition-colors"
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
            className="w-11 text-center font-mono-num font-semibold text-xs bg-transparent outline-none text-ink"
          />

          <button
            type="button"
            disabled={updatingId === product.id}
            onClick={() => handleUpdateStock(product.id, product.stock + 1)}
            className="w-6 h-6 rounded-sm bg-surface hover:bg-surface-border text-ink flex items-center justify-center border border-surface-border disabled:opacity-35 transition-colors"
            title="เพิ่ม 1 ชิ้น"
            aria-label="เพิ่ม 1 ชิ้น"
          >
            <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'restock',
      header: 'เติมสต็อก',
      align: 'right',
      render: (product) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            setRestockProduct(product);
            setRestockAmount(10);
          }}
        >
          <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5 text-primary-text" />
          <span>เติมสต็อก</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            จัดการสต็อกขนม
          </h1>
          <p className="text-xs sm:text-[13px] text-ink-secondary mt-0.5">
            ปรับสต็อกสินค้าแบบด่วน ตรวจสอบสถานะพร้อมขาย และเติมสต็อก
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
          <FontAwesomeIcon
            icon={faRotate}
            className={`w-3.5 h-3.5 text-ink-muted ${loading ? 'animate-spin' : ''}`}
          />
          <span>รีเฟรชสต็อก</span>
        </Button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-ink-muted">คงเหลือทั้งหมด</div>
            <div className="text-xl sm:text-2xl font-semibold text-ink font-mono-num mt-1">
              {totalStock.toLocaleString()}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">ชิ้น พร้อมส่ง</div>
          </div>
          <div className="w-9 h-9 rounded bg-surface-secondary text-ink-secondary flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faBoxesStacked} className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-ink-muted">พร้อมขาย (&gt;5)</div>
            <div className="text-xl sm:text-2xl font-semibold text-semantic-green font-mono-num mt-1">
              {readyCount}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">เมนูในระบบ</div>
          </div>
          <div className="w-9 h-9 rounded bg-semantic-green-lt text-semantic-green flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-ink-muted">ใกล้หมด (1-5)</div>
            <div className="text-xl sm:text-2xl font-semibold text-semantic-yellow font-mono-num mt-1">
              {lowCount}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">ควรเติมเพิ่ม</div>
          </div>
          <div className="w-9 h-9 rounded bg-semantic-yellow-lt text-semantic-yellow flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-ink-muted">หมดสต็อก (0)</div>
            <div className="text-xl sm:text-2xl font-semibold text-semantic-red font-mono-num mt-1">
              {outCount}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">ปิดรับออเดอร์</div>
          </div>
          <div className="w-9 h-9 rounded bg-semantic-red-lt text-semantic-red flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCircleXmark} className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อขนม เพื่อปรับสต็อก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs sm:text-[13px] bg-surface-secondary text-ink placeholder:text-ink-muted"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll no-scrollbar pb-0.5">
            {(
              [
                { key: 'ALL', label: `ทั้งหมด (${products.length})` },
                { key: 'READY', label: `พร้อมขาย (${readyCount})` },
                { key: 'LOW', label: `ใกล้หมด (${lowCount})` },
                { key: 'OUT', label: `หมดแล้ว (${outCount})` },
                { key: 'INACTIVE', label: 'ปิดการขาย' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                  statusFilter === tab.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-secondary text-ink-secondary border-surface-border hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Mobile Cards (< lg) */}
      <div className="lg:hidden space-y-2.5">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const status = getStockStatus(product);
            const primaryImage =
              product.images?.find((img) => img.isPrimary) || product.images?.[0];
            const sold = product.sold || 0;
            const soldPercent = Math.min(
              100,
              Math.round((sold / (product.stock + sold || 1)) * 100)
            );

            return (
              <Card key={product.id} className="p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-12 h-12 rounded overflow-hidden bg-surface-secondary border border-surface-border shrink-0 flex items-center justify-center">
                      {primaryImage ? (
                        <img
                          src={primaryImage.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCakeCandles}
                          className="w-4 h-4 text-ink-disabled"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink text-sm truncate">{product.name}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          {product.category}
                        </Badge>
                        <span className="font-semibold text-ink font-mono-num text-xs">
                          ฿{product.price}
                        </span>
                      </div>
                    </div>
                  </div>
                  {renderStockBadge(status)}
                </div>

                <div className="bg-surface-secondary p-2.5 rounded border border-surface-border-light space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-ink-muted">ขายแล้ว {sold} ชิ้น</span>
                    <span className="font-semibold text-ink">คงเหลือ {product.stock} ชิ้น</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-border-light overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        product.stock === 0
                          ? 'bg-semantic-red'
                          : product.stock <= 5
                          ? 'bg-semantic-yellow'
                          : 'bg-semantic-green'
                      }`}
                      style={{ width: `${Math.max(5, 100 - soldPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border-light">
                  <div className="inline-flex items-center gap-1 bg-surface-secondary p-0.5 rounded border border-surface-border">
                    <button
                      type="button"
                      disabled={product.stock <= 0 || updatingId === product.id}
                      onClick={() => handleUpdateStock(product.id, product.stock - 1)}
                      className="w-8 h-8 rounded-sm bg-surface hover:bg-surface-border text-ink flex items-center justify-center border border-surface-border disabled:opacity-35"
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
                      className="w-11 text-center font-mono-num font-semibold text-sm bg-transparent outline-none text-ink"
                    />
                    <button
                      type="button"
                      disabled={updatingId === product.id}
                      onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                      className="w-8 h-8 rounded-sm bg-surface hover:bg-surface-border text-ink flex items-center justify-center border border-surface-border"
                      aria-label="เพิ่มสต็อก 1 ชิ้น"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setRestockProduct(product);
                      setRestockAmount(10);
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    <span>เติมสต็อก</span>
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center text-ink-muted text-xs">
            {loading ? 'กำลังโหลดรายการสต็อก...' : 'ไม่พบรายการขนมตามเงื่อนไขที่เลือก'}
          </Card>
        )}
      </div>

      {/* Desktop DataTable (>= lg) */}
      <div className="hidden lg:block">
        <DataTable
          data={filteredProducts}
          columns={stockColumns}
          rowKey={(p) => p.id}
          loading={loading}
          loadingMessage="กำลังโหลดรายการสต็อก..."
          emptyMessage="ไม่พบรายการขนมตามเงื่อนไขที่เลือก"
          defaultPageSize={10}
          minWidthClass="min-w-[820px]"
        />
      </div>

      {/* Quick Restock Modal */}
      <Modal
        isOpen={Boolean(restockProduct)}
        onClose={() => setRestockProduct(null)}
        size="sm"
        title="เติมสต็อกด่วน"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRestockProduct(null)}>
              ยกเลิก
            </Button>
            <Button type="submit" form="restock-form" variant="primary" size="sm">
              บันทึกเติมสต็อก
            </Button>
          </>
        }
      >
        {restockProduct && (
          <form id="restock-form" onSubmit={handleRestockSubmit} className="space-y-4">
            <div className="bg-surface-secondary p-3 rounded border border-surface-border-light text-xs space-y-1">
              <p className="text-ink-muted">
                ขนม: <strong className="text-ink font-semibold">{restockProduct.name}</strong>
              </p>
              <p className="text-ink-muted">
                สต็อกปัจจุบัน:{' '}
                <span className="font-semibold text-ink font-mono-num">
                  {restockProduct.stock} ชิ้น
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-2">
                เลือกจำนวนที่ต้องการเติมเพิ่ม:
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[5, 10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRestockAmount(amt)}
                    className={`py-1.5 rounded text-xs font-mono-num font-semibold border transition-colors ${
                      restockAmount === amt
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-secondary text-ink-secondary border-surface-border hover:text-ink'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">หรือระบุ:</span>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  className="flex-1 px-3 py-1.5 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-mono-num font-semibold bg-surface text-ink"
                />
                <span className="text-xs text-ink-secondary font-medium">ชิ้น</span>
              </div>
            </div>

            <div className="p-3 rounded bg-primary-lt border border-primary/25 text-xs text-ink-secondary flex items-center justify-between">
              <span>สต็อกใหม่จะเป็น:</span>
              <strong className="text-primary-text font-bold font-mono-num text-sm">
                {restockProduct.stock + Number(restockAmount)} ชิ้น
              </strong>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

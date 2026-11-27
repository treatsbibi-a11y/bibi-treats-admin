'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faImage,
  faStar,
  faArrowUp,
  faArrowDown,
  faArrowUpFromBracket,
  faTriangleExclamation,
  faRotate,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { showToast } from '@/components/ui/Toast';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { convertImageToWebP } from '@/lib/image-utils';
import { ProductWithImages } from '@/types';

const CATEGORIES = [
  'ทั้งหมด',
  'บราวนี่ฟัดจ์',
  'เค้ก & ทาร์ต',
  'ชูครีม & พัฟ',
  'ซอฟต์คุกกี้',
  'มาการอง & เซ็ตของขวัญ',
  'Bakery',
  'Drinks',
];

const DEFAULT_CATEGORY = CATEGORIES[1];

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithImages | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithImages | null>(null);
  const [imageModalProduct, setImageModalProduct] = useState<ProductWithImages | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: DEFAULT_CATEGORY,
    price: 0,
    stock: 10,
    initialStock: 10,
    imageUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const fetchProducts = async (silentOrEvent?: boolean | unknown) => {
    const silent = silentOrEvent === true;
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/products?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      if (!silent) showToast({ title: 'โหลดข้อมูลสินค้าไม่สำเร็จ', variant: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
  }, []);

  useSmartPolling(() => fetchProducts(true), 5000);

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      category: DEFAULT_CATEGORY,
      price: 65,
      stock: 20,
      initialStock: 20,
      imageUrl: '',
    });
    setImageUploadError(null);
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
    if (searchParams.get('new') === '1') {
      openAddModal();
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    const list = products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      const matchCategory =
        selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });

    return list.sort((a, b) => {
      // 1. พร้อมขาย (ACTIVE) ขึ้นก่อน ปิดการขาย (INACTIVE) อยู่ล่าง
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      // 2. สินค้าสร้างล่าสุดขึ้นก่อน
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [products, search, selectedCategory, statusFilter]);

  const handleToggleStatus = async (product: ProductWithImages) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
        );
        showToast({
          title: newStatus === 'ACTIVE' ? 'เปิดขายสินค้าแล้ว' : 'ปิดการขายชั่วคราวแล้ว',
          description: product.name,
          variant: 'success',
        });
      } else {
        showToast({ title: 'เปลี่ยนสถานะสินค้าไม่สำเร็จ', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', variant: 'error' });
    }
  };

  const openEditModal = (product: ProductWithImages) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      initialStock: product.initialStock || product.stock,
      imageUrl: '',
    });
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const webpFile = await convertImageToWebP(file);
      const form = new FormData();
      form.append('file', webpFile);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }
      const data = await res.json();
      return data.url;
    } catch (err: any) {
      setImageUploadError(err.message);
      showToast({ title: err.message || 'อัปโหลดรูปภาพไม่สำเร็จ', variant: 'error' });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: Number(formData.price),
          stock: Number(formData.stock),
          initialStock: Number(formData.initialStock || formData.stock),
          images: formData.imageUrl
            ? [{ imageUrl: formData.imageUrl, isPrimary: true, displayOrder: 1 }]
            : [],
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        showToast({ title: 'เพิ่มเมนูใหม่สำเร็จ', description: formData.name, variant: 'success' });
        fetchProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast({ title: err.error || 'เกิดข้อผิดพลาดในการสร้างสินค้า', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการสร้างสินค้า', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: Number(formData.price),
          stock: Number(formData.stock),
          initialStock: Number(formData.initialStock),
        }),
      });
      if (res.ok) {
        setEditingProduct(null);
        showToast({ title: 'บันทึกการแก้ไขเมนูแล้ว', description: formData.name, variant: 'success' });
        fetchProducts();
      } else {
        showToast({ title: 'บันทึกการแก้ไขไม่สำเร็จ', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการบันทึก', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    const targetProduct = deletingProduct;
    try {
      const res = await fetch(`/api/products/${targetProduct.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletingProduct(null);
        setProducts((prev) => prev.filter((p) => p.id !== targetProduct.id));
        showToast({ title: 'ลบเมนูสินค้าแล้ว', description: targetProduct.name, variant: 'success' });
        fetchProducts();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast({ title: data.error || 'ลบสินค้าไม่สำเร็จ', variant: 'error' });
      }
    } catch {
      showToast({ title: 'เกิดข้อผิดพลาดในการลบสินค้า', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSelectedProductImages = async (productId: string) => {
    const prodRes = await fetch(`/api/products/${productId}`);
    if (prodRes.ok) {
      const freshProd = await prodRes.json();
      setImageModalProduct(freshProd);
      setProducts((prev) => prev.map((p) => (p.id === freshProd.id ? freshProd : p)));
    }
  };

  const handleAddImageToProduct = async (url: string) => {
    if (!imageModalProduct || !url) return;
    try {
      const res = await fetch(`/api/products/${imageModalProduct.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url,
          isPrimary: (imageModalProduct.images || []).length === 0,
          displayOrder: (imageModalProduct.images || []).length + 1,
        }),
      });
      if (res.ok) {
        await refreshSelectedProductImages(imageModalProduct.id);
        showToast({ title: 'อัปโหลดรูปภาพเพิ่มแล้ว', variant: 'success' });
      }
    } catch {
      showToast({ title: 'เพิ่มรูปภาพไม่สำเร็จ', variant: 'error' });
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!imageModalProduct) return;
    try {
      const res = await fetch(`/api/products/${imageModalProduct.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, isPrimary: true }),
      });
      if (res.ok) {
        await refreshSelectedProductImages(imageModalProduct.id);
        showToast({ title: 'ตั้งเป็นรูปภาพหลักแล้ว', variant: 'success' });
      }
    } catch {
      showToast({ title: 'ตั้งรูปหลักไม่สำเร็จ', variant: 'error' });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!imageModalProduct) return;
    try {
      const res = await fetch(
        `/api/products/${imageModalProduct.id}/images?imageId=${imageId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await refreshSelectedProductImages(imageModalProduct.id);
        showToast({ title: 'ลบรูปภาพแล้ว', variant: 'success' });
      }
    } catch {
      showToast({ title: 'ลบรูปภาพไม่สำเร็จ', variant: 'error' });
    }
  };

  const handleReorderImage = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!imageModalProduct || !imageModalProduct.images) return;
    const images = [...imageModalProduct.images];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const temp = images[index];
    images[index] = images[targetIndex];
    images[targetIndex] = temp;

    try {
      const res = await fetch(`/api/products/${imageModalProduct.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img, i) => ({
            id: img.id,
            displayOrder: i + 1,
            isPrimary: img.isPrimary,
          })),
        }),
      });
      if (res.ok) {
        await refreshSelectedProductImages(imageModalProduct.id);
      }
    } catch {
      showToast({ title: 'จัดลำดับรูปไม่สำเร็จ', variant: 'error' });
    }
  };

  const productColumns: DataTableColumn<ProductWithImages>[] = [
    {
      key: 'image',
      header: 'รูปภาพ',
      width: '72px',
      render: (product) => {
        const primaryImage =
          product.images?.find((img) => img.isPrimary) || product.images?.[0];
        return (
          <button
            type="button"
            onClick={() => setImageModalProduct(product)}
            className="w-11 h-11 rounded overflow-hidden bg-surface-secondary border border-surface-border relative group flex items-center justify-center"
            title="คลิกเพื่อจัดการรูปภาพ"
          >
            {primaryImage ? (
              <img
                src={primaryImage.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FontAwesomeIcon icon={faCakeCandles} className="w-4 h-4 text-ink-disabled" />
            )}
            {product.images && product.images.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 bg-sidebar-bg/85 text-white text-[9px] font-mono-num px-1 rounded-sm">
                +{product.images.length}
              </span>
            )}
          </button>
        );
      },
    },
    {
      key: 'name',
      header: 'ชื่อสินค้า & หมวดหมู่',
      sortable: true,
      sortValue: (p) => p.name,
      render: (product) => (
        <div className="min-w-0">
          <div className="font-semibold text-ink text-[13px] line-clamp-2">{product.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="neutral" size="sm">
              {product.category}
            </Badge>
            <span className="hidden xl:inline text-ink-muted text-xs line-clamp-1 max-w-xs">
              {product.description}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'ราคา',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.price,
      render: (product) => (
        <span className="font-semibold text-ink font-mono-num">฿{product.price}</span>
      ),
    },
    {
      key: 'stock',
      header: 'คงเหลือ / ขายแล้ว',
      sortable: true,
      sortValue: (p) => p.stock,
      render: (product) => (
        <div className="text-xs">
          <span
            className={`font-semibold font-mono-num ${
              product.stock === 0
                ? 'text-semantic-red'
                : product.stock <= 5
                ? 'text-semantic-yellow'
                : 'text-ink'
            }`}
          >
            เหลือ {product.stock} ชิ้น
          </span>
          <span className="text-ink-muted block text-[11px] font-mono-num mt-0.5">
            ขายแล้ว {product.sold || 0} ชิ้น
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      sortable: true,
      sortValue: (p) => p.status,
      render: (product) => {
        const isActive = product.status === 'ACTIVE';
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(product)}
            className="transition-opacity hover:opacity-85"
            title="คลิกเพื่อสลับสถานะ"
          >
            <Badge variant={isActive ? 'success' : 'neutral'} dot>
              {isActive ? 'พร้อมขาย' : 'ปิดการขาย'}
            </Badge>
          </button>
        );
      },
    },
    {
      key: 'actions',
      header: 'การจัดการ',
      align: 'right',
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setImageModalProduct(product)}
            className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors"
            title="จัดการรูปภาพ"
          >
            <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(product)}
            className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded text-ink-muted hover:text-primary-text hover:bg-primary-lt transition-colors"
            title="แก้ไขข้อมูลสินค้า"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingProduct(product)}
            className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded text-ink-muted hover:text-semantic-red hover:bg-semantic-red-lt transition-colors"
            title="ลบสินค้า"
          >
            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const inputClass =
    'w-full px-3 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] bg-surface text-ink';

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            จัดการเมนูสินค้า
          </h1>
          <p className="text-xs sm:text-[13px] text-ink-secondary mt-0.5">
            เพิ่ม แก้ไข ปรับราคา อัปเดตรูปภาพ และสถานะสินค้าหน้าร้าน
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <FontAwesomeIcon
              icon={faRotate}
              className={`w-3.5 h-3.5 text-ink-muted ${loading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">รีเฟรช</span>
          </Button>
          <Button variant="primary" size="sm" onClick={openAddModal}>
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>เพิ่มเมนูใหม่</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อขนม, รายละเอียด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs sm:text-[13px] bg-surface-secondary text-ink placeholder:text-ink-muted"
            />
          </div>

          <div className="inline-flex p-0.5 bg-surface-secondary rounded border border-surface-border text-xs w-full sm:w-auto">
            {(
              [
                { key: 'ALL', label: 'ทั้งหมด' },
                { key: 'ACTIVE', label: 'พร้อมขาย' },
                { key: 'INACTIVE', label: 'ปิดการขาย' },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatusFilter(s.key)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-sm transition-colors ${
                  statusFilter === s.key
                    ? 'bg-surface text-ink font-semibold shadow-subtle'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar touch-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-secondary text-ink-secondary border-surface-border hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Mobile Cards (< lg) */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const primaryImage =
              product.images?.find((img) => img.isPrimary) || product.images?.[0];
            const isActive = product.status === 'ACTIVE';

            return (
              <Card key={product.id} className="p-3.5 space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setImageModalProduct(product)}
                    className="w-16 h-16 shrink-0 rounded overflow-hidden bg-surface-secondary border border-surface-border relative"
                    title="แตะเพื่อจัดการรูปภาพ"
                  >
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-disabled">
                        <FontAwesomeIcon icon={faCakeCandles} className="w-5 h-5" />
                      </div>
                    )}
                    {product.images && product.images.length > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-sidebar-bg/85 text-white text-[9px] font-mono-num px-1 rounded-sm">
                        +{product.images.length}
                      </span>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink text-sm truncate">{product.name}</h3>
                      <span className="font-semibold text-ink font-mono-num text-sm shrink-0">
                        ฿{product.price}
                      </span>
                    </div>

                    <div className="mt-1">
                      <Badge variant="neutral" size="sm">
                        {product.category}
                      </Badge>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted font-mono-num">
                      <span
                        className={
                          product.stock === 0
                            ? 'text-semantic-red font-semibold'
                            : product.stock <= 5
                            ? 'text-semantic-yellow font-semibold'
                            : 'text-ink-secondary font-semibold'
                        }
                      >
                        เหลือ {product.stock} ชิ้น
                      </span>
                      <span>·</span>
                      <span>ขายแล้ว {product.sold || 0} ชิ้น</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-surface-border-light flex items-center justify-between gap-2">
                  <button type="button" onClick={() => handleToggleStatus(product)}>
                    <Badge variant={isActive ? 'success' : 'neutral'} dot>
                      {isActive ? 'พร้อมขาย' : 'ปิดการขาย'}
                    </Badge>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setImageModalProduct(product)}
                      title="จัดการรูปภาพ"
                    >
                      <FontAwesomeIcon icon={faImage} className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => openEditModal(product)}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" />
                      <span>แก้ไข</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setDeletingProduct(product)}
                      className="text-semantic-red hover:bg-semantic-red-lt"
                      title="ลบสินค้า"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2 p-8 text-center text-ink-muted text-xs">
            {loading ? 'กำลังโหลดรายการสินค้า...' : 'ไม่พบสินค้าตามเงื่อนไขที่ค้นหา'}
          </Card>
        )}
      </div>

      {/* Desktop DataTable (>= lg) */}
      <div className="hidden lg:block">
        <DataTable
          data={filteredProducts}
          columns={productColumns}
          rowKey={(p) => p.id}
          loading={loading}
          loadingMessage="กำลังโหลดรายการสินค้า..."
          emptyMessage="ไม่พบสินค้าตามเงื่อนไขที่ค้นหา"
          defaultPageSize={10}
          minWidthClass="min-w-0"
        />
      </div>

      {/* 1. ADD PRODUCT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มเมนูขนมใหม่"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              form="add-product-form"
              variant="primary"
              size="sm"
              isLoading={submitting}
              disabled={uploadingImage}
            >
              บันทึกเมนูใหม่
            </Button>
          </>
        }
      >
        <form id="add-product-form" onSubmit={handleAddSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="เช่น Strawberry Tartlet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              หมวดหมู่ *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              คำอธิบายขนม
            </label>
            <textarea
              rows={2}
              placeholder="รสชาติ วัตถุดิบ ความอร่อย หรือเคล็ดลับ..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                ราคาขาย (บาท) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={`${inputClass} font-mono-num`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                จำนวนสต็อกแรกเริ่ม *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: Number(e.target.value),
                    initialStock: Number(e.target.value),
                  })
                }
                className={`${inputClass} font-mono-num`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink-secondary">
              รูปภาพหลักของสินค้า
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-lt hover:bg-primary-md text-primary-text text-xs font-medium border border-primary/25 transition-colors">
                <FontAwesomeIcon icon={faArrowUpFromBracket} className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'กำลังอัปโหลด...' : 'เลือกไฟล์จากเครื่อง'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleFileUpload(file);
                      if (url) setFormData((prev) => ({ ...prev, imageUrl: url }));
                    }
                  }}
                />
              </label>
              <span className="text-xs text-ink-muted">หรือระบุ URL:</span>
            </div>

            <input
              type="url"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className={`${inputClass} text-xs`}
            />

            {formData.imageUrl && (
              <div className="w-16 h-16 rounded overflow-hidden border border-surface-border bg-surface-secondary">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {imageUploadError && (
              <p className="text-xs text-semantic-red">{imageUploadError}</p>
            )}
          </div>
        </form>
      </Modal>

      {/* 2. EDIT PRODUCT MODAL */}
      <Modal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={editingProduct ? `แก้ไขเมนู: ${editingProduct.name}` : undefined}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingProduct(null)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              form="edit-product-form"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              บันทึกการแก้ไข
            </Button>
          </>
        }
      >
        <form id="edit-product-form" onSubmit={handleEditSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              หมวดหมู่ *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              คำอธิบายขนม
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                ราคาขาย (บาท) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={`${inputClass} font-mono-num`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                สต็อกคงเหลือ *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className={`${inputClass} font-mono-num`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                สต็อกตั้งต้น
              </label>
              <input
                type="number"
                min="0"
                value={formData.initialStock}
                onChange={(e) =>
                  setFormData({ ...formData, initialStock: Number(e.target.value) })
                }
                className={`${inputClass} font-mono-num`}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* 3. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        size="sm"
        title={deletingProduct ? `ยืนยันการลบเมนู ${deletingProduct.name}?` : undefined}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              autoFocus
              onClick={() => setDeletingProduct(null)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={submitting}
              onClick={handleDeleteConfirm}
            >
              ยืนยันการลบ
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="w-10 h-10 rounded bg-semantic-red-lt text-semantic-red flex items-center justify-center">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />
          </div>
          <p className="text-ink-secondary leading-relaxed">
            การลบเมนูนี้จะนำสินค้าออกจากหน้าร้าน แต่{' '}
            <strong className="text-ink">ประวัติการสั่งซื้อย้อนหลังของลูกค้าจะยังคงปลอดภัย</strong>{' '}
            ไม่สูญหาย
          </p>
        </div>
      </Modal>

      {/* 4. MULTI-IMAGE MANAGEMENT MODAL */}
      <Modal
        isOpen={Boolean(imageModalProduct)}
        onClose={() => setImageModalProduct(null)}
        size="lg"
        title={
          imageModalProduct ? `จัดการรูปภาพ: ${imageModalProduct.name}` : undefined
        }
        subtitle="อัปโหลดรูปภาพ จัดลำดับรูป หรือตั้งค่าเป็นรูปภาพหลัก"
        footer={
          <Button variant="primary" size="sm" onClick={() => setImageModalProduct(null)}>
            เสร็จสิ้น
          </Button>
        }
      >
        {imageModalProduct && (
          <div className="space-y-4">
            <div className="p-3.5 rounded bg-primary-lt border border-dashed border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faArrowUpFromBracket}
                    className="w-3.5 h-3.5 text-primary-text"
                  />
                  <span>อัปโหลดรูปภาพใหม่สำหรับสินค้านี้</span>
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5">
                  รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5MB
                </p>
              </div>

              <label className="cursor-pointer px-3.5 py-2 rounded bg-primary hover:bg-primary-dk text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 shrink-0">
                <FontAwesomeIcon icon={faArrowUpFromBracket} className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'กำลังอัปโหลด...' : 'เลือกไฟล์รูปภาพ'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleFileUpload(file);
                      if (url) await handleAddImageToProduct(url);
                    }
                  }}
                />
              </label>
            </div>

            {imageUploadError && (
              <p className="text-xs text-semantic-red">{imageUploadError}</p>
            )}

            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                รูปภาพทั้งหมด ({imageModalProduct.images?.length || 0} รูป)
              </h4>

              {imageModalProduct.images && imageModalProduct.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {imageModalProduct.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`p-2.5 rounded border flex items-center gap-3 ${
                        img.isPrimary
                          ? 'border-primary bg-primary-lt'
                          : 'border-surface-border bg-surface'
                      }`}
                    >
                      <div className="w-14 h-14 rounded overflow-hidden bg-surface-secondary shrink-0 border border-surface-border">
                        <img
                          src={img.imageUrl}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {img.isPrimary ? (
                            <Badge variant="primary" size="sm">
                              <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" />
                              <span>รูปหลัก</span>
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="text-[11px] text-ink-secondary hover:text-primary-text font-medium inline-flex items-center gap-1 hover:underline"
                            >
                              <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" />
                              <span>ตั้งเป็นรูปหลัก</span>
                            </button>
                          )}
                          <span className="text-[10px] text-ink-muted font-mono-num">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderImage(idx, 'UP')}
                            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-secondary disabled:opacity-30"
                            title="เลื่อนขึ้น"
                          >
                            <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (imageModalProduct.images?.length || 1) - 1}
                            onClick={() => handleReorderImage(idx, 'DOWN')}
                            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-secondary disabled:opacity-30"
                            title="เลื่อนลง"
                          >
                            <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1 rounded text-ink-muted hover:text-semantic-red hover:bg-semantic-red-lt"
                            title="ลบรูปนี้"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ink-muted text-xs">
                  ยังไม่มีรูปภาพสำหรับสินค้านี้
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-muted text-xs">กำลังโหลด...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

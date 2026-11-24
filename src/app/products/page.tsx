'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faImage,
  faXmark,
  faStar,
  faArrowUp,
  faArrowDown,
  faArrowUpFromBracket,
  faTriangleExclamation,
  faRotate,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithImages | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithImages | null>(null);
  const [imageModalProduct, setImageModalProduct] = useState<ProductWithImages | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'บราวนี่ฟัดจ์',
    price: 0,
    stock: 10,
    initialStock: 10,
    imageUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Load products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?all=true');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // Toggle active/inactive
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
      }
    } catch (err) {
      console.error('Error toggling product status', err);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Brownies',
      price: 65,
      stock: 20,
      initialStock: 20,
      imageUrl: '',
    });
    setImageUploadError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
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

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const form = new FormData();
      form.append('file', file);
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
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Add Product
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
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการสร้างสินค้า');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Product
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
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Product
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Image Modal Operations
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
        const prodRes = await fetch(`/api/products/${imageModalProduct.id}`);
        if (prodRes.ok) {
          const freshProd = await prodRes.json();
          setImageModalProduct(freshProd);
          setProducts((prev) =>
            prev.map((p) => (p.id === freshProd.id ? freshProd : p))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!imageModalProduct) return;
    try {
      const res = await fetch(`/api/products/${imageModalProduct.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          isPrimary: true,
        }),
      });
      if (res.ok) {
        const prodRes = await fetch(`/api/products/${imageModalProduct.id}`);
        if (prodRes.ok) {
          const freshProd = await prodRes.json();
          setImageModalProduct(freshProd);
          setProducts((prev) =>
            prev.map((p) => (p.id === freshProd.id ? freshProd : p))
          );
        }
      }
    } catch (err) {
      console.error(err);
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
        const prodRes = await fetch(`/api/products/${imageModalProduct.id}`);
        if (prodRes.ok) {
          const freshProd = await prodRes.json();
          setImageModalProduct(freshProd);
          setProducts((prev) =>
            prev.map((p) => (p.id === freshProd.id ? freshProd : p))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorderImage = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!imageModalProduct || !imageModalProduct.images) return;
    const images = [...imageModalProduct.images];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    // Swap
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
        const prodRes = await fetch(`/api/products/${imageModalProduct.id}`);
        if (prodRes.ok) {
          const freshProd = await prodRes.json();
          setImageModalProduct(freshProd);
          setProducts((prev) =>
            prev.map((p) => (p.id === freshProd.id ? freshProd : p))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            จัดการเมนูสินค้า
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เพิ่ม แก้ไข ปรับราคา อัปเดตรูปภาพ และสถานะสินค้าหน้าร้าน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchProducts}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
            title="รีเฟรชข้อมูล"
            aria-label="รีเฟรชข้อมูล"
          >
            <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>เพิ่มเมนูใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อขนม, รายละเอียด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none text-xs sm:text-sm bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium w-full sm:w-auto justify-between border border-slate-200/60">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                พร้อมขาย
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-slate-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปิดการขาย
              </button>
            </div>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar touch-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE & TABLET PRODUCTS CARDS (< 1024px)           */}
      {/* ==================================================== */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const primaryImage =
              product.images?.find((img) => img.isPrimary) ||
              product.images?.[0];
            const isActive = product.status === 'ACTIVE';

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3"
              >
                {/* Top Row: Image + Main Info */}
                <div className="flex items-start gap-3.5">
                  <div
                    onClick={() => setImageModalProduct(product)}
                    className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 relative cursor-pointer active:scale-95 transition-transform"
                    title="แตะเพื่อจัดการรูปภาพ"
                  >
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FontAwesomeIcon icon={faCakeCandles} className="w-5 h-5" />
                      </div>
                    )}
                    {product.images && product.images.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-mono px-1 py-0.2 rounded">
                        +{product.images.length}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">
                        {product.name}
                      </h3>
                      <span className="font-bold text-slate-900 font-mono text-base shrink-0">
                        ฿{product.price}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-block whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                        {product.category}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`font-medium ${
                          product.stock === 0
                            ? 'text-rose-600'
                            : product.stock <= 5
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        เหลือ {product.stock} ชิ้น
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400 text-[11px]">
                        ขายแล้ว {product.sold || 0} ชิ้น
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Status Toggle & Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(product)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                        : 'bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isActive ? 'พร้อมขาย' : 'ปิดการขาย'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setImageModalProduct(product)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60 transition-colors"
                      title="จัดการรูปภาพ"
                    >
                      <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3 text-slate-400" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(product)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                      title="ลบสินค้า"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200/80">
            {loading ? 'กำลังโหลดรายการสินค้า...' : 'ไม่พบสินค้าตามเงื่อนไขที่ค้นหา'}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* DESKTOP TABLE (Visible on screens >= 1024px)         */}
      {/* ==================================================== */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[750px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5 w-20">รูปภาพ</th>
                <th className="px-5 py-3.5">ชื่อสินค้า & หมวดหมู่</th>
                <th className="px-5 py-3.5 whitespace-nowrap">ราคา</th>
                <th className="px-5 py-3.5 whitespace-nowrap">คงเหลือ / ขายแล้ว</th>
                <th className="px-5 py-3.5 whitespace-nowrap">สถานะ</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const primaryImage =
                    product.images?.find((img) => img.isPrimary) ||
                    product.images?.[0];
                  const isActive = product.status === 'ACTIVE';

                  return (
                    <tr
                      key={product.id}
                      className="bg-white hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Image Thumbnail */}
                      <td className="px-5 py-4">
                        <div
                          onClick={() => setImageModalProduct(product)}
                          className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 cursor-pointer relative group flex items-center justify-center"
                          title="คลิกเพื่อจัดการรูปภาพ"
                        >
                          {primaryImage ? (
                            <img
                              src={primaryImage.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <FontAwesomeIcon icon={faCakeCandles} className="w-5 h-5 text-slate-300" />
                          )}
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5" />
                          </div>
                          {product.images && product.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded">
                              +{product.images.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="px-5 py-4 min-w-[200px]">
                        <div className="font-semibold text-slate-900 text-sm">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                            {product.category}
                          </span>
                          <span className="text-slate-400 text-xs line-clamp-1 max-w-xs">
                            {product.description}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 font-mono text-sm">
                          ฿{product.price}
                        </span>
                      </td>

                      {/* Stock & Sold */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          <span
                            className={`font-semibold ${
                              product.stock === 0
                                ? 'text-rose-600'
                                : product.stock <= 5
                                ? 'text-amber-600'
                                : 'text-slate-700'
                            }`}
                          >
                            เหลือ {product.stock} ชิ้น
                          </span>
                          <span className="text-slate-400 block text-[11px] mt-0.5">
                            ขายแล้ว {product.sold || 0} ชิ้น
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isActive ? 'พร้อมขาย' : 'ปิดการขาย'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setImageModalProduct(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="จัดการรูปภาพ"
                          >
                            <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="แก้ไขข้อมูลสินค้า"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="ลบสินค้า"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    {loading ? 'กำลังโหลดรายการสินค้า...' : 'ไม่พบสินค้าตามเงื่อนไขที่ค้นหา'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. ADD PRODUCT MODAL                                 */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-bibi-200 relative animate-in fade-in zoom-in-95 max-h-[88vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                เพิ่มเมนูขนมใหม่
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อสินค้า *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Strawberry Tartlet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 focus:ring-2 focus:ring-bibi-200/50 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm bg-white"
                >
                  {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายขนม
                </label>
                <textarea
                  rows={2}
                  placeholder="รสชาติ วัตถุดิบ ความอร่อย หรือเคล็ดลับ..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-bibi-400 focus:ring-2 focus:ring-bibi-200/50 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ราคาขาย (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Initial Image Upload or URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รูปภาพหลักของสินค้า
                </label>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 min-h-[44px] rounded-2xl bg-bibi-50 hover:bg-bibi-100 text-bibi-700 text-xs font-semibold border border-bibi-200 transition-colors">
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
                    <span className="text-xs text-slate-400">หรือระบุ URL รูปภาพ:</span>
                  </div>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-xs"
                  />

                  {formData.imageUrl && (
                    <div className="mt-2 w-20 h-20 rounded-2xl overflow-hidden border border-bibi-200 bg-bibi-50">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {imageUploadError && (
                    <p className="text-xs text-rose-500">{imageUploadError}</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-bibi-400 hover:bg-bibi-500 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกเมนูใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. EDIT PRODUCT MODAL                                */}
      {/* ==================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-bibi-200 relative animate-in fade-in zoom-in-95 max-h-[88vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                แก้ไขเมนู: {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อสินค้า *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm bg-white"
                >
                  {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายขนม
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ราคาขาย (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สต็อกคงเหลือ *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สต็อกตั้งต้น
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) =>
                      setFormData({ ...formData, initialStock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. DELETE CONFIRMATION MODAL                         */}
      {/* ==================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-rose-200 relative animate-in fade-in zoom-in-95 max-h-[88vh] overflow-y-auto touch-scroll">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center text-xl mb-4">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              ยืนยันการลบเมนู {deletingProduct.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              การลบเมนูนี้จะนำสินค้าออกจากหน้าร้าน แต่{' '}
              <strong className="text-slate-700">ประวัติการสั่งซื้อย้อนหลังของลูกค้าจะยังคงปลอดภัยและสมบูรณ์</strong>{' '}
              ไม่สูญหาย
            </p>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. MULTI-IMAGE MANAGEMENT MODAL                      */}
      {/* ==================================================== */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-bibi-200 relative animate-in fade-in zoom-in-95 max-h-[88vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  จัดการรูปภาพ: {imageModalProduct.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  อัปโหลดรูปภาพ จัดลำดับรูป หรือตั้งค่าเป็นรูปภาพหลัก
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageModalProduct(null)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="my-4 p-3.5 sm:p-4 rounded-2xl bg-bibi-50/70 border border-dashed border-bibi-300">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faArrowUpFromBracket} className="w-3.5 h-3.5 text-bibi-500" />
                    <span>อัปโหลดรูปภาพใหม่สำหรับสินค้านี้</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5MB
                  </p>
                </div>

                <label className="cursor-pointer px-4 py-2.5 min-h-[44px] rounded-2xl bg-bibi-400 hover:bg-bibi-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5">
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
                <p className="text-xs text-rose-500 mt-2">{imageUploadError}</p>
              )}
            </div>

            {/* Images List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                รูปภาพทั้งหมด ({imageModalProduct.images?.length || 0} รูป)
              </h4>

              {imageModalProduct.images && imageModalProduct.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {imageModalProduct.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center space-x-3 ${
                        img.isPrimary
                          ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-bibi-200'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <img
                          src={img.imageUrl}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          {img.isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-bold text-[10px] shadow-sm">
                              <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" /> รูปหลัก
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="text-[10px] text-slate-500 hover:text-amber-600 font-semibold flex items-center gap-1 hover:underline"
                            >
                              <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" /> ตั้งเป็นรูปหลัก
                            </button>
                          )}
                          <span className="text-[10px] text-slate-400">
                            ลำดับ #{idx + 1}
                          </span>
                        </div>

                        {/* Image actions: Up, Down, Delete */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderImage(idx, 'UP')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                            title="เลื่อนขึ้น"
                          >
                            <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (imageModalProduct.images?.length || 1) - 1}
                            onClick={() => handleReorderImage(idx, 'DOWN')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                            title="เลื่อนลง"
                          >
                            <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
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
                <div className="text-center py-8 text-slate-400 text-xs">
                  ยังไม่มีรูปภาพสำหรับสินค้านี้
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setImageModalProduct(null)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-bibi-400 hover:bg-bibi-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore,
  faCreditCard,
  faTruck,
  faFloppyDisk,
  faCircleCheck,
  faQrcode,
  faRotate,
  faArrowUpFromBracket,
  faTrashCan,
  faMobileScreen,
  faTriangleExclamation,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { StoreSettingsData } from '@/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsData>({
    shopName: "Bibi's Treats",
    tagline: 'Sweet treats, happy hearts',
    logoUrl: null,
    qrImageUrl: '/images/thai-qr-payment.jpg',
    promptpayNumber: '086-296-5765',
    promptpayName: 'น.ส. ฮาบีบี บุตรแหล่',
    bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
    bankAccountNo: '142-1-52907-4',
    bankAccountName: 'น.ส. ฮาบีบี บุตรแหล่',
    defaultShippingFee: 40,
    isStoreOpen: true,
    announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }

      const data = await res.json();
      setSettings((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, logoUrl: null }));
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }

      const data = await res.json();
      setSettings((prev) => ({ ...prev, qrImageUrl: data.url }));
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปคิวอาร์');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleResetQr = () => {
    setSettings((prev) => ({ ...prev, qrImageUrl: '/images/thai-qr-payment.jpg' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('บันทึกการตั้งค่าไม่สำเร็จ');
      }

      const updated = await res.json();
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-bibi-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 font-cute">
              ตั้งค่าร้านค้าและระบบชำระเงิน
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            แก้ไขข้อมูลร้านค้า บัญชีพร้อมเพย์ ธนาคาร ค่าจัดส่ง และสถานะเปิด/ปิดร้าน
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchSettings}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-slate-50 hover:bg-bibi-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200 transition-colors active:scale-95"
          >
            <FontAwesomeIcon icon={faRotate} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-bibi-400 to-bibi-500 hover:from-bibi-500 hover:to-bibi-600 text-white text-xs sm:text-sm font-bold shadow-[0_4px_12px_rgba(77,167,232,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>

      {/* Success / Error notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-sm flex items-center space-x-2 shadow-sm animate-in fade-in">
          <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-sm flex items-center space-x-2 shadow-sm">
          <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Store Profile & Status */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-bibi-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                <FontAwesomeIcon icon={faStore} className="w-4 h-4 text-bibi-500" />
                <span>ข้อมูลร้านค้าและประกาศหน้าร้าน</span>
              </div>

              {/* Store Open/Closed Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-bibi-50/60 border border-bibi-100 gap-3">
                <div className="pr-2">
                  <div className="text-sm font-bold text-slate-800">
                    สถานะการเปิดรับออเดอร์
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {settings.isStoreOpen
                      ? 'เปิดรับออเดอร์ตามปกติ ลูกค้าสามารถกดสั่งซื้อได้'
                      : 'ปิดรับออเดอร์ชั่วคราว ลูกค้าจะไม่สามารถดำเนินการสั่งซื้อได้'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 min-h-[44px] min-w-[50px]">
                  <input
                    type="checkbox"
                    checked={settings.isStoreOpen}
                    onChange={(e) =>
                      setSettings({ ...settings, isStoreOpen: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Logo Customization */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {settings.logoUrl ? (
                      <div className="relative group flex-shrink-0">
                        <img
                          src={settings.logoUrl}
                          alt="Store Logo"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-bibi-300 shadow-sm bg-white"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-bibi-400 to-bibi-300 flex items-center justify-center text-white font-bold text-xl shadow-sm border border-bibi-200 flex-shrink-0">
                        BT
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-1">
                        <span>โลโก้ร้านค้า (Store Logo)</span>
                        <span className="text-xs font-normal text-slate-500">
                          {settings.logoUrl ? '• กำหนดเอง' : '• เริ่มต้น (BT)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        แสดงที่แถบเมนู (Navbar) ทั้งหน้าร้านและหน้าจัดการ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <label className={`flex-1 sm:flex-none cursor-pointer inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-colors ${uploadingLogo ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white hover:bg-bibi-50 text-bibi-700 border border-bibi-300 shadow-sm active:scale-95'}`}>
                      <FontAwesomeIcon icon={faArrowUpFromBracket} className={`w-3.5 h-3.5 ${uploadingLogo ? 'animate-spin' : ''}`} />
                      <span>{uploadingLogo ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปภาพโลโก้'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingLogo}
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center justify-center space-x-1 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors active:scale-95"
                        title="ใช้ค่าเริ่มต้น (BT)"
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                        <span>รีเซ็ต</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อร้านค้า (Shop Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.shopName}
                    onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สโลแกนร้าน (Tagline)
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความประกาศหน้าร้าน (Announcement)
                </label>
                <textarea
                  rows={2}
                  value={settings.announcement || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, announcement: e.target.value })
                  }
                  placeholder="เช่น อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                />
              </div>
            </div>

            {/* Section 2: Payment Settings */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-bibi-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 text-bibi-500" />
                <span>ข้อมูลการชำระเงิน (PromptPay & Bank Transfer)</span>
              </div>

              {/* Official Thai QR Code Payment Image Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white flex items-center justify-center flex-shrink-0 p-1">
                      <img
                        src={settings.qrImageUrl || '/images/thai-qr-payment.jpg'}
                        alt="PromptPay QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-1">
                        <span>รูปภาพ Thai QR Payment</span>
                        <span className="text-xs font-normal text-slate-500">
                          {settings.qrImageUrl ? '• รูปทางการ' : '• รูปมาตรฐาน'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        แสดงให้ลูกค้าสแกนจ่ายทันทีในหน้าคำสั่งซื้อสำเร็จ (Order Success)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <label className={`flex-1 sm:flex-none cursor-pointer inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-colors ${uploadingQr ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white hover:bg-bibi-50 text-bibi-700 border border-bibi-300 shadow-sm active:scale-95'}`}>
                      <FontAwesomeIcon icon={faArrowUpFromBracket} className={`w-3.5 h-3.5 ${uploadingQr ? 'animate-spin' : ''}`} />
                      <span>{uploadingQr ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปคิวอาร์'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingQr}
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>

                    {settings.qrImageUrl && settings.qrImageUrl !== '/images/thai-qr-payment.jpg' && (
                      <button
                        type="button"
                        onClick={handleResetQr}
                        className="inline-flex items-center justify-center space-x-1 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors active:scale-95"
                        title="ใช้รูปภาพเริ่มต้น"
                      >
                        <FontAwesomeIcon icon={faRotate} className="w-3 h-3" />
                        <span>รีเซ็ต</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์พร้อมเพย์ หรือ เลขบัตร ปชช. / นิติบุคคล *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.promptpayNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, promptpayNumber: e.target.value })
                    }
                    placeholder="เช่น 086-296-5765"
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อบัญชีพร้อมเพย์ *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.promptpayName}
                    onChange={(e) =>
                      setSettings({ ...settings, promptpayName: e.target.value })
                    }
                    placeholder="เช่น Bibi's Treats Cafe"
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  ข้อมูลการโอนผ่านบัญชีธนาคาร (Bank Transfer)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อธนาคาร *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.bankName}
                      onChange={(e) =>
                        setSettings({ ...settings, bankName: e.target.value })
                      }
                      placeholder="เช่น ธนาคารกสิกรไทย"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลขที่บัญชี *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.bankAccountNo}
                      onChange={(e) =>
                        setSettings({ ...settings, bankAccountNo: e.target.value })
                      }
                      placeholder="เช่น 123-4-56789-0"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-xs sm:text-sm font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อบัญชี *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.bankAccountName}
                      onChange={(e) =>
                        setSettings({ ...settings, bankAccountName: e.target.value })
                      }
                      placeholder="เช่น บจก. บิบิ ขนมหวาน"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Shipping Settings */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-bibi-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                <FontAwesomeIcon icon={faTruck} className="w-4 h-4 text-bibi-500" />
                <span>ค่าจัดส่งสินค้า (Shipping Fee)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ค่าจัดส่งมาตรฐานต่อออเดอร์ (บาท) *
                </label>
                <div className="flex items-center space-x-2 max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={settings.defaultShippingFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultShippingFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-slate-200 focus:border-bibi-400 outline-none text-sm font-bold text-slate-800"
                  />
                  <span className="text-sm font-semibold text-slate-500">บาท</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ระบบจะคำนวณบวกค่าจัดส่งนี้เข้าไปในทุกคำสั่งซื้อโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Customer Preview (1 col) */}
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-bibi-100 shadow-sm">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                <FontAwesomeIcon icon={faMobileScreen} className="w-4 h-4 text-bibi-500" />
                <span>ตัวอย่างที่ลูกค้าจะเห็น (Live Preview)</span>
              </div>

              {/* PromptPay Card Preview */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-bibi-500 to-bibi-400 text-white shadow-lg shadow-bibi-300/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-7 h-7 rounded-lg object-cover bg-white shadow-sm"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                        <FontAwesomeIcon icon={faCakeCandles} className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="font-bold text-sm tracking-wide font-cute">
                      {settings.shopName || "Bibi's Treats"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                    พร้อมเพย์
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl text-center text-slate-800 shadow-inner flex flex-col items-center justify-center my-3">
                  <div className="w-32 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-hidden flex items-center justify-center">
                    <img
                      src={settings.qrImageUrl || '/images/thai-qr-payment.jpg'}
                      alt="Thai QR Payment"
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-800">
                    {settings.promptpayName || "น.ส. ฮาบีบี บุตรแหล่"}
                  </div>
                  <div className="text-[11px] text-bibi-700 font-mono font-bold">
                    {settings.promptpayNumber || '086-296-5765'}
                  </div>
                </div>

                <div className="text-[11px] text-white/90 space-y-1">
                  <div className="flex justify-between">
                    <span>ธนาคาร:</span>
                    <span className="font-semibold">{settings.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เลขที่บัญชี:</span>
                    <span className="font-mono font-bold">{settings.bankAccountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ชื่อบัญชี:</span>
                    <span className="font-semibold">{settings.bankAccountName}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/20">
                    <span>ค่าจัดส่งมาตรฐาน:</span>
                    <span className="font-bold">฿{settings.defaultShippingFee}</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator Preview */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-400 block mb-1">สถานะร้านค้า:</span>
                {settings.isStoreOpen ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    เปิดรับออเดอร์ตามปกติ
                  </span>
                ) : (
                  <span className="font-bold text-rose-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    ปิดร้านชั่วคราว
                  </span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white p-4 rounded-3xl border border-bibi-100 shadow-sm static lg:sticky lg:bottom-4 z-10">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-bibi-400 to-bibi-500 hover:from-bibi-500 hover:to-bibi-600 text-white font-bold text-sm shadow-[0_4px_14px_rgba(77,167,232,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

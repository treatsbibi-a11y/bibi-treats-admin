'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore,
  faCreditCard,
  faTruck,
  faFloppyDisk,
  faRotate,
  faArrowUpFromBracket,
  faTrashCan,
  faMobileScreen,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
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
      showToast({ title: 'โหลดการตั้งค่าไม่สำเร็จ', variant: 'error' });
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
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }
      const data = await res.json();
      setSettings((prev) => ({ ...prev, logoUrl: data.url }));
      showToast({ title: 'อัปโหลดโลโก้เรียบร้อยแล้ว', variant: 'success' });
    } catch (err: any) {
      showToast({
        title: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
        variant: 'error',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }
      const data = await res.json();
      setSettings((prev) => ({ ...prev, qrImageUrl: data.url }));
      showToast({ title: 'อัปโหลดรูป QR Code เรียบร้อยแล้ว', variant: 'success' });
    } catch (err: any) {
      showToast({
        title: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปคิวอาร์',
        variant: 'error',
      });
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

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
      window.dispatchEvent(new CustomEvent('bibi-settings-updated', { detail: updated }));
      showToast({ title: 'บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว', variant: 'success' });
    } catch (err: any) {
      showToast({
        title: err.message || 'เกิดข้อผิดพลาดในการบันทึก',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded border border-surface-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] bg-surface text-ink';

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            ตั้งค่าร้านค้าและระบบชำระเงิน
          </h1>
          <p className="text-xs sm:text-[13px] text-ink-secondary mt-0.5">
            แก้ไขข้อมูลร้านค้า บัญชีพร้อมเพย์ ธนาคาร ค่าจัดส่ง และสถานะเปิด/ปิดร้าน
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
            <FontAwesomeIcon
              icon={faRotate}
              className={`w-3.5 h-3.5 text-ink-muted ${loading ? 'animate-spin' : ''}`}
            />
            <span>รีเฟรช</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={() => handleSubmit()}
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="w-3.5 h-3.5" />
            <span>บันทึกการตั้งค่า</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Section 1: Store Profile & Status */}
            <Card>
              <CardHeader className="flex items-center gap-2">
                <FontAwesomeIcon icon={faStore} className="w-4 h-4 text-primary-text" />
                <h2 className="text-[15px] font-semibold text-ink">
                  ข้อมูลร้านค้าและประกาศหน้าร้าน
                </h2>
              </CardHeader>

              <CardBody className="space-y-4">
                {/* Store Open/Closed Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded bg-surface-secondary border border-surface-border-light gap-3">
                  <div className="pr-2">
                    <div className="text-[13px] font-semibold text-ink">
                      สถานะการเปิดรับออเดอร์
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {settings.isStoreOpen
                        ? 'เปิดรับออเดอร์ตามปกติ ลูกค้าสามารถกดสั่งซื้อได้'
                        : 'ปิดรับออเดอร์ชั่วคราว ลูกค้าจะไม่สามารถดำเนินการสั่งซื้อได้'}
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.isStoreOpen}
                      onChange={(e) =>
                        setSettings({ ...settings, isStoreOpen: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>

                {/* Logo Customization */}
                <div className="p-3.5 rounded bg-surface-secondary border border-surface-border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Store Logo"
                        className="w-12 h-12 rounded object-cover border border-surface-border bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-primary flex items-center justify-center text-white font-bold text-base shrink-0">
                        BT
                      </div>
                    )}
                    <div>
                      <div className="text-[13px] font-semibold text-ink">
                        โลโก้ร้านค้า (Store Logo)
                        <span className="text-xs font-normal text-ink-muted ml-1.5">
                          {settings.logoUrl ? '• กำหนดเอง' : '• เริ่มต้น (BT)'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        แสดงที่แถบเมนูทั้งหน้าร้านและหน้าจัดการ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label
                      className={`flex-1 sm:flex-none cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-8 rounded text-xs font-medium border transition-colors ${
                        uploadingLogo
                          ? 'bg-surface-secondary text-ink-disabled border-surface-border cursor-not-allowed'
                          : 'bg-surface hover:bg-surface-secondary text-ink border-surface-border'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={faArrowUpFromBracket}
                        className={`w-3 h-3 ${uploadingLogo ? 'animate-spin' : ''}`}
                      />
                      <span>{uploadingLogo ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโลโก้'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingLogo}
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {settings.logoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings((prev) => ({ ...prev, logoUrl: null }))}
                        className="text-semantic-red border-semantic-red/30 hover:bg-semantic-red-lt"
                        title="ใช้ค่าเริ่มต้น (BT)"
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="w-3 h-3" />
                        <span>รีเซ็ต</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      ชื่อร้านค้า (Shop Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.shopName}
                      onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      สโลแกนร้าน (Tagline)
                    </label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    ข้อความประกาศหน้าร้าน (Announcement)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.announcement || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, announcement: e.target.value })
                    }
                    placeholder="เช่น อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน"
                    className={inputClass}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Section 2: Payment Settings */}
            <Card>
              <CardHeader className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 text-primary-text" />
                <h2 className="text-[15px] font-semibold text-ink">
                  ข้อมูลการชำระเงิน (PromptPay &amp; Bank Transfer)
                </h2>
              </CardHeader>

              <CardBody className="space-y-4">
                <div className="p-3.5 rounded bg-surface-secondary border border-surface-border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded overflow-hidden border border-surface-border bg-white flex items-center justify-center shrink-0 p-1">
                      <img
                        src={settings.qrImageUrl || '/images/thai-qr-payment.jpg'}
                        alt="PromptPay QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-ink">
                        รูปภาพ Thai QR Payment
                        <span className="text-xs font-normal text-ink-muted ml-1.5">
                          {settings.qrImageUrl ? '• รูปทางการ' : '• รูปมาตรฐาน'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        แสดงให้ลูกค้าสแกนจ่ายในหน้าคำสั่งซื้อสำเร็จ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label
                      className={`flex-1 sm:flex-none cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-8 rounded text-xs font-medium border transition-colors ${
                        uploadingQr
                          ? 'bg-surface-secondary text-ink-disabled border-surface-border cursor-not-allowed'
                          : 'bg-surface hover:bg-surface-secondary text-ink border-surface-border'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={faArrowUpFromBracket}
                        className={`w-3 h-3 ${uploadingQr ? 'animate-spin' : ''}`}
                      />
                      <span>{uploadingQr ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปคิวอาร์'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingQr}
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>

                    {settings.qrImageUrl &&
                      settings.qrImageUrl !== '/images/thai-qr-payment.jpg' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              qrImageUrl: '/images/thai-qr-payment.jpg',
                            }))
                          }
                          className="text-semantic-red border-semantic-red/30 hover:bg-semantic-red-lt"
                        >
                          <FontAwesomeIcon icon={faRotate} className="w-3 h-3" />
                          <span>รีเซ็ต</span>
                        </Button>
                      )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
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
                      className={`${inputClass} font-mono-num font-semibold`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
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
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-border-light">
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
                    ข้อมูลการโอนผ่านบัญชีธนาคาร (Bank Transfer)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-secondary mb-1">
                        ชื่อธนาคาร *
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.bankName}
                        onChange={(e) =>
                          setSettings({ ...settings, bankName: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-secondary mb-1">
                        เลขที่บัญชี *
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.bankAccountNo}
                        onChange={(e) =>
                          setSettings({ ...settings, bankAccountNo: e.target.value })
                        }
                        className={`${inputClass} font-mono-num font-semibold`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-secondary mb-1">
                        ชื่อบัญชี *
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.bankAccountName}
                        onChange={(e) =>
                          setSettings({ ...settings, bankAccountName: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Section 3: Shipping Settings */}
            <Card>
              <CardHeader className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTruck} className="w-4 h-4 text-primary-text" />
                <h2 className="text-[15px] font-semibold text-ink">
                  ค่าจัดส่งสินค้า (Shipping Fee)
                </h2>
              </CardHeader>

              <CardBody>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  ค่าจัดส่งมาตรฐานต่อออเดอร์ (บาท) *
                </label>
                <div className="flex items-center gap-2 max-w-xs">
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
                    className={`${inputClass} font-mono-num font-semibold`}
                  />
                  <span className="text-xs font-medium text-ink-secondary shrink-0">บาท</span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1.5">
                  ระบบจะคำนวณบวกค่าจัดส่งนี้เข้าไปในทุกคำสั่งซื้อโดยอัตโนมัติ
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Live Customer Preview (Storefront Brand Blue Preserved Inside Preview) */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMobileScreen} className="w-4 h-4 text-primary-text" />
                <h2 className="text-sm font-semibold text-ink">
                  ตัวอย่างที่ลูกค้าจะเห็น (Live Preview)
                </h2>
              </CardHeader>

              <CardBody className="space-y-3.5">
                {/* Storefront Brand Card Preview (isolated light-surface with storefront #0F87E8 blue) */}
                <div className="force-light-surface p-4 rounded-lg bg-gradient-to-tr from-storefront-500 to-storefront-400 text-white shadow-card relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="w-7 h-7 rounded object-cover bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center text-white shrink-0">
                          <FontAwesomeIcon icon={faCakeCandles} className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="font-semibold text-sm truncate">
                        {settings.shopName || "Bibi's Treats"}
                      </span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold shrink-0">
                      พร้อมเพย์
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-md text-center text-slate-800 flex flex-col items-center justify-center my-2.5">
                    <div className="w-28 bg-white rounded border border-slate-200 p-1 overflow-hidden flex items-center justify-center">
                      <img
                        src={settings.qrImageUrl || '/images/thai-qr-payment.jpg'}
                        alt="Thai QR Payment"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-800">
                      {settings.promptpayName || 'น.ส. ฮาบีบี บุตรแหล่'}
                    </div>
                    <div className="text-[11px] text-storefront-600 font-mono font-bold">
                      {settings.promptpayNumber || '086-296-5765'}
                    </div>
                  </div>

                  <div className="text-[11px] text-white/95 space-y-1">
                    <div className="flex justify-between gap-2">
                      <span>ธนาคาร:</span>
                      <span className="font-semibold text-right truncate">{settings.bankName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>เลขที่บัญชี:</span>
                      <span className="font-mono font-bold">{settings.bankAccountNo}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>ชื่อบัญชี:</span>
                      <span className="font-semibold text-right truncate">
                        {settings.bankAccountName}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-white/20">
                      <span>ค่าจัดส่งมาตรฐาน:</span>
                      <span className="font-bold font-mono">฿{settings.defaultShippingFee}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-surface-secondary border border-surface-border-light text-xs">
                  <span className="text-ink-muted block mb-1">สถานะร้านค้า:</span>
                  {settings.isStoreOpen ? (
                    <span className="font-semibold text-semantic-green flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-semantic-green" />
                      เปิดรับออเดอร์ตามปกติ
                    </span>
                  ) : (
                    <span className="font-semibold text-semantic-red flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-semantic-red" />
                      ปิดร้านชั่วคราว
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="p-3.5 static lg:sticky lg:bottom-4 z-10">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={saving}
                className="w-full"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                <span>บันทึกการตั้งค่าทั้งหมด</span>
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

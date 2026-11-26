export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { resolveD1Binding } from '@/lib/d1-remote';
import { getD1StoreSettings } from '@/lib/d1';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings - get store settings
export async function GET(req: NextRequest) {
  try {
    const d1Binding = resolveD1Binding();
    if (!d1Binding) {
      return NextResponse.json(
        { error: 'ไม่พบการเชื่อมต่อฐานข้อมูล Cloudflare D1 (DB)' },
        { status: 503 }
      );
    }

    const settings = await getD1StoreSettings(d1Binding);
    if (settings) {
      return NextResponse.json(settings);
    }
    return NextResponse.json({
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
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดการตั้งค่าร้านค้า' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - update store settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const d1Binding = resolveD1Binding();
    if (!d1Binding) {
      return NextResponse.json(
        { error: 'ไม่พบการเชื่อมต่อฐานข้อมูล Cloudflare D1 (DB)' },
        { status: 503 }
      );
    }

    const existing = await d1Binding.prepare(`SELECT id FROM StoreSettings LIMIT 1`).bind().first();
    if (!existing) {
      await d1Binding.prepare(`
        INSERT INTO StoreSettings (
          id, shopName, tagline, logoUrl, qrImageUrl, promptpayNumber, promptpayName,
          bankName, bankAccountNo, bankAccountName, defaultShippingFee, isStoreOpen, announcement, updatedAt
        ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        body.shopName || "Bibi's Treats",
        body.tagline || 'Sweet treats, happy hearts',
        body.logoUrl || null,
        body.qrImageUrl || '/images/thai-qr-payment.jpg',
        body.promptpayNumber || '086-296-5765',
        body.promptpayName || 'น.ส. ฮาบีบี บุตรแหล่',
        body.bankName || 'ธนาคารกสิกรไทย (Kasikorn Bank)',
        body.bankAccountNo || '142-1-52907-4',
        body.bankAccountName || 'น.ส. ฮาบีบี บุตรแหล่',
        body.defaultShippingFee !== undefined ? Number(body.defaultShippingFee) : 40,
        body.isStoreOpen !== undefined ? (body.isStoreOpen ? 1 : 0) : 1,
        body.announcement || null
      ).run();
    } else {
      const updates: string[] = [];
      const params: any[] = [];
      if (body.shopName !== undefined) { updates.push('shopName = ?'); params.push(String(body.shopName).trim()); }
      if (body.tagline !== undefined) { updates.push('tagline = ?'); params.push(String(body.tagline).trim()); }
      if (body.logoUrl !== undefined) { updates.push('logoUrl = ?'); params.push(body.logoUrl ? String(body.logoUrl).trim() : null); }
      if (body.qrImageUrl !== undefined) { updates.push('qrImageUrl = ?'); params.push(body.qrImageUrl ? String(body.qrImageUrl).trim() : null); }
      if (body.promptpayNumber !== undefined) { updates.push('promptpayNumber = ?'); params.push(String(body.promptpayNumber).trim()); }
      if (body.promptpayName !== undefined) { updates.push('promptpayName = ?'); params.push(String(body.promptpayName).trim()); }
      if (body.bankName !== undefined) { updates.push('bankName = ?'); params.push(String(body.bankName).trim()); }
      if (body.bankAccountNo !== undefined) { updates.push('bankAccountNo = ?'); params.push(String(body.bankAccountNo).trim()); }
      if (body.bankAccountName !== undefined) { updates.push('bankAccountName = ?'); params.push(String(body.bankAccountName).trim()); }
      if (body.defaultShippingFee !== undefined) { updates.push('defaultShippingFee = ?'); params.push(Number(body.defaultShippingFee)); }
      if (body.isStoreOpen !== undefined) { updates.push('isStoreOpen = ?'); params.push(body.isStoreOpen ? 1 : 0); }
      if (body.announcement !== undefined) { updates.push('announcement = ?'); params.push(body.announcement ? String(body.announcement).trim() : null); }
      updates.push("updatedAt = datetime('now')");

      if (updates.length > 0) {
        const sql = `UPDATE StoreSettings SET ${updates.join(', ')} WHERE id = ?`;
        params.push(existing.id);
        await d1Binding.prepare(sql).bind(...params).run();
      }
    }

    const updatedSettings = await getD1StoreSettings(d1Binding);
    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่าร้านค้า' },
      { status: 500 }
    );
  }
}

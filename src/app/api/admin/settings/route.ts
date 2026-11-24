export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getD1StoreSettings } from '@/lib/d1';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings - get store settings
export async function GET(req: NextRequest) {
  try {
    try {
      const ctx = getRequestContext();
      const d1Binding = (ctx?.env as any)?.DB;
      if (d1Binding) {
        const settings = await getD1StoreSettings(d1Binding);
        if (settings) {
          return NextResponse.json(settings);
        }
      }
    } catch (e) {
      console.warn('[D1 Edge] Fallback to prisma for settings:', e);
    }
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: 'default',
          shopName: "Bibi's Treats",
          tagline: 'Sweet treats, happy hearts',
          promptpayNumber: '086-296-5765',
          promptpayName: 'น.ส. ฮาบีบี บุตรแหล่',
          bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
          bankAccountNo: '142-1-52907-4',
          bankAccountName: 'น.ส. ฮาบีบี บุตรแหล่',
          defaultShippingFee: 40,
          isStoreOpen: true,
          announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน',
        },
      });
    }

    return NextResponse.json(settings);
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

    // Direct D1 Edge handling
    try {
      const ctx = getRequestContext();
      const d1Binding = (ctx?.env as any)?.DB;
      if (d1Binding) {
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
      }
    } catch (edgeErr) {
      console.warn('[D1 Edge PUT] fallback to prisma:', edgeErr);
    }

    const updated = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        shopName: body.shopName ?? "Bibi's Treats",
        tagline: body.tagline ?? 'Sweet treats, happy hearts',
        logoUrl: body.logoUrl ?? null,
        qrImageUrl: body.qrImageUrl ?? '/images/thai-qr-payment.jpg',
        promptpayNumber: body.promptpayNumber ?? '086-296-5765',
        promptpayName: body.promptpayName ?? 'น.ส. ฮาบีบี บุตรแหล่',
        bankName: body.bankName ?? 'ธนาคารกสิกรไทย (Kasikorn Bank)',
        bankAccountNo: body.bankAccountNo ?? '142-1-52907-4',
        bankAccountName: body.bankAccountName ?? 'น.ส. ฮาบีบี บุตรแหล่',
        defaultShippingFee:
          body.defaultShippingFee !== undefined ? Number(body.defaultShippingFee) : 40,
        isStoreOpen:
          body.isStoreOpen !== undefined ? Boolean(body.isStoreOpen) : true,
        announcement: body.announcement ?? null,
      },
      update: {
        ...(body.shopName !== undefined ? { shopName: String(body.shopName).trim() } : {}),
        ...(body.tagline !== undefined ? { tagline: String(body.tagline).trim() } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl ? String(body.logoUrl).trim() : null } : {}),
        ...(body.qrImageUrl !== undefined ? { qrImageUrl: body.qrImageUrl ? String(body.qrImageUrl).trim() : null } : {}),
        ...(body.promptpayNumber !== undefined
          ? { promptpayNumber: String(body.promptpayNumber).trim() }
          : {}),
        ...(body.promptpayName !== undefined
          ? { promptpayName: String(body.promptpayName).trim() }
          : {}),
        ...(body.bankName !== undefined ? { bankName: String(body.bankName).trim() } : {}),
        ...(body.bankAccountNo !== undefined
          ? { bankAccountNo: String(body.bankAccountNo).trim() }
          : {}),
        ...(body.bankAccountName !== undefined
          ? { bankAccountName: String(body.bankAccountName).trim() }
          : {}),
        ...(body.defaultShippingFee !== undefined
          ? { defaultShippingFee: Number(body.defaultShippingFee) }
          : {}),
        ...(body.isStoreOpen !== undefined
          ? { isStoreOpen: Boolean(body.isStoreOpen) }
          : {}),
        ...(body.announcement !== undefined ? { announcement: body.announcement } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่าร้านค้า' },
      { status: 500 }
    );
  }
}

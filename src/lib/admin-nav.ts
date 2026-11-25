import {
  faChartPie,
  faBagShopping,
  faBox,
  faBoxesStacked,
  faChartLine,
  faGear,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  icon: IconDefinition;
  exact?: boolean;
  keywords?: string[];
}

export interface AdminNavGroup {
  key: string;
  label: string;
  items: AdminNavItem[];
}

export const NAV_GROUPS: AdminNavGroup[] = [
  {
    key: 'overview',
    label: 'ภาพรวม',
    items: [
      {
        key: 'dashboard',
        href: '/',
        label: 'แดชบอร์ด',
        icon: faChartPie,
        exact: true,
        keywords: ['dashboard', 'home', 'overview', 'ภาพรวม', 'ยอดขาย'],
      },
    ],
  },
  {
    key: 'commerce',
    label: 'การขายและคลัง',
    items: [
      {
        key: 'orders',
        href: '/orders',
        label: 'รายการคำสั่งซื้อ',
        icon: faBagShopping,
        keywords: ['orders', 'ออเดอร์', 'คำสั่งซื้อ', 'สลิป', 'ใบเสร็จ'],
      },
      {
        key: 'products',
        href: '/products',
        label: 'สินค้าและรูปภาพ',
        icon: faBox,
        keywords: ['products', 'menu', 'สินค้า', 'เมนู', 'รูปภาพ'],
      },
      {
        key: 'stock',
        href: '/stock',
        label: 'จัดการสต็อกสินค้า',
        icon: faBoxesStacked,
        keywords: ['stock', 'inventory', 'สต็อก', 'คลัง'],
      },
    ],
  },
  {
    key: 'system',
    label: 'วิเคราะห์และระบบ',
    items: [
      {
        key: 'reports',
        href: '/reports',
        label: 'รายงานยอดขาย',
        icon: faChartLine,
        keywords: ['reports', 'excel', 'pdf', 'รายงาน', 'สรุปยอด'],
      },
      {
        key: 'settings',
        href: '/settings',
        label: 'ตั้งค่าร้านค้า',
        icon: faGear,
        keywords: ['settings', 'qr', 'promptpay', 'ตั้งค่า', 'ธนาคาร'],
      },
    ],
  },
];

export const ALL_NAV_ITEMS: AdminNavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function isNavItemActive(pathname: string, item: AdminNavItem): boolean {
  const normalized =
    pathname.startsWith('/admin') && pathname !== '/admin'
      ? pathname.slice('/admin'.length)
      : pathname === '/admin'
      ? '/'
      : pathname;

  if (item.exact) {
    return normalized === item.href || (item.href === '/' && normalized === '/dashboard');
  }
  return normalized === item.href || normalized.startsWith(`${item.href}/`);
}

export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const active = ALL_NAV_ITEMS.find((item) => isNavItemActive(pathname, item));
  if (!active || active.key === 'dashboard') {
    return [{ label: 'หน้าหลัก', href: '/' }, { label: 'แดชบอร์ด' }];
  }
  return [{ label: 'หน้าหลัก', href: '/' }, { label: active.label }];
}

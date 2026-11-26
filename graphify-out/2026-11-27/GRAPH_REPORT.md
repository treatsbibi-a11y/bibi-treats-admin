# Graph Report - admin-bibi-store  (2026-11-26)

## Corpus Check
- Corpus is ~34,599 words - fits in a single context window. You may not need a graph.

## Summary
- 371 nodes · 828 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- html2canvas / free-solid-svg-icons / rea
- AdminHeader / AdminHeader() / AdminHeade
- package.json / devDependencies / autopre
- dependencies / canvas-confetti@^1.9.4 / 
- client-s3@^3.1176.0 / client-s3 / route
- tsconfig.json / compilerOptions / allowJ
- recharts@^2.15.1 / recharts / ProductSal
- fontawesome-svg-core@^7.3.1 / fontawesom
- route / dynamic / GET()
- next-on-pages@^1.13.16 / next-on-pages /
- next / route / dynamic
- client / route / dynamic
- route / dynamic / GET()
- scripts / build / dev
- route / DELETE() / dynamic
- route / DELETE() / dynamic
- clsx@^2.1.1 / tailwind-merge@^2.6.0 / cl
- route / dynamic / GET()
- route / DELETE() / dynamic
- route / cleanPhone() / dynamic
- route / dynamic / GET()
- page / AdminReviewItem / AdminReviewsPag
- tailwindcss@^3.4.17 / tailwindcss / tail
- next / next.config / nextConfig
- bcryptjs@^2.4.3 / bcryptjs
- free-brands-svg-icons@^7.3.1 / free-bran
- adapter-d1@^7.10.1 / adapter-d1
- config / postcss.config

## God Nodes (most connected - your core abstractions)
1. `next` - 30 edges
2. `react` - 30 edges
3. `@fortawesome/free-solid-svg-icons` - 21 edges
4. `@fortawesome/react-fontawesome` - 19 edges
5. `Button()` - 19 edges
6. `showToast()` - 17 edges
7. `Card()` - 15 edges
8. `Modal()` - 15 edges
9. `compilerOptions` - 15 edges
10. `prisma` - 14 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getD1StoreSettings()`  [EXTRACTED]
  src/app/api/admin/settings/route.ts → src/lib/d1.ts
- `PUT()` --calls--> `getD1StoreSettings()`  [EXTRACTED]
  src/app/api/admin/settings/route.ts → src/lib/d1.ts
- `GET()` --calls--> `getD1OrderDetail()`  [EXTRACTED]
  src/app/api/orders/[id]/route.ts → src/lib/d1.ts
- `GET()` --calls--> `getD1Orders()`  [EXTRACTED]
  src/app/api/orders/route.ts → src/lib/d1.ts
- `GET()` --calls--> `getD1Products()`  [EXTRACTED]
  src/app/api/products/route.ts → src/lib/d1.ts

## Import Cycles
- None detected.

## Communities (29 total, 6 thin omitted)

### Community 0 - "html2canvas / free-solid-svg-icons / rea"
Cohesion: 0.09
Nodes (56): @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, react, DashboardRoute(), AdminLoginPage(), AdminOrdersPage(), DEFAULT_PAYMENT_INFO, OrdersContent() (+48 more)

### Community 1 - "AdminHeader / AdminHeader() / AdminHeade"
Cohesion: 0.09
Nodes (27): AdminHeader(), AdminHeaderProps, AdminShell(), AdminSidebar(), AdminSidebarProps, CommandPalette(), CommandPaletteProps, PaletteItem (+19 more)

### Community 2 - "package.json / devDependencies / autopre"
Cohesion: 0.11
Nodes (26): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.49, prisma@^5.22.0, @types/bcryptjs@^2.4.6, @types/canvas-confetti@^1.9.0, @types/jsonwebtoken@^9.0.8, @types/node@^20.17.19 (+18 more)

### Community 3 - "dependencies / canvas-confetti@^1.9.4 / "
Cohesion: 0.09
Nodes (22): dependencies, canvas-confetti@^1.9.4, @fortawesome/free-regular-svg-icons@^7.3.1, @fortawesome/free-solid-svg-icons@^7.3.1, @fortawesome/react-fontawesome@^3.5.0, html2canvas@^1.4.1, jose@^6.2.18, jsonwebtoken@^9.0.2 (+14 more)

### Community 4 - "client-s3@^3.1176.0 / client-s3 / route"
Cohesion: 0.14
Nodes (11): @aws-sdk/client-s3@^3.1176.0, @aws-sdk/client-s3, dynamic, runtime, dynamic, POST(), runtime, dynamic (+3 more)

### Community 5 - "tsconfig.json / compilerOptions / allowJ"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 6 - "recharts@^2.15.1 / recharts / ProductSal"
Cohesion: 0.19
Nodes (13): recharts@^2.15.1, recharts, ProductBarPoint, ProductSalesBarChart(), ProductSalesBarChartProps, SalesAreaChart(), ProductChartPoint, TopProductsBarChart() (+5 more)

### Community 7 - "fontawesome-svg-core@^7.3.1 / fontawesom"
Cohesion: 0.19
Nodes (12): @fortawesome/fontawesome-svg-core@^7.3.1, @fortawesome/fontawesome-svg-core, metadata, RootLayout(), applyThemeToDocument(), getSystemTheme(), ResolvedTheme, ThemeContext (+4 more)

### Community 8 - "route / dynamic / GET()"
Cohesion: 0.20
Nodes (12): dynamic, GET(), handleUpdateOrder(), PATCH(), PUT(), RouteContext, runtime, VALID_STATUSES (+4 more)

### Community 9 - "next-on-pages@^1.13.16 / next-on-pages /"
Cohesion: 0.23
Nodes (10): @cloudflare/next-on-pages@^1.13.16, @cloudflare/next-on-pages, dynamic, GET(), PUT(), runtime, dynamic, GET() (+2 more)

### Community 10 - "next / route / dynamic"
Cohesion: 0.23
Nodes (10): next, dynamic, GET(), runtime, GET(), dynamic, GET(), runtime (+2 more)

### Community 11 - "client / route / dynamic"
Cohesion: 0.20
Nodes (6): @prisma/client, dynamic, runtime, dynamic, OrderItemInput, runtime

### Community 12 - "route / dynamic / GET()"
Cohesion: 0.27
Nodes (9): dynamic, GET(), POST(), runtime, comparePassword(), getAdminSession(), secretKey, signAdminToken() (+1 more)

### Community 13 - "scripts / build / dev"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, pages:build, postinstall, start

### Community 14 - "route / DELETE() / dynamic"
Cohesion: 0.29
Nodes (3): dynamic, RouteContext, runtime

### Community 15 - "route / DELETE() / dynamic"
Cohesion: 0.29
Nodes (3): dynamic, RouteContext, runtime

### Community 16 - "clsx@^2.1.1 / tailwind-merge@^2.6.0 / cl"
Cohesion: 0.33
Nodes (4): clsx@^2.1.1, tailwind-merge@^2.6.0, clsx, tailwind-merge

### Community 17 - "route / dynamic / GET()"
Cohesion: 0.47
Nodes (5): dynamic, GET(), handleLogout(), POST(), runtime

### Community 18 - "route / DELETE() / dynamic"
Cohesion: 0.33
Nodes (3): dynamic, RouteContext, runtime

### Community 19 - "route / cleanPhone() / dynamic"
Cohesion: 0.40
Nodes (5): cleanPhone(), dynamic, POST(), runtime, prisma

### Community 20 - "route / dynamic / GET()"
Cohesion: 0.50
Nodes (4): dynamic, GET(), parseImages(), runtime

### Community 21 - "page / AdminReviewItem / AdminReviewsPag"
Cohesion: 0.50
Nodes (4): AdminReviewItem, AdminReviewsPage(), AdminReviewStats, formatThaiDate()

### Community 22 - "tailwindcss@^3.4.17 / tailwindcss / tail"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.17, tailwindcss, config

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next / route / dynamic` to `html2canvas / free-solid-svg-icons / rea`, `AdminHeader / AdminHeader() / AdminHeade`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `client-s3@^3.1176.0 / client-s3 / route`, `fontawesome-svg-core@^7.3.1 / fontawesom`, `route / dynamic / GET()`, `next-on-pages@^1.13.16 / next-on-pages /`, `client / route / dynamic`, `route / dynamic / GET()`, `route / DELETE() / dynamic`, `route / DELETE() / dynamic`, `route / dynamic / GET()`, `route / DELETE() / dynamic`, `route / cleanPhone() / dynamic`, `route / dynamic / GET()`?**
  _High betweenness centrality (0.363) - this node is a cross-community bridge._
- **Should `html2canvas / free-solid-svg-icons / rea` be split into smaller, more focused modules?**
  _Cohesion score 0.08860759493670886 - nodes in this community are weakly interconnected._
- **Why does `react` connect `html2canvas / free-solid-svg-icons / rea` to `AdminHeader / AdminHeader() / AdminHeade`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `recharts@^2.15.1 / recharts / ProductSal`, `fontawesome-svg-core@^7.3.1 / fontawesom`, `page / AdminReviewItem / AdminReviewsPag`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `AdminHeader / AdminHeader() / AdminHeade` be split into smaller, more focused modules?**
  _Cohesion score 0.09358974358974359 - nodes in this community are weakly interconnected._
- **Why does `@fortawesome/free-solid-svg-icons` connect `html2canvas / free-solid-svg-icons / rea` to `AdminHeader / AdminHeader() / AdminHeade`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `page / AdminReviewItem / AdminReviewsPag`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `package.json / devDependencies / autopre` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._
- **Should `dependencies / canvas-confetti@^1.9.4 / ` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
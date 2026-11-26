# Graph Report - admin-bibi-store  (2026-11-27)

## Corpus Check
- 67 files · ~43,396 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .prisma 1, .css 1)

## Summary
- 429 nodes · 1020 edges · 30 communities (22 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad2e4312`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- html2canvas / free-solid-svg-icons / rea
- AdminHeader / AdminHeader() / AdminHeade
- package.json / devDependencies / autopre
- dependencies / canvas-confetti@^1.9.4 / 
- d1-remote.ts
- tsconfig.json / compilerOptions / allowJ
- recharts@^2.15.1 / recharts / ProductSal
- index.ts
- route / dynamic / GET()
- next-on-pages@^1.13.16 / next-on-pages /
- next / route / dynamic
- client / route / dynamic
- auth.ts
- scripts / build / dev
- route / DELETE() / dynamic
- route / DELETE() / dynamic
- clsx
- route / dynamic / GET()
- package.json
- sync-wrangler-env.mjs
- route / dynamic / GET()
- next
- tailwindcss@^3.4.17 / tailwindcss / tail
- next / next.config / nextConfig
- tailwind-merge
- @types/node@^20.17.19
- adapter-d1@^7.10.1 / adapter-d1
- config / postcss.config
- wrangler@^4.167.0

## God Nodes (most connected - your core abstractions)
1. `resolveD1Binding()` - 40 edges
2. `next` - 31 edges
3. `react` - 31 edges
4. `@fortawesome/free-solid-svg-icons` - 21 edges
5. `@fortawesome/react-fontawesome` - 19 edges
6. `Button()` - 19 edges
7. `showToast()` - 17 edges
8. `OrdersContent()` - 15 edges
9. `AdminDashboardPage()` - 15 edges
10. `Card()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `resolveD1Binding()`  [EXTRACTED]
  src/app/api/cloudflare/status/route.ts → src/lib/d1-remote.ts
- `getPrisma()` --calls--> `resolveD1Binding()`  [EXTRACTED]
  src/lib/prisma.ts → src/lib/d1-remote.ts
- `GET()` --calls--> `verifyAdminToken()`  [EXTRACTED]
  src/app/api/admin/login/route.ts → src/lib/auth.ts
- `POST()` --calls--> `signAdminToken()`  [EXTRACTED]
  src/app/api/admin/login/route.ts → src/lib/auth.ts
- `POST()` --calls--> `resolveD1Binding()`  [EXTRACTED]
  src/app/api/admin/login/route.ts → src/lib/d1-remote.ts

## Import Cycles
- None detected.

## Communities (30 total, 8 thin omitted)

### Community 0 - "html2canvas / free-solid-svg-icons / rea"
Cohesion: 0.07
Nodes (65): @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, react, DashboardRoute(), AdminOrdersPage(), DEFAULT_PAYMENT_INFO, getPaymentMethodLabel(), OrdersContent() (+57 more)

### Community 1 - "AdminHeader / AdminHeader() / AdminHeade"
Cohesion: 0.09
Nodes (31): @fortawesome/fontawesome-svg-core@^7.3.1, @fortawesome/fontawesome-svg-core, metadata, RootLayout(), AdminLoginPage(), AdminHeader(), AdminHeaderProps, AdminShell() (+23 more)

### Community 2 - "package.json / devDependencies / autopre"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer@^10.4.20, @cloudflare/next-on-pages@^1.13.16, @types/bcryptjs@^2.4.6, @types/canvas-confetti@^1.9.0, @types/jsonwebtoken@^9.0.8, @types/react@^18.3.18, @types/react-dom@^18.3.5 (+9 more)

### Community 3 - "dependencies / canvas-confetti@^1.9.4 / "
Cohesion: 0.11
Nodes (19): dependencies, @fortawesome/free-brands-svg-icons@^7.3.1, @fortawesome/free-regular-svg-icons@^7.3.1, @fortawesome/free-solid-svg-icons@^7.3.1, @fortawesome/react-fontawesome@^3.5.0, html2canvas@^1.4.1, jsonwebtoken@^9.0.2, lucide-react@^0.475.0 (+11 more)

### Community 4 - "d1-remote.ts"
Cohesion: 0.09
Nodes (27): @aws-sdk/client-s3@^3.1176.0, @aws-sdk/client-s3, dynamic, GET(), runtime, dynamic, POST(), runtime (+19 more)

### Community 5 - "tsconfig.json / compilerOptions / allowJ"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 6 - "recharts@^2.15.1 / recharts / ProductSal"
Cohesion: 0.16
Nodes (15): recharts@^2.15.1, recharts, AdminStats, SalesAreaChart, ProductBarPoint, ProductSalesBarChart(), ProductSalesBarChartProps, SalesAreaChart() (+7 more)

### Community 7 - "index.ts"
Cohesion: 0.17
Nodes (9): OrderStatusMeta, ORDER_STATUS_MAP, CartItem, OrderStatus, PaymentMethod, ReviewItem, ReviewRatingBreakdown, ReviewStats (+1 more)

### Community 8 - "route / dynamic / GET()"
Cohesion: 0.17
Nodes (14): dynamic, GET(), handleUpdateOrder(), PATCH(), PUT(), RouteContext, runtime, VALID_STATUSES (+6 more)

### Community 9 - "next-on-pages@^1.13.16 / next-on-pages /"
Cohesion: 0.17
Nodes (15): dynamic, GET(), PUT(), runtime, dynamic, GET(), runtime, AdminDashboardMetrics (+7 more)

### Community 10 - "next / route / dynamic"
Cohesion: 0.18
Nodes (14): DELETE(), dynamic, PATCH(), RouteContext, runtime, dynamic, GET(), runtime (+6 more)

### Community 11 - "client / route / dynamic"
Cohesion: 0.19
Nodes (10): @prisma/client@^5.22.0, @prisma/client, dynamic, GET(), runtime, dynamic, GET(), OrderItemInput (+2 more)

### Community 12 - "auth.ts"
Cohesion: 0.17
Nodes (14): bcryptjs@^2.4.3, jose@^6.2.18, bcryptjs, jose, GET(), getAdminSession(), getSecretKey(), signAdminToken() (+6 more)

### Community 13 - "scripts / build / dev"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, pages:build, postinstall, start

### Community 14 - "route / DELETE() / dynamic"
Cohesion: 0.25
Nodes (8): DELETE(), dynamic, getD1ProductImages(), POST(), PUT(), RouteContext, runtime, CloudflareD1Binding

### Community 15 - "route / DELETE() / dynamic"
Cohesion: 0.36
Nodes (7): DELETE(), dynamic, GET(), getD1ProductById(), PUT(), RouteContext, runtime

### Community 17 - "route / dynamic / GET()"
Cohesion: 0.47
Nodes (5): dynamic, GET(), handleLogout(), POST(), runtime

### Community 18 - "package.json"
Cohesion: 0.20
Nodes (9): canvas-confetti@^1.9.4, postcss@^8.4.49, prisma@^5.22.0, name, private, version, canvas-confetti, postcss (+1 more)

### Community 19 - "sync-wrangler-env.mjs"
Cohesion: 0.22
Nodes (4): candidates, envPath, toml, tomlPath

### Community 20 - "route / dynamic / GET()"
Cohesion: 0.32
Nodes (6): dynamic, GET(), parseImages(), runtime, getPrisma(), prisma

### Community 21 - "next"
Cohesion: 0.40
Nodes (5): next, dynamic, POST(), runtime, comparePassword()

### Community 22 - "tailwindcss@^3.4.17 / tailwindcss / tail"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.17, tailwindcss, config

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `html2canvas / free-solid-svg-icons / rea`, `AdminHeader / AdminHeader() / AdminHeade`, `dependencies / canvas-confetti@^1.9.4 / `, `d1-remote.ts`, `route / dynamic / GET()`, `next-on-pages@^1.13.16 / next-on-pages /`, `next / route / dynamic`, `client / route / dynamic`, `auth.ts`, `route / DELETE() / dynamic`, `route / DELETE() / dynamic`, `route / dynamic / GET()`, `package.json`, `route / dynamic / GET()`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Should `html2canvas / free-solid-svg-icons / rea` be split into smaller, more focused modules?**
  _Cohesion score 0.0748013090229079 - nodes in this community are weakly interconnected._
- **Why does `react` connect `html2canvas / free-solid-svg-icons / rea` to `AdminHeader / AdminHeader() / AdminHeade`, `package.json`, `dependencies / canvas-confetti@^1.9.4 / `, `recharts@^2.15.1 / recharts / ProductSal`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `AdminHeader / AdminHeader() / AdminHeade` be split into smaller, more focused modules?**
  _Cohesion score 0.08637873754152824 - nodes in this community are weakly interconnected._
- **Why does `@fortawesome/free-solid-svg-icons` connect `html2canvas / free-solid-svg-icons / rea` to `AdminHeader / AdminHeader() / AdminHeade`, `package.json`, `dependencies / canvas-confetti@^1.9.4 / `?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `package.json / devDependencies / autopre` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `dependencies / canvas-confetti@^1.9.4 / ` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
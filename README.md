# optima-analytics-platform

Optima Analytics Platform adalah dashboard analitik **React + Vite + TypeScript + Less + Zustand** untuk customer insight, purchase analytics, predictive analytics, dan marketing analytics.

## Stack

- React 19 + Vite
- TypeScript strict mode
- Less
- Zustand
- React Router DOM
- Lucide React
- Recharts
- Framer Motion
- Axios

## Menjalankan project

```bash
npm install
npm run dev
```

Validasi project:

```bash
npm run typecheck
npm run lint
npm run build
```

## Struktur utama

- `src/components/common`: komponen reusable
- `src/components/layout`: sidebar, topbar, dan layout
- `src/components/dashboard`: komponen dashboard
- `src/store`: Zustand stores dengan TypeScript
- `src/mock`: data sementara dan tipe data dashboard
- `src/styles`: token dan mixin Less global
- `public/reference/dashboard-reference.jpeg`: gambar referensi

## Alias import

Alias `@` mengarah ke folder `src`:

```ts
import GlassCard from '@/components/common/GlassCard/GlassCard'
```

## Environment

Salin `.env.example` menjadi `.env` bila API sudah tersedia:

```env
VITE_APP_NAME=Optima Analytics Platform
VITE_API_BASE_URL=http://localhost:3000/api
```

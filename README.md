# MediRuta — Web

Panel de administración de MediRuta (rol Administrador). React 18 + Vite 5 + TypeScript 5.8.

## Contexto del proyecto

Antes de tocar código, lee `context.md` en la raíz de este repo — es la fuente única de verdad del proyecto (sistema visual, arquitectura, reglas de trabajo). Si usas Cursor o Claude Code, ya se carga automáticamente.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa VITE_API_URL con la URL de mediruta-api
npm run dev
```

## Build y despliegue

```bash
npm run build      # genera dist/
npx vercel --prod   # despliega a producción (requiere sesión de Vercel)
```

Producción actual: https://mediruta-web-seven.vercel.app

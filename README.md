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

## Estado del proyecto

| Historia | Estado | Notas |
|---|---|---|
| **HU-01** — Gestión de acceso (login, refresh, cambio/recuperación de contraseña, logout) | ✅ Completa | Panel restringido a ROOT/ADMINISTRADOR — cualquier otro rol nunca llega a `autenticado` (`AuthProvider`). |
| **HU-08** — Validación de domiciliarios | ✅ Completa | Ver detalle abajo. |
| **HU-09** — Asignación automática de domiciliario | 🔜 Próxima | — |

### HU-08 — qué incluye

- `/domiciliarios` — lista de domiciliarios con validación pendiente (más antiguos primero).
- `/domiciliarios/:id` — detalle: datos, vehículo, los 4 documentos (URL firmada, clic abre en pestaña nueva), historial de decisiones previas.
- Botón **Aprobar** se deshabilita solo si falta algún documento/dato obligatorio, mostrando la lista exacta de qué falta — mismo cálculo que hace la API, para no depender de chocar con el error para avisar.
- Botón **Rechazar** exige un motivo (mínimo 5 caracteres) antes de confirmar.
- No hay una tabla de documentos propia de esta historia: reutiliza los documentos que ya sube el Domiciliario en HU-02 (App).

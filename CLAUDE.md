# MediRuta Web

Panel web de administración de MediRuta — React 18 + Vite 5 + TypeScript 5.8 (modo no-estricto).

**Antes de cualquier tarea de diseño o código, lee y respeta el contexto técnico completo del proyecto:**

@context.md

Ese documento es la fuente única de verdad — sistema visual (Parte A, la que más aplica directamente aquí: paleta, tipografía, componentización) y arquitectura/backend/BD/flujo de trabajo (Parte B, relevante para entender qué expone la API que este panel consume). Si una instrucción puntual contradice ese documento, el documento tiene prioridad, salvo que el equipo decida modificarlo explícitamente.

## Reglas operativas rápidas para este repo

- Paleta y tipografía oficiales únicamente (Parte A, secciones 3-6) — usa los tokens en `src/shared/styles/tokens.css`, no hardcodees hex ni fuentes nuevas.
- Estructura por entidad en `src/features/` (usuarios, solicitudes, domiciliarios, pedidos-entrega) — no organices por tipo técnico de archivo (sección 7).
- Este panel es el que usa el rol **Administrador** — antes de construir una pantalla, confirma en el backlog que la historia corresponde a ese rol (ver plan de Sprint 1).
- Las llamadas a la API van siempre a través de `src/features/<entidad>/api/` — nunca directamente a Supabase (no se usa Supabase Auth ni el cliente de Supabase aquí).
- Ninguna funcionalidad se implementa sin plan previo — usa el modo plan de Claude Code antes de escribir código (sección 12).
- Si una pantalla nueva corresponde a algo ya construido en la API, revisa la regla de paridad (sección 10) antes de darla por terminada.

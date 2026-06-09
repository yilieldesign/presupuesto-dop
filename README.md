# Presupuesto DOP

PWA mobile-first para técnicos audiovisuales: presupuesto semanal, optimización de cobros, deudas en RD$/US$ y metas de ahorro.

## Primer uso

- Al abrir por primera vez aparece la **bienvenida** con los 3 pasos iniciales.
- Los datos empiezan **vacíos** (sin deudas, sin transacciones).
- Todo se guarda en **LocalStorage** del dispositivo (privado, sin cuenta).
- Para empezar de cero: Presupuesto → **Reiniciar aplicación**.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Desplegar en Vercel

```bash
npm run build   # verificar que compila
npx vercel login
npx vercel --prod
```

O conecta el repositorio en [vercel.com](https://vercel.com) — detecta Next.js automáticamente.

## Instalar en iPhone

1. Abre la URL de Vercel en **Safari**
2. Compartir → **Agregar a pantalla de inicio**

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run test     # Tests del motor de deudas
```

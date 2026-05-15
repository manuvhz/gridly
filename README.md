# Gridly

Gridly es una plataforma web interactiva para el curso de Conceptos Basicos de Redes, creada para Manuel Vargas de la Universidad de Cordoba.

## Caracteristicas

- Login y registro funcionales con modo local.
- Integracion preparada para Firebase Auth mediante variables de entorno.
- Sistema de XP, niveles, rachas, ranking, insignias y certificados PDF.
- Dashboard con estadisticas, mapa de progreso, laboratorios visuales, simulador CLI y tutor de redes.
- Preparada para despliegue estatico en GitHub Pages.

## Firebase opcional

Para activar Firebase Auth, crea un archivo `.env.local` con:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Si esas variables no existen, Gridly usa autenticacion local de demostracion en el navegador.

## Scripts

```bash
npm install
npm run dev
npm run build
```

# API Érase una Vez (etapa 2, versión 2)

API REST en Node.js (Express) conectada a PostgreSQL en Supabase.
Incluye: inicio de sesión por roles, gestión de usuarios (con herencia: administrador, personal de recepción y docente), obras y cartelera de presentaciones (Sprint 1).

## Requisitos
- Node.js 20 o superior (nodejs.org, versión LTS)
- Visual Studio Code (con la extensión "REST Client")
- Base de datos creada en Supabase (carpeta `base-de-datos`)

## Puesta en marcha
1. En Supabase > SQL Editor:
   - Base de datos NUEVA y vacía: ejecuta `base-de-datos/01_modelo_fisico.sql` y luego `base-de-datos/02_datos_iniciales.sql`.
   - Si ya habías creado las tablas de la versión anterior: ejecuta solo `base-de-datos/03_migracion_a_v3.sql` (una sola vez).
2. En esta carpeta: `npm install`
3. Copia `.env.example` como `.env` y completa:
   - `DATABASE_URL`: en Supabase, botón **Connect** > **Session pooler**. Reemplaza `[YOUR-PASSWORD]` por tu contraseña.
   - `JWT_SECRET`: genera una con
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
4. Crea el primer administrador:
   `npm run crear-admin -- admin@teatro.com AdminSeguro123 "Nombres" "Apellidos"`
5. Inicia la API: `npm run dev`
6. Abre `pruebas.http` en VS Code y ejecuta las peticiones en orden.

## Endpoints
| Método | Ruta | Acceso |
|---|---|---|
| GET | /api/salud | Público |
| POST | /api/auth/register | Público (crea comprador) |
| POST | /api/auth/login | Público |
| GET | /api/auth/me | Con sesión |
| GET/POST/PATCH | /api/usuarios | Administrador |
| GET | /api/obras, /api/obras/:id | Público |
| POST/PUT/DELETE | /api/obras | Administrador |
| GET | /api/presentaciones (cartelera), /api/presentaciones/:id | Público |
| POST/PUT/DELETE | /api/presentaciones | Administrador |
| GET | /api/salas | Administrador |

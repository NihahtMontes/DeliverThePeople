# Guía de Supabase — Danilo

Tu responsabilidad es dejar la base de datos lista y accesible para los 6 integrantes del proyecto. Sigue esta guía en orden.

---

## Índice

| Paso | Qué haces | Tiempo estimado |
|------|-----------|-----------------|
| 1 | [Crear cuenta en Supabase](#1-crear-cuenta-en-supabase) | 2 min |
| 2 | [Crear nuevo proyecto](#2-crear-nuevo-proyecto) | 3 min |
| 3 | [Obtener credenciales de conexión](#3-obtener-credenciales-de-conexión) | 2 min |
| 4 | [Ejecutar el DDL](#4-ejecutar-el-ddl) | 2 min |
| 5 | [Ejecutar seeds](#5-ejecutar-seeds) | 2 min |
| 6 | [Invitar al equipo](#6-invitar-al-equipo) | 3 min |
| 7 | [Compartir archivo .env](#7-compartir-archivo-env) | 2 min |
| 8 | [Verificar que todo funciona](#8-verificar-que-todo-funciona) | 3 min |
| 9 | [Checklist de entrega](#9-checklist-de-entrega) | — |

**Tiempo total:** ~20 minutos

---

## 1. Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **Start your project**
3. Regístrate con GitHub (recomendado) o email
4. Verifica tu email si te lo pide

---

## 2. Crear nuevo proyecto

1. En el dashboard de Supabase, haz clic en **New project**
2. Selecciona una organización (crea una nueva si es necesario)
3. Llena los campos:
   - **Name:** `DeliverThePeople`
   - **Database Password:** genera una contraseña segura y **GUÁRDALA** (la necesitarás para el .env)
   - **Region:** elige la más cercana (ej. South America, US East)
4. Haz clic en **Create new project**
5. Espera ~2 minutos mientras se crea la base de datos

---

## 3. Obtener credenciales de conexión

1. En el menú lateral izquierdo, ve a **Settings** (ícono de engranaje)
2. Haz clic en **Database**
3. En la sección **Connection string**, busca **URI**
4. Copia el string de conexión. Se ve así:

```
postgresql://postgres.[project-ref]:[tu-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

5. De este string extraes las variables para el `.env`:

| Variable | Dónde está en el URI |
|----------|---------------------|
| `PGHOST` | La parte después del `@` y antes del `:` del puerto. Ej: `aws-0-us-east-1.pooler.supabase.com` |
| `PGPORT` | `6543` (si usas Session Pooler) o `5432` (si usas Transaction Pooler). Usa **6543**. |
| `PGDATABASE` | `postgres` |
| `PGUSER` | La parte entre `postgresql://` y el `:` en el URI. Ej: `postgres.[project-ref]` |
| `PGPASSWORD` | La contraseña que pusiste al crear el proyecto |

---

## 4. Ejecutar el DDL

El DDL está en `database/migrations/00001_esquema_inicial.sql`. Contiene las 16 tablas del sistema.

**Opción A — Desde SQL Editor (recomendado):**
1. En el menú lateral, ve a **SQL Editor**
2. Haz clic en **New query**
3. Abre el archivo `database/migrations/00001_esquema_inicial.sql` en tu editor de texto
4. Copia TODO el contenido y pégalo en el SQL Editor
5. Haz clic en **Run** (o Ctrl+Enter)
6. Verifica que no haya errores en la pestaña **Results**

**Opción B — Desde terminal (psql):**
```bash
psql "postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f database/migrations/00001_esquema_inicial.sql
```

> Si psql no está instalado, usa la Opción A.

---

## 5. Ejecutar seeds

Los seeds insertan datos de prueba: sucursales, empleados con contraseñas, pedidos, inventario, etc.

**Opción A — Desde SQL Editor:**
1. Abre otra **New query**
2. Copia el contenido de cada archivo en `server/seeds/` y pégalo en orden:
   - `sucursales.sql`
   - `empleados.sql`
   - `pedidos.sql`
   - `inventario.sql`
   - `equipos.sql`
3. Ejecuta cada uno con **Run**

**Opción B — Desde el proyecto (cuando el backend esté listo):**
```bash
cd server
node seeds/index.js
```

En este momento lo mejor es usar la **Opción A** (SQL Editor) porque el backend puede no estar listo aún.

---

## 6. Invitar al equipo

Para que los otros 5 puedan acceder a la base de datos:

1. En el menú lateral, ve a **Settings** → **Team**
2. Haz clic en **Invite**
3. Ingresa el email de cada persona:
   - Nihaht
   - Sandro
   - Camila
   - Fernando
   - Santiago
4. Selecciona el rol **Developer** para cada uno
5. Haz clic en **Send invitation**

Cada persona recibirá un email para unirse al proyecto de Supabase.

**Alternativa (más simple):** En lugar de invitar a cada uno al dashboard de Supabase, simplemente comparte el archivo `.env` con las credenciales de conexión. Todos usarán la misma conexión de PostgreSQL desde el backend. Esto es suficiente para desarrollo.

---

## 7. Compartir archivo .env

Crea el archivo `.env` en la raíz del proyecto con estos valores:

```env
# Servidor
PORT=3001

# Supabase PostgreSQL (obtenidos en el Paso 3)
PGHOST=aws-0-us-east-1.pooler.supabase.co
PGPORT=6543
PGDATABASE=postgres
PGUSER=postgres.[tu-project-ref]
PGPASSWORD=[la-contraseña-que-creaste]

# JWT
JWT_SECRET=deliver_the_people_2026_seguro
JWT_EXPIRES_IN=7d

# Frontend
VITE_API_URL=http://localhost:3001/api
```

> **IMPORTANTE:** `.env` NO se sube a GitHub. Ya está en `.gitignore`. Compártelo por WhatsApp, Discord o Signal.

Comparte este archivo con los 5 integrantes. Cada uno lo copia en su carpeta del proyecto.

---

## 8. Verificar que todo funciona

Desde el **SQL Editor** de Supabase, ejecuta estas consultas para confirmar que todo existe:

```sql
-- Ver tablas creadas (deben ser ~16)
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Ver que hay sucursales
SELECT * FROM sucursales;

-- Ver que hay empleados
SELECT id, email, nombre, apellido, rol, estado FROM empleados;

-- Ver que hay pedidos
SELECT id, numero_pedido, nombre_cliente, estado FROM pedidos;
```

---

## 9. Checklist de entrega

Marca cada item cuando esté completado:

- [ ] Cuenta de Supabase creada
- [ ] Proyecto `DeliverThePeople` creado y activo
- [ ] DDL ejecutado sin errores (16 tablas creadas)
- [ ] Seeds ejecutados sin errores
- [ ] Equipo invitado al proyecto (o .env compartido)
- [ ] Archivo `.env` entregado a los 5 integrantes
- [ ] Consultas de verificación ejecutadas y con datos

---

## Problemas comunes

| Problema | Solución |
|----------|----------|
| "relation already exists" al ejecutar DDL | Normal. El DDL usa `CREATE TABLE IF NOT EXISTS`. Ignora el aviso. |
| "password authentication failed" en psql | Revisa que la contraseña sea la correcta. En Supabase Settings → Database → Reset database password si es necesario. |
| No puedo invitar a alguien | El plan gratuito permite hasta 2 miembros. Mejor comparte el .env directamente y no invites al dashboard. |
| El proyecto se pausó | Los proyectos gratuitos se pausan después de 1 semana de inactividad. Entra al dashboard para reactivarlo. |
| psql no está instalado | Usa siempre el SQL Editor de Supabase si no tienes psql. |

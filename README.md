# Re-Manga — Frontend Web

Aplicación web frontend de **Re-Manga**, una tienda especializada en la compra y venta de mangas de segunda mano bajo modalidad de pago contraentrega. Construida con **Next.js (App Router)**, **React 19** y **TypeScript**, integrada con la API RESTful real del backend y protegida mediante autenticación JWT y autorización por roles (`USER` y `ADMIN`).

- **Repositorio Backend:** [https://github.com/A13RD/Re-Manga-Backend](https://github.com/A13RD/Re-Manga-Backend)
- **URL pública del Frontend (Producción):** _Pendiente de confirmación tras el despliegue en Vercel (`https://<proyecto-frontend>.vercel.app`)_

---

## 1. Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Librería UI:** React 19
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4 y variables CSS con soporte de tema claro/oscuro persistente
- **Estado y Sesión:** React Context API (`AuthContext`, `CartContext`, `FavoritesContext`, `ThemeContext`)

---

## 2. Instalación y Ejecución Local

1. Clonar el repositorio e instalar las dependencias:
   ```bash
   git clone https://github.com/A13RD/Re-Manga-Frontend.git
   cd Re-Manga-Frontend
   npm install
   ```

2. Crear el archivo `.env.local` (o `.env`) a partir de `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 3. Configuración de `NEXT_PUBLIC_API_URL`

El cliente HTTP centralizado (`lib/api.ts`) utiliza la variable de entorno pública `NEXT_PUBLIC_API_URL` para comunicarse con el backend:

- **En desarrollo local (`.env.local`):**
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:4000/api
  ```
- **En producción (Variables de entorno en Vercel — entorno Production):**
  ```env
  NEXT_PUBLIC_API_URL=https://<dominio-real-del-backend>/api
  ```

> **Normalización automática de rutas:** Las funciones `getApiBaseUrl()` y `buildApiUrl()` en `lib/api.ts` normalizan barras finales y el sufijo `/api` para garantizar que todas las peticiones apunten a `/api/...` sin producir rutas duplicadas (`/api/api/...`) ni omitir el prefijo.
>
> **Seguridad:** Nunca definas `JWT_SECRET`, cadenas de conexión de PostgreSQL ni contraseñas en las variables del frontend. El prefijo `NEXT_PUBLIC_` expone la variable al navegador y solo debe usarse para la URL pública de la API.

---

## 4. Compilación y Verificación de Producción

- **Verificar tipos con TypeScript:**
  ```bash
  npx tsc --noEmit
  ```
- **Ejecutar ESLint:**
  ```bash
  npm run lint
  ```
- **Generar el build de producción:**
  ```bash
  npm run build
  ```
- **Iniciar el servidor de producción local:**
  ```bash
  npm start
  ```

---

## 5. Funcionalidades Principales

- **Catálogo público conectado a la API (`GET /api/mangas`):**
  - Paginación real en el servidor (`page` y `pageSize`).
  - Buscador por título insensible a mayúsculas/minúsculas (`search`).
  - Filtro por género (`Shonen`, `Seinen`, `Shojo`, `Josei`) combinable con búsqueda y paginación.
- **Autenticación y sesión (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`):**
  - Registro con validaciones de formato, longitud mínima de contraseña (8 caracteres) y manejo de correos duplicados (`409 Conflict`).
  - Inicio de sesión con persistencia de token JWT y restauración automática de sesión verificada con el backend al recargar la página.
- **Rutas protegidas y control por rol (`components/ProtectedRoute.tsx`):**
  - `/perfil`, `/vender` y `/mis-solicitudes`: requieren sesión activa.
  - `/admin`: restringida exclusivamente a usuarios con rol `ADMIN` verificado por el servidor.
- **Funcionalidades del usuario autenticado:**
  - **Favoritos (`/api/favorites`):** agregar, quitar y consultar mangas favoritos sincronizados con la base de datos.
  - **Carrito y compra contraentrega (`/carrito`, `/api/orders`):** verificación obligatoria de la dirección de entrega antes de confirmar el pedido, creación de orden en estado `Pendiente (Contraentrega)` y actualización atómica de inventario.
  - **Mi cuenta (`/perfil`):** consulta del perfil (sin exponer identificadores internos UUID), historial de compras con dirección y estado del pedido, lista de favoritos y solicitudes de venta propias.
  - **Solicitudes de venta (`/vender`, `/mis-solicitudes`, `/api/solicitudes`):** envío de solicitudes para vender mangas usados (creadas en estado `En revisión`) y consulta exclusiva de las solicitudes del propio usuario.
- **Panel de administración (`/admin`):**
  - Creación, edición y eliminación de mangas del catálogo (`POST/PUT/DELETE /api/mangas`).
  - Consulta global de las solicitudes de venta recibidas (`GET /api/solicitudes`).

---

## 6. Aspectos de Seguridad y Entrega Académica

### Flujo de inicio de sesión
1. El formulario en `app/login/LoginContent.tsx` valida correo y contraseña y envía `POST /api/auth/login`.
2. Al recibir `{ token, user }`, `AuthContext` almacena el JWT en memoria y en `localStorage` (`remanga_auth_token`) mediante `setStoredToken`.
3. En cada recarga de página, `AuthContext` invoca `GET /api/auth/me` adjuntando `Authorization: Bearer <token>` para confirmar la vigencia del token y obtener el rol real desde el servidor.
4. Al cerrar sesión (`logout`), se elimina el token de `localStorage` y se limpia el estado en memoria.

### Riesgos de almacenamiento del token y medidas adoptadas
- Guardar un JWT en `localStorage` permite persistir la sesión entre recargas en dominios separados (Vercel y Render), pero implica que cualquier script ejecutado en el origen podría leerlo si existiera una vulnerabilidad XSS.
- Para mitigar este riesgo:
  - No se persiste el objeto de usuario ni su rol en `localStorage`; los permisos se obtienen siempre del backend (`GET /api/auth/me`).
  - Los endpoints privados del backend validan el JWT y el rol en cada solicitud, sin confiar en las restricciones visuales del frontend.
  - Cualquier respuesta `401 Unauthorized` dispara automáticamente la limpieza del token almacenado.

### Diferencia entre HTTP `401` y `403`
- **`401 Unauthorized`:** El cliente no envió un token válido o la sesión expiró. El frontend limpia la sesión y solicita iniciar sesión.
- **`403 Forbidden`:** El usuario sí tiene sesión activa, pero su rol (`USER`) no tiene autorización para acceder al recurso (por ejemplo, `/admin` o endpoints exclusivos de `ADMIN`, o recursos privados de otro usuario).

### Uso de herramientas de IA y correcciones realizadas
Se emplearon herramientas de IA como apoyo en programación en pareja para:
- Integrar el cliente HTTP centralizado (`lib/api.ts`) con normalización del prefijo `/api` e inyección automática del encabezado `Authorization: Bearer <token>`.
- Sincronizar los filtros combinados (`search` + `genre`) y la paginación del catálogo con la API real.
- Incorporar la verificación de dirección de entrega en el flujo de compra contraentrega y su visualización en el historial de pedidos.
- Retirar el UUID interno de la vista «Mi cuenta» y añadir `data-scroll-behavior="smooth"` en `app/layout.tsx` para compatibilidad con el enrutador de Next.js 16.

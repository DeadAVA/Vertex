# Vertex Academic — Guía de instalación (Windows)

Sigue estos pasos **en orden**. Aplica tanto si es una PC nueva como si ya tienes algo instalado.

---

## 1. Instalar Node.js

1. Abre el navegador y ve a **https://nodejs.org**
2. Descarga la versión **LTS** (la que dice "Recommended For Most Users")
3. Ejecuta el instalador `.msi` y acepta todo con "Next"
4. Cuando termine, abre **PowerShell** o **CMD** y verifica:

```
node -v
npm -v
```

Deberías ver algo como `v20.x.x` y `10.x.x`. Si aparece un número, Node está instalado.

---

## 2. Instalar Git

1. Ve a **https://git-scm.com/download/win**
2. Descarga el instalador y ejecútalo (deja todas las opciones por defecto)
3. Verifica:

```
git --version
```

---

## 3. Clonar o copiar el proyecto

**Opción A — tienes acceso al repositorio Git:**
```
git clone <URL-del-repositorio>
cd vertex-platform
```

**Opción B — tienes la carpeta copiada:**
Abre PowerShell dentro de la carpeta del proyecto (clic derecho en la carpeta → "Abrir en Terminal").

---

## 4. Instalar dependencias

Dentro de la carpeta del proyecto:

```
npm install
```

Esto puede tardar 1-3 minutos. Al terminar aparece una carpeta `node_modules`.

---

## 5. Crear el archivo de variables de entorno

El proyecto usa un archivo `.env.dev` para desarrollo. Crea el archivo en la raíz del proyecto con el siguiente contenido (pide los valores reales al dueño del proyecto):

```
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="una-cadena-secreta-larga-y-aleatoria"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (modo test)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PREMIUM_PRICE_ID="price_..."

# IA (opcional — solo si vas a usar el Solver IA)
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:14b"
```

> **NEXTAUTH_URL** debe ser exactamente `http://localhost:3000` cuando corres en local.

Para generar un `NEXTAUTH_SECRET` seguro, corre este comando en PowerShell:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Sincronizar la base de datos

El proyecto usa **Neon** (PostgreSQL en la nube). Con el `DATABASE_URL` correcto en `.env.dev`, ejecuta:

```
npm run db:push
```

Esto crea todas las tablas en la base de datos. Solo se necesita hacer una vez (o cuando cambie el schema).

---

## 7. Cargar el contenido inicial (seed)

Para que aparezcan los cursos en la plataforma:

```
npm run db:seed
```

---

## 8. Arrancar el servidor de desarrollo

```
npm run dev
```

Abre el navegador en **http://localhost:3000**

---

## Comandos de referencia

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run db:push` | Sincroniza el schema con la base de datos |
| `npm run db:seed` | Carga los cursos y contenido inicial |
| `npm run db:studio` | Abre Prisma Studio (interfaz visual de la BD) |

---

## Requisitos mínimos

- Node.js 18 o superior
- Conexión a internet (la base de datos es en la nube con Neon)
- Las claves de Stripe y la `DATABASE_URL` (pídelas al admin del proyecto)

---

## Problemas comunes

**`npm run dev` falla con error de módulo no encontrado**
→ Corre `npm install` de nuevo y vuelve a intentar.

**Error `PrismaClientInitializationError`**
→ El `DATABASE_URL` en `.env.dev` está mal o vacío. Verifica que no tenga comillas extra.

**La página carga pero no aparecen cursos**
→ Corre `npm run db:seed` para cargar el contenido.

**Puerto 3000 ocupado**
→ Cierra otras aplicaciones o corre `npm run dev -- -p 3001` para usar otro puerto (y actualiza `NEXTAUTH_URL` en `.env.dev`).

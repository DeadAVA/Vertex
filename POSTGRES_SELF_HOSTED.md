# PostgreSQL autogestionado

El proyecto ya utiliza PostgreSQL mediante Prisma. Esta configuracion ejecuta
PostgreSQL 18 en Docker, guarda sus datos en un volumen persistente y aplica las
migraciones antes de iniciar la aplicacion. No depende de Neon ni de otro
proveedor de base de datos.

## Requisitos

- Docker Desktop con Docker Compose v2
- Espacio persistente y una estrategia externa de respaldos
- Acceso temporal a la URL de la base actual para copiar sus datos

## 1. Configurar credenciales

Copia las variables de `.env.self-hosted.example` al archivo `.env` y cambia
`POSTGRES_PASSWORD`. La contrasena debe ser larga, aleatoria y apta para una URL.
No agregues `.env` al repositorio.

Para desarrollo con Next.js fuera de Docker, cambia `DATABASE_URL` en `.env.dev`:

```dotenv
DATABASE_URL="postgresql://vertex:TU_PASSWORD@localhost:5432/vertex"
```

Dentro de Compose la aplicacion usa el host privado `postgres`; el valor remoto
que pudiera quedar en `.env.prod` es reemplazado por Compose.

## 2. Crear la base y todas las tablas

```powershell
npm run db:local:up
```

Este comando crea el volumen `postgres_data`, espera a que PostgreSQL responda y
ejecuta `prisma migrate deploy`. Las tablas se crean desde los archivos
versionados de `prisma/migrations`.

Para una base nueva sin datos existentes:

```powershell
npm run db:seed
```

## 3. Copiar todos los datos de la base actual

Hazlo antes de permitir escrituras en la nueva base. La base de destino debe
estar vacia; el script restaura dentro de una transaccion y conserva un dump.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrate-postgres.ps1
```

Por defecto toma la URL de origen desde `.env.prod` para no escribir la
contrasena en el historial. Usa `-SourceDatabaseUrl "postgresql://..."` solo si
el origen es otro.

El script:

1. Usa `pg_dump` de PostgreSQL 18 para exportar todas las tablas.
2. Inicia el contenedor local.
3. Aplica las migraciones Prisma.
4. Restaura los datos con `pg_restore`.

Deten las escrituras en el servicio anterior durante la copia final. Despues,
prueba registro, inicio de sesion, cursos, documentos, progreso y suscripciones
antes de cambiar trafico. Conserva la base anterior sin escrituras durante el
periodo de verificacion.

## 4. Ejecutar produccion

```powershell
docker compose up -d --build
docker compose ps
docker compose logs migrate
docker compose logs -f app
```

El orden de inicio es `postgres`, `migrate`, `app`. Los datos sobreviven a
`docker compose down`; no uses `docker compose down -v` salvo que quieras borrar
la base completa.

## Migraciones futuras

Despues de modificar `prisma/schema.prisma`, crea una migracion en desarrollo:

```powershell
npm run db:migrate -- --name descripcion_del_cambio
```

Revisa y versiona el SQL generado. En produccion, Compose ejecutara
`prisma migrate deploy` automaticamente.

## Respaldos

```powershell
npm run db:backup
```

Los dumps quedan en `backups/`, que esta excluido de Git. Copialos de forma
automatizada a otra maquina o almacenamiento; un volumen Docker no sustituye un
respaldo. Prueba periodicamente que los dumps puedan restaurarse.

## Alcance operativo

Autogestionar PostgreSQL elimina el proveedor, no la operacion. La maquina debe
estar encendida y requiere actualizaciones, monitoreo de disco, respaldos fuera
del servidor y un plan de recuperacion. Para acceso desde otra maquina, no
expongas el puerto 5432 directamente a Internet; usa una red privada o VPN y TLS.

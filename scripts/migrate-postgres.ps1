param(
  [string]$SourceDatabaseUrl,
  [string]$SourceEnvFile = ".env.prod"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backupDirectory = Join-Path $root "backups"
$backupFile = "migration-{0}.dump" -f (Get-Date -Format "yyyyMMdd-HHmmss")
$resolvedBackup = [System.IO.Path]::GetFullPath($backupDirectory)

if (-not $SourceDatabaseUrl) {
  $envPath = Join-Path $root $SourceEnvFile
  $databaseLine = Get-Content $envPath |
    Where-Object { $_ -match "^DATABASE_URL=" } |
    Select-Object -First 1

  if (-not $databaseLine) {
    throw "No se encontro DATABASE_URL en $SourceEnvFile."
  }

  $SourceDatabaseUrl = ($databaseLine -replace "^DATABASE_URL=", "").Trim().Trim('"').Trim("'")
}

New-Item -ItemType Directory -Force -Path $resolvedBackup | Out-Null

Write-Host "1/4 Exportando los datos de la base actual..."
docker run --rm `
  --volume "${resolvedBackup}:/backups" `
  postgres:18-alpine `
  pg_dump "$SourceDatabaseUrl" `
  --format=custom `
  --data-only `
  --no-owner `
  --no-acl `
  --exclude-table="_prisma_migrations" `
  --file="/backups/$backupFile"

if ($LASTEXITCODE -ne 0) {
  throw "No se pudo exportar la base de origen."
}

Write-Host "2/4 Iniciando PostgreSQL local..."
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo iniciar PostgreSQL."
}

Write-Host "3/4 Creando el esquema con las migraciones de Prisma..."
docker compose run --rm --build migrate
if ($LASTEXITCODE -ne 0) {
  throw "Las migraciones de Prisma fallaron."
}

Write-Host "4/4 Restaurando los datos..."
docker compose exec -T postgres sh -c `
  "pg_restore --username=`"`$POSTGRES_USER`" --dbname=`"`$POSTGRES_DB`" --data-only --disable-triggers --single-transaction --exit-on-error `"/backups/$backupFile`""

if ($LASTEXITCODE -ne 0) {
  throw "La restauracion fallo. La transaccion fue revertida."
}

Write-Host "Migracion completada. Respaldo conservado en backups/$backupFile"

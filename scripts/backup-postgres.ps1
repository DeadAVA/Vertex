param(
  [string]$OutputDirectory = "backups"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backupDirectory = Join-Path $root $OutputDirectory
$resolvedRoot = [System.IO.Path]::GetFullPath($root)
$resolvedBackup = [System.IO.Path]::GetFullPath($backupDirectory)

if (-not $resolvedBackup.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "El directorio de respaldo debe estar dentro del proyecto."
}

New-Item -ItemType Directory -Force -Path $resolvedBackup | Out-Null
$fileName = "vertex-{0}.dump" -f (Get-Date -Format "yyyyMMdd-HHmmss")

docker compose exec -T postgres sh -c `
  "pg_dump --username=`"`$POSTGRES_USER`" --dbname=`"`$POSTGRES_DB`" --format=custom --no-owner --no-acl --file=`"/backups/$fileName`""

if ($LASTEXITCODE -ne 0) {
  throw "pg_dump no pudo crear el respaldo."
}

Write-Host "Respaldo creado: $(Join-Path $resolvedBackup $fileName)"

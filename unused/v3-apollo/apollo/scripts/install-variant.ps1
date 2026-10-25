<#
.SYNOPSIS
    Install one Apollo variant as the invocable agent.

.DESCRIPTION
    Agent files are only invocable from ~/.claude/agents/. The repo keeps the
    canonical copies in apollo/agents/; this copies one of them to a FIXED name,
    `apollo-run`, so the invocation is identical across every variant. The
    bake-off swaps which variant is behind that name and changes nothing else —
    otherwise the agent's name becomes a confound.

    The installed file is a copy, not a link. Edit apollo/agents/<variant>.md and
    re-install; never edit the installed copy, which is overwritten without
    warning.

.PARAMETER Variant
    V1..V6. Resolves to agents/apollo-<lowercase>.md.

.PARAMETER Uninstall
    Remove the installed agent and stop.

.EXAMPLE
    .\scripts\install-variant.ps1 -Variant V3
    .\scripts\install-variant.ps1 -Uninstall
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Variant = 'V3',
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$repoRoot  = Split-Path -Parent $PSScriptRoot
$agentsDir = Join-Path $env:USERPROFILE '.claude\agents'
$target    = Join-Path $agentsDir 'apollo-run.md'
$stateFile = Join-Path $repoRoot '.apollo\installed.json'

if ($Uninstall) {
    if (Test-Path $target) {
        Remove-Item $target -Force
        Write-Host "Removed $target"
    } else {
        Write-Host 'Nothing installed.'
    }
    if (Test-Path $stateFile) { Remove-Item $stateFile -Force }
    exit 0
}

$source = Join-Path $repoRoot ("agents\apollo-" + $Variant.ToLower() + ".md")
if (-not (Test-Path $source)) {
    Write-Host "No agent file for variant '$Variant' at $source"
    Write-Host 'Available:'
    Get-ChildItem -Path (Join-Path $repoRoot 'agents') -Filter '*.md' -ErrorAction SilentlyContinue |
        ForEach-Object { Write-Host "  $($_.BaseName)" }
    exit 1
}

if (-not (Test-Path $agentsDir)) { New-Item -ItemType Directory -Path $agentsDir | Out-Null }

# The frontmatter `name:` must stay `apollo-run` regardless of variant, or the
# invocation name changes with the variant and the comparison is spoiled.
$head = Get-Content -Path $source -TotalCount 12 -Encoding UTF8
if (-not ($head | Where-Object { $_ -match '^\s*name:\s*apollo-run\s*$' })) {
    Write-Host "FAIL  $source frontmatter must declare `name: apollo-run` so every variant answers to the same name."
    exit 1
}

Copy-Item -Path $source -Destination $target -Force

$stateDir = Split-Path -Parent $stateFile
if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir | Out-Null }
[ordered]@{
    variant     = $Variant
    source      = $source
    installedAt = (Get-Date).ToString('o')
} | ConvertTo-Json | Out-File -FilePath $stateFile -Encoding utf8

Write-Host ''
Write-Host "Installed variant $Variant"
Write-Host "  from : $source"
Write-Host "  to   : $target"
Write-Host '  invoke as: apollo-run'
Write-Host ''
Write-Host '  Note: agent files are picked up when a session starts. If apollo-run'
Write-Host '  is not offered, restart the Claude Code session.'
Write-Host ''

<#
.SYNOPSIS
    Probe the current environment and record what Apollo actually has this session.

.DESCRIPTION
    The harness-managed plugin skill set is NOT stable between sessions. Four
    session directories on this machine carried 10, 17, 19 and 36 skills
    respectively; the design skills present ranged from none to six. Apollo
    therefore never assumes a plugin skill exists - it probes, records, and
    degrades silently.

    Writes .apollo/env.json next to the repo root. Apollo reads that file during
    Stage 0 before it plans anything.

    Read-only. Touches nothing outside .apollo/.

.PARAMETER Quiet
    Suppress console output; just write the file.

.EXAMPLE
    .\scripts\probe.ps1
    .\scripts\probe.ps1 -Quiet
#>
[CmdletBinding()]
param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$outDir   = Join-Path $repoRoot '.apollo'
$outFile  = Join-Path $outDir 'env.json'

function Write-Note($msg) {
    if (-not $Quiet) { Write-Host $msg }
}

# --- vendored skills: the ones Apollo owns and can always rely on -------------
$vendored = @()
$skillsDir = Join-Path $repoRoot 'skills'
if (Test-Path $skillsDir) {
    $vendored = @(
        Get-ChildItem -Path $skillsDir -Directory |
            Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') } |
            ForEach-Object { $_.Name } |
            Sort-Object
    )
}

# --- personal skills: ~/.claude/skills ---------------------------------------
$personal = @()
$personalDir = Join-Path $env:USERPROFILE '.claude\skills'
if (Test-Path $personalDir) {
    $personal = @(
        Get-ChildItem -Path $personalDir -Directory |
            Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') } |
            ForEach-Object { $_.Name } |
            Sort-Object
    )
}

# --- plugin skills: harness-managed, session-scoped, volatile ----------------
# Path shape: AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\<uuid>\<uuid>\skills
$pluginSkills   = @()
$pluginSource   = $null
$pluginSessions = 0

$pluginRoot = Join-Path $env:APPDATA 'Claude\local-agent-mode-sessions\skills-plugin'
if (Test-Path $pluginRoot) {
    $candidates = @(
        Get-ChildItem -Path $pluginRoot -Directory -ErrorAction SilentlyContinue |
            ForEach-Object {
                Get-ChildItem -Path $_.FullName -Directory -ErrorAction SilentlyContinue
            } |
            ForEach-Object {
                $s = Join-Path $_.FullName 'skills'
                if (Test-Path $s) { Get-Item $s }
            }
    )
    $pluginSessions = $candidates.Count

    # Most recently written wins - that is the live one for this session.
    $live = $candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -ne $live) {
        $pluginSource = $live.FullName
        $pluginSkills = @(
            Get-ChildItem -Path $live.FullName -Directory |
                ForEach-Object { $_.Name } |
                Sort-Object
        )
    }
}

# --- MCP servers -------------------------------------------------------------
# Names only. Never record a server id: those are session-scoped UUIDs and
# baking one into config is what broke the Adobe reference in the old setup.
$mcpServers = @()
foreach ($cfgPath in @(
    (Join-Path $env:USERPROFILE '.claude.json'),
    (Join-Path $env:USERPROFILE '.claude\settings.json'),
    (Join-Path $repoRoot '.mcp.json')
)) {
    if (-not (Test-Path $cfgPath)) { continue }
    try {
        $cfg = Get-Content -Path $cfgPath -Raw -Encoding UTF8 | ConvertFrom-Json
    } catch {
        continue
    }
    if ($null -ne $cfg -and $null -ne $cfg.mcpServers) {
        $mcpServers += @($cfg.mcpServers.PSObject.Properties.Name)
    }
}
$mcpServers = @($mcpServers | Sort-Object -Unique)

# --- optional capabilities Apollo will use if present ------------------------
# Stage 2 and Stage 4 both need to serve and screenshot. Absence is not fatal;
# it downgrades evidence from rendered to static, and Apollo must say so.
$optional = [ordered]@{
    figma         = ($mcpServers -contains 'figma')
    node          = [bool](Get-Command node -ErrorAction SilentlyContinue)
    git           = [bool](Get-Command git   -ErrorAction SilentlyContinue)
    launchConfig  = (Test-Path (Join-Path $repoRoot '.claude\launch.json'))
}

$env_ = [ordered]@{
    probedAt        = (Get-Date).ToString('o')
    repoRoot        = $repoRoot
    vendoredSkills  = $vendored
    personalSkills  = $personal
    pluginSkills    = $pluginSkills
    pluginSource    = $pluginSource
    pluginSessions  = $pluginSessions
    mcpServers      = $mcpServers
    optional        = $optional
}

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
$env_ | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding utf8

Write-Note ""
Write-Note "Apollo environment probe"
Write-Note "  vendored skills   : $($vendored.Count)  (always available)"
Write-Note "  personal skills   : $($personal.Count)"
Write-Note "  plugin skills     : $($pluginSkills.Count)  (volatile - $pluginSessions session dirs seen)"
if ($mcpServers.Count -gt 0) {
    Write-Note "  mcp servers       : $($mcpServers -join ', ')"
} else {
    Write-Note "  mcp servers       : none"
}
Write-Note "  wrote             : $outFile"
Write-Note ""

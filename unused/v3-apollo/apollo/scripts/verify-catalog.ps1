<#
.SYNOPSIS
    Fail the build if Apollo references a skill that does not resolve.

.DESCRIPTION
    The old setup routed to four skills that were absent at runtime, including
    its own precedence rule #2. Nothing caught it because nothing checked. This
    script is that check.

    Verifies, in order:

      1. Every vendored skill has SKILL.md with name + description frontmatter,
         and the frontmatter name matches its folder name.
      2. Every variant manifest's requiredSkills[] resolves to a vendored skill.
         A required skill that is not vendored is a HARD FAILURE - required means
         Apollo cannot function without it, so it must be in the repo, not
         borrowed from a volatile plugin set.
      3. Every apollo-* cross-reference inside a SKILL.md resolves.
      4. optionalSkills[] are reported as present/absent for information only.

    Exit 0 = clean. Exit 1 = at least one hard failure.

.EXAMPLE
    .\scripts\verify-catalog.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot   = Split-Path -Parent $PSScriptRoot
$skillsDir  = Join-Path $repoRoot 'skills'
$variantDir = Join-Path $repoRoot 'variants'

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Get-Frontmatter($path) {
    $lines = Get-Content -Path $path -Encoding UTF8
    if ($lines.Count -eq 0 -or $lines[0].Trim() -ne '---') { return $null }
    $fm = @{}
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq '---') { break }
        if ($lines[$i] -match '^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$') {
            $fm[$matches[1]] = $matches[2].Trim()
        }
    }
    return $fm
}

# --- 1. vendored skills are well formed --------------------------------------
$vendored = @()
if (Test-Path $skillsDir) {
    foreach ($dir in (Get-ChildItem -Path $skillsDir -Directory | Sort-Object Name)) {
        $skillFile = Join-Path $dir.FullName 'SKILL.md'
        if (-not (Test-Path $skillFile)) {
            $failures.Add("skills/$($dir.Name): no SKILL.md")
            continue
        }
        $fm = Get-Frontmatter $skillFile
        if ($null -eq $fm) {
            $failures.Add("skills/$($dir.Name)/SKILL.md: no frontmatter block")
            continue
        }
        if (-not $fm.ContainsKey('name')) {
            $failures.Add("skills/$($dir.Name)/SKILL.md: frontmatter has no name")
        } elseif ($fm['name'] -ne $dir.Name) {
            $failures.Add("skills/$($dir.Name)/SKILL.md: frontmatter name '$($fm['name'])' != folder name")
        }
        if (-not $fm.ContainsKey('description') -or [string]::IsNullOrWhiteSpace($fm['description'])) {
            $failures.Add("skills/$($dir.Name)/SKILL.md: frontmatter has no description - it will never trigger")
        }
        $vendored += $dir.Name
    }
} else {
    $failures.Add('skills/ does not exist')
}

# --- 2. variant manifests ----------------------------------------------------
$variantCount = 0
if (Test-Path $variantDir) {
    foreach ($manifest in (Get-ChildItem -Path $variantDir -Filter '*.json' | Sort-Object Name)) {
        $variantCount++
        try {
            $v = Get-Content -Path $manifest.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        } catch {
            $failures.Add("variants/$($manifest.Name): unparseable JSON")
            continue
        }

        foreach ($req in @($v.requiredSkills)) {
            if ([string]::IsNullOrWhiteSpace($req)) { continue }
            if ($vendored -notcontains $req) {
                $failures.Add("variants/$($manifest.Name): requiredSkills '$req' is not vendored in skills/")
            }
        }
        foreach ($opt in @($v.optionalSkills)) {
            if ([string]::IsNullOrWhiteSpace($opt)) { continue }
            if ($vendored -notcontains $opt) {
                $warnings.Add("variants/$($manifest.Name): optional '$opt' not vendored - probed at runtime, may be absent")
            }
        }
    }
}

# --- 3. apollo-* cross-references inside skill bodies ------------------------
if (Test-Path $skillsDir) {
    foreach ($skillFile in (Get-ChildItem -Path $skillsDir -Recurse -Filter 'SKILL.md')) {
        $rel  = $skillFile.FullName.Substring($repoRoot.Length + 1)
        $body = Get-Content -Path $skillFile.FullName -Raw -Encoding UTF8
        $refs = [regex]::Matches($body, '`(apollo-[a-z0-9-]+)`') |
                    ForEach-Object { $_.Groups[1].Value } |
                    Sort-Object -Unique
        foreach ($ref in $refs) {
            if ($vendored -notcontains $ref) {
                $failures.Add("$rel references '$ref' which is not vendored")
            }
        }
    }
}

# --- report ------------------------------------------------------------------
Write-Host ''
Write-Host 'Apollo catalog verification'
Write-Host "  vendored skills : $($vendored.Count)  [$($vendored -join ', ')]"
Write-Host "  variants        : $variantCount"

if ($warnings.Count -gt 0) {
    Write-Host ''
    Write-Host "  warnings ($($warnings.Count)):"
    foreach ($w in $warnings) { Write-Host "    - $w" }
}

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host "  FAILURES ($($failures.Count)):"
    foreach ($f in $failures) { Write-Host "    x $f" }
    Write-Host ''
    exit 1
}

Write-Host ''
Write-Host '  OK - every reference resolves.'
Write-Host ''
exit 0

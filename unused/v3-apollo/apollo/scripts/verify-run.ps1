<#
.SYNOPSIS
    Audit an Apollo run against the filesystem. Catches narrated work.

.DESCRIPTION
    An agent can describe a stage it never performed, and prose is not evidence.
    This checks every claim in _apollo/run.json against files that either exist or
    do not:

      1. The trace parses and carries the required fields.
      2. Every skill in skillsRead resolves to a real SKILL.md in apollo/skills/.
      3. Every artifact named by a stage exists and is non-empty.
      4. Stages that MUST produce a file (2 Evidence, 3 Direction, 4 Comp,
         6 Handoff) have named at least one, when they claim to have run.
      5. A stage 2 marked `complete` rather than `degraded` has actual screenshots
         — claiming full evidence without images is the single most likely lie,
         because it is the one that costs the most to do honestly.
      6. Named deliverables exist.

    Exit 0 = every claim is supported. Exit 1 = at least one is not.

    This does not judge quality. It only establishes that the work happened.

.PARAMETER Project
    The target project directory containing _apollo/.

.EXAMPLE
    .\scripts\verify-run.ps1 -Project "C:\...\lab\005-agency"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Project
)

$ErrorActionPreference = 'Stop'
$repoRoot  = Split-Path -Parent $PSScriptRoot
$skillsDir = Join-Path $repoRoot 'skills'
$tracePath = Join-Path $Project '_apollo\run.json'

$fail = New-Object System.Collections.Generic.List[string]
$warn = New-Object System.Collections.Generic.List[string]
$ok   = New-Object System.Collections.Generic.List[string]

function Resolve-Artifact($rel) {
    if ([System.IO.Path]::IsPathRooted($rel)) { return $rel }
    return Join-Path $Project $rel
}

# --- 1. the trace itself -----------------------------------------------------
if (-not (Test-Path $tracePath)) {
    Write-Host ''
    Write-Host 'Apollo run verification'
    Write-Host "  x  no trace at $tracePath"
    Write-Host ''
    Write-Host '     No trace means no run. If work was produced anyway, it was'
    Write-Host '     produced outside the pipeline and proves nothing about it.'
    Write-Host ''
    exit 1
}

try {
    $trace = Get-Content -Path $tracePath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Host "  x  trace is not valid JSON: $($_.Exception.Message)"
    exit 1
}

foreach ($f in @('runId', 'variant', 'job', 'stages')) {
    if ($null -eq $trace.$f) { $fail.Add("trace is missing required field '$f'") }
}
if ($fail.Count -eq 0) { $ok.Add("trace parses; variant $($trace.variant), job $($trace.job)") }

# --- 2. skills claimed vs skills that exist ----------------------------------
$skillsRead = @($trace.skillsRead)
foreach ($s in $skillsRead) {
    if ($null -eq $s.skill) { continue }
    $p = Join-Path $skillsDir (Join-Path $s.skill 'SKILL.md')
    if (Test-Path $p) {
        $ok.Add("skill read: $($s.skill)")
    } else {
        $fail.Add("skillsRead names '$($s.skill)' which does not exist in skills/")
    }
}
if ($skillsRead.Count -eq 0) {
    $warn.Add('skillsRead is empty - the run used no skills. Valid for V1 (control), suspicious otherwise.')
} elseif ($skillsRead.Count -gt 3) {
    $warn.Add("$($skillsRead.Count) skills read. The budget is two; more needs a stated reason.")
}

# --- 3 & 4. stage claims vs artifacts ----------------------------------------
$mustProduce = @{ 2 = 'Evidence'; 3 = 'Direction'; 4 = 'Comp'; 6 = 'Handoff' }
$ran = @('complete', 'degraded')

foreach ($st in @($trace.stages)) {
    $n = [int]$st.n
    $status = "$($st.status)"
    $artifacts = @($st.artifacts)

    if ($status -eq 'skipped' -or $status -eq 'blocked') {
        $ok.Add("stage $n ($($st.name)): $status - no artifacts expected")
        continue
    }

    if ($ran -notcontains $status) {
        $fail.Add("stage $n has unrecognised status '$status'")
        continue
    }

    $present = 0
    foreach ($a in $artifacts) {
        if ([string]::IsNullOrWhiteSpace($a)) { continue }
        $full = Resolve-Artifact $a
        if (-not (Test-Path $full)) {
            $fail.Add("stage $n claims '$a' but it does not exist")
            continue
        }
        $item = Get-Item $full
        if (-not $item.PSIsContainer -and $item.Length -eq 0) {
            $fail.Add("stage $n claims '$a' but the file is empty")
            continue
        }
        if ($item.PSIsContainer -and @(Get-ChildItem $full -Recurse -File).Count -eq 0) {
            $fail.Add("stage $n claims directory '$a' but it contains no files")
            continue
        }
        $present++
    }

    if ($mustProduce.ContainsKey($n) -and $present -eq 0) {
        $fail.Add("stage $n ($($mustProduce[$n])) is '$status' but produced no verifiable artifact")
    } elseif ($present -gt 0) {
        $ok.Add("stage $n ($($st.name)): $status, $present artifact(s) verified")
    } else {
        $ok.Add("stage $n ($($st.name)): $status")
    }
}

# --- 5. the expensive claim: full evidence -----------------------------------
$stage2 = @($trace.stages) | Where-Object { [int]$_.n -eq 2 } | Select-Object -First 1
if ($null -ne $stage2 -and "$($stage2.status)" -eq 'complete') {
    $shots = @()
    $evidenceDir = Join-Path $Project '_apollo\evidence'
    if (Test-Path $evidenceDir) {
        $shots = @(Get-ChildItem $evidenceDir -Recurse -File -Include *.png, *.jpg, *.jpeg, *.webp -ErrorAction SilentlyContinue)
    }
    if ($shots.Count -eq 0) {
        $fail.Add("stage 2 is 'complete' but there are no screenshots in _apollo/evidence/. If the browser was unavailable the honest status is 'degraded'.")
    } elseif ($shots.Count -lt 6) {
        $warn.Add("stage 2 is 'complete' with $($shots.Count) screenshot(s); six breakpoints were specified.")
    } else {
        $ok.Add("stage 2: $($shots.Count) screenshots present")
    }
}

# --- 6. deliverables ----------------------------------------------------------
if ($null -ne $trace.deliverables) {
    foreach ($prop in $trace.deliverables.PSObject.Properties) {
        if ([string]::IsNullOrWhiteSpace($prop.Value)) { continue }
        $full = Resolve-Artifact $prop.Value
        if (Test-Path $full) {
            $ok.Add("deliverable '$($prop.Name)' present")
        } else {
            $fail.Add("deliverable '$($prop.Name)' names '$($prop.Value)' which does not exist")
        }
    }
}

# --- report -------------------------------------------------------------------
Write-Host ''
Write-Host 'Apollo run verification'
Write-Host "  project : $Project"
Write-Host "  run     : $($trace.runId)"
Write-Host ''
foreach ($o in $ok)   { Write-Host "  ok    $o" }
foreach ($w in $warn) { Write-Host "  warn  $w" }
foreach ($f in $fail) { Write-Host "  FAIL  $f" }
Write-Host ''

if ($fail.Count -gt 0) {
    Write-Host "  $($fail.Count) unsupported claim(s). The run is not verified."
    Write-Host ''
    exit 1
}
Write-Host '  Every claim in the trace is supported by a file on disk.'
Write-Host ''
exit 0

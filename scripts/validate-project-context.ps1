[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath
)

# Kept so existing docs and habits keep working. The check itself now lives in
# library/tools/verify.py --project (cross-platform, stdlib Python).
$verify = Join-Path $PSScriptRoot '..\library\tools\verify.py'
& python $verify --project $ProjectPath
exit $LASTEXITCODE

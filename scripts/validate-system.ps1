[CmdletBinding()]
param()

# Kept so existing docs and habits keep working. The checks themselves now live in
# library/tools/verify.py (cross-platform, stdlib Python) — this is a thin wrapper.
$verify = Join-Path $PSScriptRoot '..\library\tools\verify.py'
& python $verify
exit $LASTEXITCODE

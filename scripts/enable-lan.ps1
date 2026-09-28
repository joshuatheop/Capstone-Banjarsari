$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$statusFile = Join-Path $projectPath '.local/firewall-status.txt'
try {
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $ruleName = 'PALUGADA-Preview-TCP-3000'
    $existing = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -Name $ruleName -DisplayName 'PALUGADA Local Preview TCP 3000' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -RemoteAddress LocalSubnet -Program $nodePath -Profile Any | Out-Null
    }
    $rule = Get-NetFirewallRule -Name $ruleName
    if ($rule.Enabled -ne 'True' -or $rule.Action -ne 'Allow') { throw 'Aturan existing tidak aktif; periksa Windows Firewall.' }
    'OK: Node TCP 3000 allowed from LocalSubnet.' | Set-Content -LiteralPath $statusFile
    Write-Host 'Akses LAN aktif. Buka URL IP Wi-Fi pada port 3000.'
} catch {
    ('ERROR: ' + $_.Exception.Message) | Set-Content -LiteralPath $statusFile
    throw
}

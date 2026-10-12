@echo off
title ContractIQ Shutdown Manager

echo ========================================================
echo               ContractIQ Shutdown
echo ========================================================
echo.

echo Stopping ContractIQ services on ports 8000 and 3000...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(8000, 3000); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { try { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('  [STOPPED] Terminated process ' + $c.OwningProcess + ' on port ' + $p) } catch {} } } else { Write-Host ('  [INFO] Port ' + $p + ' is not in use.') } }"

:: Close dedicated cmd windows if open
taskkill /FI "WINDOWTITLE eq ContractIQ Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ContractIQ Frontend*" /T /F >nul 2>&1

echo.
echo ContractIQ backend and frontend have been safely stopped.
echo PostgreSQL database service was preserved.
echo.
pause

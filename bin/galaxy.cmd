@echo off
setlocal enableextensions

if not "%GALAXY_REDIRECTED%"=="1" if exist "%LOCALAPPDATA%\galaxy\client\bin\galaxy.cmd" (
  set GALAXY_REDIRECTED=1
  "%LOCALAPPDATA%\galaxy\client\bin\galaxy.cmd" %*
  goto:EOF
)

if not defined GALAXY_BINPATH set GALAXY_BINPATH="%~dp0galaxy.cmd"
if exist "%~dp0..\bin\node.exe" (
  "%~dp0..\bin\node.exe" "%~dp0..\bin\run" %*
) else if exist "%LOCALAPPDATA%\oclif\node\node-10.15.1.exe" (
  "%LOCALAPPDATA%\oclif\node\node-10.15.1.exe" "%~dp0..\bin\run" %*
) else (
  node "%~dp0..\bin\run" %*
)

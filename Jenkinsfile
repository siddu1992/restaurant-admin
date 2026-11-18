
@echo off
setlocal

REM Configure Docker executable and plugin paths
set "DOCKER_EXE=C:\Users\venka\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe"
set "DOCKER_PLUGIN_PATH=C:\Users\venka\.docker\cli-plugins"
set "DOCKER_CONFIG=C:\Users\venka\.docker"

REM Add Docker to PATH
set "PATH=C:\Users\venka\AppData\Local\Programs\DockerDesktop\resources\bin;%DOCKER_PLUGIN_PATH%;%PATH%"

echo ===== CHECK DOCKER EXECUTABLE =====

if not exist "%DOCKER_EXE%" (
    echo ERROR: Docker executable not found
    echo Expected: %DOCKER_EXE%
    exit /b 1
)

"%DOCKER_EXE%" --version

if errorlevel 1 exit /b 1

echo ===== CHECK DOCKER ENGINE =====

"%DOCKER_EXE%" --context desktop-linux info

if errorlevel 1 (
    echo ERROR: Docker Engine is not accessible
    exit /b 1
)

echo ===== CHECK EXISTING CONTAINER =====

"%DOCKER_EXE%" --context desktop-linux ps -a --format "{{.Names}}" | findstr /x /c:"restaurant-admin" >nul

if %ERRORLEVEL% EQU 0 (
    echo EXISTING CONTAINER FOUND

    "%DOCKER_EXE%" --context desktop-linux rm -f restaurant-admin

    if errorlevel 1 exit /b 1
) else (
    echo NO EXISTING CONTAINER FOUND
)

echo ===== CONTAINER CLEANUP COMPLETED =====

endlocal
exit /b 0

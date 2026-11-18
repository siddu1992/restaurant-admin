
stage('Stop Existing Container') {
    steps {
        bat '''
            @echo off
            setlocal

            set "PATH=%DOCKER_PATH%;%DOCKER_PLUGIN_PATH%;%PATH%"
            set "DOCKER_CONFIG=%DOCKER_CONFIG%"

            echo ===== CHECK EXISTING CONTAINER =====

            docker --context %DOCKER_CONTEXT% ps -a --format "{{.Names}}" | findstr /x /c:"%CONTAINER_NAME%" >nul

            if %ERRORLEVEL% EQU 0 (
                echo ===== EXISTING CONTAINER FOUND =====

                docker --context %DOCKER_CONTEXT% rm -f %CONTAINER_NAME%

                if errorlevel 1 (
                    echo ERROR: Failed to remove existing container
                    exit /b 1
                )

                echo OLD CONTAINER REMOVED SUCCESSFULLY
            ) else (
                echo NO EXISTING CONTAINER FOUND
            )

            echo ===== CONTAINER CLEANUP COMPLETED =====

            endlocal
            exit /b 0
        '''
    }
}

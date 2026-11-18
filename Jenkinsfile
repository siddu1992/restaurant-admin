
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DOCKER_PATH = 'C:/Users/venka/AppData/Local/Programs/DockerDesktop/resources/bin'
        DOCKER_CONFIG = 'C:/Users/venka/.docker'
        DOCKER_CONTEXT = 'desktop-linux'

        IMAGE_NAME = 'restaurant-admin'
        CONTAINER_NAME = 'restaurant-admin'
        APP_PORT = '8081'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '===== CHECKOUT SOURCE CODE ====='
                checkout scm
            }
        }

        stage('Check Node and NPM') {
            steps {
                bat '''
                    @echo off

                    echo ===== NODE VERSION =====
                    where node
                    node --version

                    if errorlevel 1 exit /b 1

                    echo ===== NPM VERSION =====
                    npm --version

                    if errorlevel 1 exit /b 1

                    echo NODE AND NPM CHECK COMPLETED
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    @echo off

                    echo ===== INSTALLING NPM DEPENDENCIES =====

                    npm ci

                    if errorlevel 1 (
                        echo ERROR: NPM INSTALLATION FAILED
                        exit /b 1
                    )

                    echo DEPENDENCIES INSTALLED SUCCESSFULLY
                '''
            }
        }

        stage('Build Angular Application') {
            steps {
                bat '''
                    @echo off

                    echo ===== BUILDING ANGULAR APPLICATION =====

                    npm run build

                    if errorlevel 1 (
                        echo ERROR: ANGULAR BUILD FAILED
                        exit /b 1
                    )

                    echo ===== VERIFY BUILD OUTPUT =====

                    if not exist "www\\index.html" (
                        echo ERROR: www/index.html NOT FOUND
                        exit /b 1
                    )

                    echo ANGULAR BUILD COMPLETED SUCCESSFULLY
                '''
            }
        }

        stage('Check Docker Environment') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== CHECK DOCKER EXECUTABLE =====

                    if not exist "%DOCKER_PATH%\\docker.exe" (
                        echo ERROR: Docker executable not found
                        exit /b 1
                    )

                    "%DOCKER_PATH%\\docker.exe" --version

                    if errorlevel 1 exit /b 1

                    echo ===== CHECK DOCKER ENGINE =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% info

                    if errorlevel 1 (
                        echo ERROR: Docker Engine is not accessible
                        exit /b 1
                    )

                    echo DOCKER ENVIRONMENT READY
                '''
            }
        }

        stage('Docker Build') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== BUILDING DOCKER IMAGE =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% build ^
                    --progress=plain ^
                    -t %IMAGE_NAME%:%BUILD_NUMBER% ^
                    -t %IMAGE_NAME%:latest ^
                    .

                    if errorlevel 1 (
                        echo ERROR: DOCKER BUILD FAILED
                        exit /b 1
                    )

                    echo ===== DOCKER BUILD COMPLETED =====
                '''
            }
        }

        stage('Verify Docker Image') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== VERIFY DOCKER IMAGE =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% image inspect %IMAGE_NAME%:latest

                    if errorlevel 1 (
                        echo ERROR: DOCKER IMAGE NOT FOUND
                        exit /b 1
                    )

                    echo ===== AVAILABLE APPLICATION IMAGES =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% images %IMAGE_NAME%

                    echo DOCKER IMAGE VERIFIED
                '''
            }
        }

    
stage('Stop Existing Container') {
    steps {
        bat '''
            @echo off
            setlocal

            set "PATH=%DOCKER_PATH%;%PATH%"
            set "DOCKER_CONFIG=%DOCKER_CONFIG%"

            echo ===== CHECK EXISTING CONTAINER =====

            "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% ps -a --format "{{.Names}}" | findstr /x /c:"%CONTAINER_NAME%" >nul

            if errorlevel 1 (
                echo NO EXISTING CONTAINER FOUND
            ) else (
                echo ===== EXISTING CONTAINER FOUND =====

                "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% rm -f %CONTAINER_NAME%

                if errorlevel 1 (
                    echo ERROR: FAILED TO REMOVE EXISTING CONTAINER
                    endlocal
                    exit /b 1
                )

                echo OLD CONTAINER REMOVED SUCCESSFULLY
            )

            echo ===== CONTAINER CLEANUP COMPLETED =====

            endlocal
            exit /b 0
        '''
    }
}


        stage('Run Docker Container') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== STARTING APPLICATION CONTAINER =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% run -d ^
                    -p %APP_PORT%:80 ^
                    --name %CONTAINER_NAME% ^
                    --restart unless-stopped ^
                    %IMAGE_NAME%:latest

                    if errorlevel 1 (
                        echo ERROR: FAILED TO START CONTAINER
                        exit /b 1
                    )

                    echo CONTAINER STARTED SUCCESSFULLY
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== RUNNING CONTAINERS =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% ps

                    echo ===== CONTAINER LOGS =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% logs --tail 30 %CONTAINER_NAME%

                    echo ===== DEPLOYMENT COMPLETED =====
                    echo APPLICATION URL: http://localhost:%APP_PORT%
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Angular application deployed successfully.'
            echo 'Application URL: http://localhost:8081'
        }

        failure {
            echo 'ERROR: Jenkins pipeline failed. Check the failed stage logs.'
        }

        always {
            echo '===== JENKINS PIPELINE FINISHED ====='
        }
    }
}

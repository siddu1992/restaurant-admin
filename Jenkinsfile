
pipeline {
    agent 'Windows_NODE'

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    // Automatically check GitHub for new commits every 2 minutes
    triggers {
        pollSCM('H/2 * * * *')
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

        stage('Checkout SCM') {
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

                    echo ===== INSTALLING DEPENDENCIES =====

                    call npm ci

                    if errorlevel 1 (
                        echo ERROR: NPM INSTALL FAILED
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

                    call npm run build

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
                        echo ERROR: DOCKER NOT FOUND
                        exit /b 1
                    )

                    "%DOCKER_PATH%\\docker.exe" --version

                    if errorlevel 1 exit /b 1

                    echo ===== CHECK DOCKER ENGINE =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% info

                    if errorlevel 1 (
                        echo ERROR: DOCKER ENGINE NOT ACCESSIBLE
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

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% build --progress=plain -t %IMAGE_NAME%:%BUILD_NUMBER% -t %IMAGE_NAME%:latest .

                    if errorlevel 1 (
                        echo ERROR: DOCKER BUILD FAILED
                        exit /b 1
                    )

                    echo DOCKER IMAGE BUILD COMPLETED
                '''
            }
        }

        stage('Verify Docker Image') {
            steps {
                bat '''
                    @echo off

                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== VERIFY DOCKER IMAGE =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% image inspect %IMAGE_NAME%:latest

                    if errorlevel 1 (
                        echo ERROR: DOCKER IMAGE NOT FOUND
                        exit /b 1
                    )

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% images %IMAGE_NAME%

                    echo DOCKER IMAGE VERIFIED
                '''
            }
        }

        stage('Stop Existing Container') {
            steps {
                bat '''
                    @echo off

                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== CHECK EXISTING CONTAINER =====

                    set "CONTAINER_ID="

                    for /f "delims=" %%i in ('"%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% ps -aq --filter "name=^/%CONTAINER_NAME%$"') do set "CONTAINER_ID=%%i"

                    if defined CONTAINER_ID (
                        echo ===== EXISTING CONTAINER FOUND =====

                        "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% rm -f %CONTAINER_NAME%

                        if errorlevel 1 (
                            echo ERROR: FAILED TO REMOVE OLD CONTAINER
                            exit /b 1
                        )

                        echo OLD CONTAINER REMOVED
                    ) else (
                        echo NO EXISTING CONTAINER FOUND
                    )

                    echo ===== CONTAINER CLEANUP COMPLETED =====

                    exit /b 0
                '''
            }
        }

        stage('Run Docker Container') {
            steps {
                bat '''
                    @echo off

                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== STARTING DOCKER CONTAINER =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% run -d -p %APP_PORT%:80 --name %CONTAINER_NAME% --restart unless-stopped %IMAGE_NAME%:latest

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

                    set "DOCKER_CONFIG=%DOCKER_CONFIG%"

                    echo ===== VERIFY RUNNING CONTAINER =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% ps --filter "name=^/%CONTAINER_NAME%$"

                    if errorlevel 1 exit /b 1

                    echo ===== CONTAINER LOGS =====

                    "%DOCKER_PATH%\\docker.exe" --context %DOCKER_CONTEXT% logs --tail 30 %CONTAINER_NAME%

                    echo ===== DEPLOYMENT SUCCESSFUL =====
                    echo APPLICATION URL: http://localhost:%APP_PORT%
                '''
            }
        }
    }

    post {
        success {
            echo '========================================'
            echo 'SUCCESS: APPLICATION DEPLOYED'
            echo 'URL: http://localhost:8081'
            echo '========================================'
        }

        failure {
            echo 'ERROR: PIPELINE FAILED'
            echo 'Please check the failed stage console output.'
        }

        always {
            echo '===== JENKINS PIPELINE FINISHED ====='
        }
    }
}

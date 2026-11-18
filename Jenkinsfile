
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        DOCKER_PATH = 'C:\\Users\\venka\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin'
        DOCKER_PLUGIN_PATH = 'C:\\Users\\venka\\.docker\\cli-plugins'

        DOCKER_CONTEXT = 'desktop-linux'

        IMAGE_NAME = 'restaurant-admin'
        CONTAINER_NAME = 'restaurant-admin'
        APP_PORT = '8081'
    }

    stages {

        stage('Check Node and NPM') {
            steps {
                bat '''
                    @echo off

                    echo ===== NODE VERSION =====
                    node --version
                    if errorlevel 1 exit /b 1

                    echo ===== NPM VERSION =====
                    npm --version
                    if errorlevel 1 exit /b 1
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

                    echo ===== NPM INSTALL COMPLETED =====
                '''
            }
        }

        stage('Angular Build') {
            steps {
                bat '''
                    @echo off

                    echo ===== ANGULAR BUILD STARTED =====

                    npm run build

                    if errorlevel 1 (
                        echo ERROR: ANGULAR BUILD FAILED
                        exit /b 1
                    )

                    echo ===== ANGULAR BUILD COMPLETED =====
                '''
            }
        }

        stage('Check Docker Environment') {
            options {
                timeout(time: 3, unit: 'MINUTES')
            }

            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%DOCKER_PLUGIN_PATH%;%PATH%"

                    echo ===== JENKINS USER =====
                    whoami

                    echo ===== DOCKER LOCATION =====
                    where docker

                    echo ===== DOCKER VERSION =====
                    docker --version
                    if errorlevel 1 exit /b 1

                    echo ===== BUILDX VERSION =====
                    docker buildx version
                    if errorlevel 1 (
                        echo ERROR: BUILDX PLUGIN NOT FOUND
                        exit /b 1
                    )

                    echo ===== DOCKER CONTEXT =====
                    docker context show

                    echo ===== DOCKER ENGINE STATUS =====

                    docker --context %DOCKER_CONTEXT% info

                    if errorlevel 1 (
                        echo ERROR: DOCKER ENGINE NOT ACCESSIBLE
                        exit /b 1
                    )

                    echo ===== DOCKER ENVIRONMENT READY =====
                '''
            }
        }

        stage('Docker Build') {
            options {
                timeout(time: 30, unit: 'MINUTES')
            }

            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%DOCKER_PLUGIN_PATH%;%PATH%"

                    echo ===== DOCKER BUILD STARTED =====
                    echo Image Name: %IMAGE_NAME%
                    echo Build Number: %BUILD_NUMBER%

                    docker --context %DOCKER_CONTEXT% buildx build ^
                    --progress=plain ^
                    --load ^
                    -t %IMAGE_NAME%:%BUILD_NUMBER% ^
                    -t %IMAGE_NAME%:latest ^
                    .

                    if errorlevel 1 (
                        echo ERROR: DOCKER IMAGE BUILD FAILED
                        exit /b 1
                    )

                    echo ===== VERIFY GENERATED IMAGE =====

                    docker --context %DOCKER_CONTEXT% image inspect %IMAGE_NAME%:latest

                    if errorlevel 1 (
                        echo ERROR: IMAGE NOT FOUND
                        exit /b 1
                    )

                    echo ===== GENERATED DOCKER IMAGES =====

                    docker --context %DOCKER_CONTEXT% images %IMAGE_NAME%

                    echo ===== DOCKER BUILD COMPLETED =====
                '''
            }
        }

        stage('Stop Existing Container') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%DOCKER_PLUGIN_PATH%;%PATH%"

                    echo ===== CHECK EXISTING CONTAINER =====

                    docker --context %DOCKER_CONTEXT% ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul

                    if not errorlevel 1 (
                        echo ===== STOPPING OLD CONTAINER =====

                        docker --context %DOCKER_CONTEXT% rm -f %CONTAINER_NAME%

                        if errorlevel 1 (
                            echo ERROR: FAILED TO REMOVE OLD CONTAINER
                            exit /b 1
                        )
                    ) else (
                        echo NO EXISTING CONTAINER FOUND
                    )
                '''
            }
        }

        stage('Run Docker Container') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%DOCKER_PLUGIN_PATH%;%PATH%"

                    echo ===== STARTING NEW CONTAINER =====

                    docker --context %DOCKER_CONTEXT% run -d ^
                    -p %APP_PORT%:80 ^
                    --name %CONTAINER_NAME% ^
                    --restart unless-stopped ^
                    %IMAGE_NAME%:latest

                    if errorlevel 1 (
                        echo ERROR: CONTAINER START FAILED
                        exit /b 1
                    )

                    echo ===== VERIFY CONTAINER =====

                    docker --context %DOCKER_CONTEXT% ps

                    echo ===== CONTAINER LOGS =====

                    docker --context %DOCKER_CONTEXT% logs --tail 30 %CONTAINER_NAME%

                    echo ===== APPLICATION DEPLOYED =====
                    echo Application URL: http://localhost:%APP_PORT%
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Angular build, Docker BuildKit image generation and deployment completed!'
            echo 'Application URL: http://localhost:8081'
        }

        failure {
            echo 'ERROR: Jenkins pipeline failed. Check the console output.'
        }

        always {
            echo 'Jenkins pipeline execution finished.'
        }
    }
}

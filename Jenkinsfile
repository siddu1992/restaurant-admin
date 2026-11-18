
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        DOCKER_PATH = 'C:\\Users\\venka\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin'
        IMAGE_NAME = 'restaurant-admin'
        CONTAINER_NAME = 'restaurant-admin'
        DOCKER_BUILDKIT = '1'
    }

    stages {

        stage('Check Node and NPM') {
            steps {
                bat '''
                    node --version
                    npm --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Angular Build') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Check Docker Environment') {
            options {
                timeout(time: 3, unit: 'MINUTES')
            }
            steps {
                bat '''
                    @echo off

                    echo ===== JENKINS USER =====
                    whoami

                    echo ===== DOCKER PATH =====
                    set "PATH=%DOCKER_PATH%;%PATH%"

                    where docker
                    docker --version

                    echo ===== DOCKER BUILDX =====
                    docker buildx version
                    if errorlevel 1 exit /b 1

                    echo ===== DOCKER CONTEXT =====
                    docker context show

                    echo ===== DOCKER ENGINE STATUS =====
                    docker info
                    if errorlevel 1 (
                        echo ERROR: Docker Engine is not accessible!
                        exit /b 1
                    )

                    echo ===== DOCKER CHECK COMPLETED =====
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

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_BUILDKIT=1"

                    echo ===== DOCKER BUILD STARTED =====

                    docker buildx build ^
                    --progress=plain ^
                    --load ^
                    -t %IMAGE_NAME%:%BUILD_NUMBER% ^
                    -t %IMAGE_NAME%:latest ^
                    .

                    if errorlevel 1 (
                        echo ERROR: Docker image build failed!
                        exit /b 1
                    )

                    echo ===== VERIFY GENERATED IMAGE =====

                    docker image inspect %IMAGE_NAME%:latest
                    if errorlevel 1 exit /b 1

                    echo ===== GENERATED IMAGES =====
                    docker images %IMAGE_NAME%

                    echo ===== DOCKER BUILD COMPLETED =====
                '''
            }
        }

        stage('Run Docker Container') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"

                    echo ===== STOP OLD CONTAINER =====

                    docker rm -f %CONTAINER_NAME% 2>nul

                    echo ===== START NEW CONTAINER =====

                    docker run -d ^
                    -p 8081:80 ^
                    --name %CONTAINER_NAME% ^
                    %IMAGE_NAME%:latest

                    if errorlevel 1 (
                        echo ERROR: Container startup failed!
                        exit /b 1
                    )

                    echo ===== CONTAINER STATUS =====

                    docker ps

                    echo ===== DEPLOYMENT COMPLETED =====
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Angular build, Docker image generation and deployment completed!'
        }

        failure {
            echo 'ERROR: Jenkins pipeline failed. Check the stage logs for details.'
        }
    }
}

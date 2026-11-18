
pipeline {
    agent any

    environment {
        DOCKER_PATH = 'C:\\Users\\venka\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin'
        DOCKER_CONFIG = 'C:\\Users\\venka\\.docker'
    }

    stages {
        stage('Configure Docker') {
            steps {
                bat '''
                    @echo off

                    set "PATH=%DOCKER_PATH%;%PATH%"
                    set "DOCKER_CONFIG=C:\\Users\\venka\\.docker"

                    echo ===== JENKINS USER =====
                    whoami

                    echo ===== DOCKER PATH =====
                    where docker

                    echo ===== DOCKER VERSION =====
                    docker --version

                    echo ===== BUILDX VERSION =====
                    docker buildx version

                    echo ===== DOCKER CONTEXT =====
                    docker context ls

                    echo ===== DOCKER ENGINE =====
                    docker --context desktop-linux info
                '''
            }
        }
    }
}

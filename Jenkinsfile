
pipeline {
    agent any

    environment {
        PATH+DOCKER = 'C:\\Users\\venka\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin'
        DOCKER_CONTEXT = 'desktop-linux'
    }

    stages {

        stage('Check Node and NPM') {
            steps {
                bat 'node --version'
                bat 'npm --version'
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

        stage('Check Jenkins Docker PATH') {
            steps {
                bat '''
echo ===== JENKINS USER =====
whoami

echo ===== PATH =====
echo %PATH%

echo ===== DOCKER LOCATION =====
where docker

echo ===== DOCKER CLIENT =====
docker --version

echo ===== DOCKER CONTEXT =====
docker context show

echo ===== DOCKER ENGINE =====
docker info --format "Docker Engine {{.ServerVersion}}"
'''
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t restaurant-admin:%BUILD_NUMBER% -t restaurant-admin:latest .'
            }
        }

        stage('Run Docker Container') {
            steps {
                bat '''
docker ps -a --format "{{.Names}}" | findstr /x "restaurant-admin" >nul
if not errorlevel 1 (
    docker rm -f restaurant-admin
    if errorlevel 1 exit /b 1
)
docker run --rm -d -p 8081:80 --name restaurant-admin restaurant-admin:latest
'''
            }
        }

    }

    post {
        success {
            echo 'Angular build, Docker image build, and container startup successful!'
        }

        failure {
            echo 'Pipeline failed!'
        }
    }
}

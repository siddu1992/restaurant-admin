
pipeline {
    agent any

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
if errorlevel 1 (
    echo Docker CLI is not on the Jenkins agent PATH.
    exit /b 1
)

echo ===== DOCKER CLIENT =====
docker --version
if errorlevel 1 exit /b 1

echo ===== DOCKER BUILDX =====
docker buildx version
if errorlevel 1 exit /b 1

echo ===== DOCKER CONTEXT =====
docker context show
if errorlevel 1 exit /b 1

echo ===== DOCKER ENGINE =====
docker info --format "Docker Engine {{.ServerVersion}}"
if errorlevel 1 (
    echo Docker Engine is unavailable to this Jenkins agent.
    echo Start Docker Desktop under the agent's Windows account, or configure a reachable Docker Engine for this agent.
    exit /b 1
)
'''
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker buildx build --load -t restaurant-admin:%BUILD_NUMBER% -t restaurant-admin:latest .'
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

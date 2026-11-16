
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

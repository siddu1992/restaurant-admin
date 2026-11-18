pipeline {
    agent any

    stages {
        stage('Check Jenkins Docker') {
            steps {
                bat '''
                    echo ===== JENKINS USER =====
                    whoami

                    echo ===== USER PROFILE =====
                    echo %USERPROFILE%

                    echo ===== DOCKER VERSION =====
                    docker --version

                    echo ===== DOCKER LOCATION =====
                    where docker
                '''
            }
        }
    }
}
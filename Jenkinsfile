
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

    }

    post {
        success {
            echo 'Angular production build successful!'
        }

        failure {
            echo 'Angular build failed!'
        }
    }
}

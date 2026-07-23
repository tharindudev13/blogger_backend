pipeline {
    agent any 
    
    stages { 
        stage('SCM Checkout') {
            steps {
                retry(3) {
                    git branch: 'main', url: 'https://github.com/tharindudev13/blogger_backend'
                }
            }
        }
        stage('Build Docker Image') {
            steps {  
                bat 'docker build -t dev813/blogger_be:%BUILD_NUMBER% .'
            }
        }
        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS%"
                    }
                }
            }
        }
        stage('Push Image') {
            steps {
                bat 'docker push dev813/blogger_be:%BUILD_NUMBER%'
            }
        }
    }
    post {
        always {
            bat 'docker logout'
        }
    }
}
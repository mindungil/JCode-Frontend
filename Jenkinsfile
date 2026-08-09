pipeline {

   agent {

       kubernetes {

           label 'kaniko-agent'

           defaultContainer 'kaniko'

       }

   }

   

   environment {

       DOCKER_REGISTRY = "${env.DOCKER_REGISTRY_URL}"

       PROJECT_NAME = 'jsh2256'

       IMAGE_NAME = 'jcode-frontend'

       IMAGE_TAG = "${env.BUILD_NUMBER}"

       DEV_TAG = "dev-${env.BUILD_NUMBER}"

       HARBOR_CREDENTIALS = credentials('harbor-credentials')

       GIT_REPO_URL = "https://github.com/Jsh2256/jhub_frontend.git"

   }

   

   options {

       skipDefaultCheckout(true)

   }

   

   stages {

       stage('Custom Checkout') {

           steps {

               container('jnlp') {

                   sh """

                       rm -rf ./* || true

                       rm -rf ./.git || true

                       git init .

                       git config core.sharedRepository group

                       git config core.fileMode false

                       git remote add origin ${GIT_REPO_URL}

                       git fetch --no-tags origin

                       git checkout -f origin/master

                   """

               }

           }

       }

       

       stage('Create Docker Config') {

           steps {

               container('kaniko') {

                   sh """

                       mkdir -p /kaniko/.docker

                       echo '{"auths":{"${DOCKER_REGISTRY}":{"username":"${HARBOR_CREDENTIALS_USR}","password":"${HARBOR_CREDENTIALS_PSW}"}}}' > /kaniko/.docker/config.json

                   """

               }

           }

       }

       

       stage('Build and Push with Kaniko') {

           steps {

               container('kaniko') {

                   sh """

                       /kaniko/executor \

                       --context=\$(pwd)/frontend \

                       --destination=${DOCKER_REGISTRY}/${PROJECT_NAME}/${IMAGE_NAME}:${IMAGE_TAG} \

                       --destination=${DOCKER_REGISTRY}/${PROJECT_NAME}/${IMAGE_NAME}:${DEV_TAG} \

                       --cleanup

                   """

               }

           }

       }

   }

   

   post {

       always {

           echo "CI 파이프라인 완료"

       }

       success {

           echo "이미지 빌드 및 푸시 성공: ${DOCKER_REGISTRY}/${PROJECT_NAME}/${IMAGE_NAME}:${IMAGE_TAG}"

       }

       failure {

           echo "파이프라인 실패"

       }

       cleanup {

           cleanWs()

       }

   }

}

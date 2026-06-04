pipeline {
    agent any

    tools {
        nodejs "node24.9.0"
    }

    environment {
        SERVER_IP    = "127.0.0.1"
        PROJECT_PATH = "/home/ai-aesthetics-staging-assessment/htdocs/staging-assessment.ai-aesthetics.in"
        SSH_KEY      = "/var/lib/jenkins/.ssh/id_ed25519_deploy"
    }

    stages {
        stage("verify versions"){
            steps {
               sh 'node -v'
               sh 'npm -v'
               sh 'quasar --version'
            }
        }

        stage('Populate .env File') {
            steps {

                withCredentials([
                    file(
                        credentialsId: 'staging_assessment_env',
                        variable: 'ENV_FILE'
                    )
                ]) {

                    sh '''
                        cp -f $ENV_FILE .env
                    '''
                }
            }
        }
        stage("Build")
        {
            steps {
                sh 'yarn install --immutable --immutable-cache --check-cache' //use for CICD pipeline when safer installation
                sh 'yarn quasar clean'
                sh 'yarn quasar build'
            }
        }
        stage("Verify SSH connection to server") {
            steps {
                sshagent(credentials: ['jenkins']) {
                    sh '''
                        ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no root@147.93.31.88 whoami
                    '''
                }
            }
        }
    }
    post {
        success{
            withCredentials([sshUserPrivateKey(credentialsId: "jenkins", keyFileVariable: 'keyfile')]) {
                sh  'rsync -vrzhe "ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa" . root@147.93.31.88:/home/cbphysiotherapy-aiaesthetics/htdocs/aiaesthetics.cbphysiotherapy.in'
            }

            sshagent(credentials: ['jenkins']) {
                sh '''
                    ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no root@147.93.31.88 << EOF
                    whoami

                <<EOF '''
            }

        }
        always {
            cleanWs(cleanWhenNotBuilt: false,
                deleteDirs: true,
                disableDeferredWipeout: true,
                notFailBuild: true,
                patterns: [[pattern: '.gitignore', type: 'INCLUDE']])
        }

    }
}

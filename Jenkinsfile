pipeline {
    agent any

    tools {
        nodejs "node24.9.0"
    }

    environment {
        SERVER_IP    = "127.0.0.1"
        PROJECT_PATH = "/home/ai-aesthetics-assessment/htdocs/assessment.ai-aesthetics.in"
        SSH_KEY      = "/var/lib/jenkins/.ssh/id_ed25519_deploy"
    }

    stages {

        stage('Verify Versions') {
            steps {

                sh '''
                    node -v
                    npm -v
                    yarn -v
                    quasar --version
                '''
            }
        }

        stage('Populate .env File') {
            steps {

                withCredentials([
                    file(
                        credentialsId: 'production_assessment_env',
                        variable: 'ENV_FILE'
                    )
                ]) {

                    sh '''
                        cp -f $ENV_FILE .env
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            steps {

                sh '''
                    yarn install \
                    --immutable \
                    --immutable-cache \
                    --check-cache
                '''
            }
        }

        stage('Build Vue Application') {
            steps {

                sh '''
                    yarn quasar clean
                '''

                sh '''
                    yarn quasar build
                '''
            }
        }

        stage('Verify SSH Connection') {
            steps {

                sshagent(credentials: ['jenkins']) {

                    sh '''
                        ssh \
                        -i $SSH_KEY \
                        -o StrictHostKeyChecking=no \
                        root@$SERVER_IP "
                            whoami
                        "
                    '''
                }
            }
        }

        stage('Deploy Frontend Files') {
            steps {

                sshagent(credentials: ['jenkins']) {

                    sh '''
                        rsync -avzr --delete \
                        --exclude=".git" \
                        --exclude="node_modules" \
                        --exclude=".github" \
                        --exclude=".gitignore" \
                        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
                        ./dist/spa/ root@$SERVER_IP:$PROJECT_PATH
                    '''
                }
            }
        }

        stage('Set Permissions') {
            steps {

                sshagent(credentials: ['jenkins']) {

                    sh '''
ssh -i $SSH_KEY \
-o StrictHostKeyChecking=no \
root@$SERVER_IP << EOF

set -e

cd $PROJECT_PATH

echo "Current User:"
whoami

echo "Frontend Deployment Completed Successfully"

EOF
                    '''
                }
            }
        }
    }

    post {

        success {
            echo '✅ Frontend deployment completed successfully!'
        }

        failure {
            echo '❌ Frontend deployment failed!'
        }

        always {

            cleanWs(
                cleanWhenNotBuilt: false,
                deleteDirs: true,
                disableDeferredWipeout: true,
                notFailBuild: true,
                patterns: [
                    [
                        pattern: '.gitignore',
                        type: 'INCLUDE'
                    ]
                ]
            )
        }
    }
}
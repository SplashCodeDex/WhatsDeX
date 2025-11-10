Gemini, update ./deployment/environments/deploy-environments.sh to force a cache-less build (docker-compose build --no-cache) before starting the containers for both the testing and staging environments. This ensures that the updated Dockerfile.saas with the corrected prisma generate command is used.
The relevant parts of the script should be updated as follows:
bash
deploy_testing_environment() {
print_status "Deploying testing environment with comprehensive test suite..."

    # Force a no-cache build to pick up Dockerfile changes
    docker-compose -f $COMPOSE_FILE build --no-cache

    # Build and start services
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    # ... rest of the function

}

deploy_staging_environment() {
print_status "Deploying staging environment with production-like configuration..."

    # Force a no-cache build to pick up Dockerfile changes
    docker-compose -f $COMPOSE_FILE build --no-cache

    # Build and start services
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    # ... rest of the function

}

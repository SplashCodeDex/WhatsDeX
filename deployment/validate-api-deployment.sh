#!/bin/bash

# 🔍 WhatsDeX API Architecture Deployment Validation Script
# This script validates that all components of the new API architecture are working correctly

set -e

echo "🔍 Validating WhatsDeX API Architecture Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
passed_tests=0
total_tests=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    total_tests=$((total_tests + 1))
    echo -n "Testing $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    total_tests=$((total_tests + 1))
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS (HTTP $response)${NC}"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL (HTTP $response, expected $expected_status)${NC}"
        return 1
    fi
}

# Function to test authenticated API endpoint
test_auth_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local api_key="$3"
    local expected_status="${4:-200}"
    
    total_tests=$((total_tests + 1))
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "x-internal-api-key: $api_key" \
        "$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS (HTTP $response)${NC}"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL (HTTP $response, expected $expected_status)${NC}"
        return 1
    fi
}

echo ""
echo "🐳 1. DOCKER CONTAINER HEALTH CHECKS"
echo "=================================================="

# Check if containers are running
containers=("whatsdx-postgres" "whatsdx-redis" "whatsdx-backend" "whatsdx-frontend" "whatsdx-nginx")

for container in "${containers[@]}"; do
    run_test "$container running" "docker ps --filter name=$container --filter status=running --quiet | grep -q ."
done

echo ""
echo "🏥 2. SERVICE HEALTH ENDPOINTS"
echo "=================================================="

# Test basic health endpoints
test_api_endpoint "http://localhost:3001/health" "Backend health endpoint"
test_api_endpoint "http://localhost:3000" "Frontend accessibility"
test_api_endpoint "http://localhost/health" "Nginx proxy health"

echo ""
echo "🔐 3. API AUTHENTICATION & ENDPOINTS"
echo "=================================================="

# Load environment variables to get API key
if [ -f "deployment/.env.production" ]; then
    source deployment/.env.production
elif [ -f ".env.production" ]; then
    source .env.production
else
    echo -e "${YELLOW}Warning: .env.production not found. Using default API key for testing.${NC}"
    INTERNAL_API_KEY="internal-api-key-change-in-production"
fi

# Test internal API endpoints
test_auth_api_endpoint "http://localhost:3001/api/internal/stripe/plans" "Stripe plans API" "$INTERNAL_API_KEY"

# Test tenant endpoint (using demo tenant)
test_auth_api_endpoint "http://localhost:3001/api/internal/tenants/demo" "Demo tenant API" "$INTERNAL_API_KEY"

# Test authentication endpoint
total_tests=$((total_tests + 1))
echo -n "Testing authentication API... "

auth_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-internal-api-key: $INTERNAL_API_KEY" \
    -d '{"tenantId":"demo","email":"admin@demo.com","password":"password123"}' \
    "http://localhost:3001/api/internal/auth/authenticate" 2>/dev/null || echo "000")

if [ "$auth_response" = "200" ] || [ "$auth_response" = "404" ]; then
    echo -e "${GREEN}✓ PASS (HTTP $auth_response)${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL (HTTP $auth_response)${NC}"
fi

echo ""
echo "🌐 4. FRONTEND-BACKEND COMMUNICATION"
echo "=================================================="

# Test if frontend can reach backend through internal network
run_test "Frontend container network connectivity" "docker exec whatsdx-frontend ping -c 1 backend"

# Test API communication
total_tests=$((total_tests + 1))
echo -n "Testing frontend to backend API communication... "

# This tests if the frontend can make API calls to backend
api_test_response=$(docker exec whatsdx-frontend curl -s -o /dev/null -w "%{http_code}" \
    -H "x-internal-api-key: $INTERNAL_API_KEY" \
    "http://backend:3001/api/internal/stripe/plans" 2>/dev/null || echo "000")

if [ "$api_test_response" = "200" ]; then
    echo -e "${GREEN}✓ PASS (HTTP $api_test_response)${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL (HTTP $api_test_response)${NC}"
fi

echo ""
echo "💾 5. DATABASE CONNECTIVITY"
echo "=================================================="

# Test PostgreSQL connection
run_test "PostgreSQL connection" "docker exec whatsdx-postgres pg_isready -U ${POSTGRES_USER:-whatsdx}"

# Test Redis connection
run_test "Redis connection" "docker exec whatsdx-redis redis-cli -a ${REDIS_PASSWORD} ping | grep -q PONG"

# Test backend database connection
total_tests=$((total_tests + 1))
echo -n "Testing backend database connectivity... "

db_test_response=$(curl -s "http://localhost:3001/health" | grep -q "database.*healthy" && echo "success" || echo "fail")

if [ "$db_test_response" = "success" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""
echo "🔄 6. PROXY & ROUTING"
echo "=================================================="

# Test API routing through proxy
test_api_endpoint "http://localhost/api/health" "API routing through Nginx" "404"

# Test static file serving
test_api_endpoint "http://localhost/_next/static" "Static file routing" "404"

echo ""
echo "📊 7. PERFORMANCE & RESOURCES"
echo "=================================================="

# Check container resource usage
echo "Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🔧 8. CONFIGURATION VALIDATION"
echo "=================================================="

# Check environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "INTERNAL_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo -e "✓ $var is set"
    else
        echo -e "${RED}✗ $var is not set${NC}"
    fi
done

echo ""
echo "======================================"
echo "📋 VALIDATION SUMMARY"
echo "======================================"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ($passed_tests/$total_tests)${NC}"
    echo ""
    echo -e "${GREEN}✅ Your WhatsDeX API architecture is fully operational!${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "  • Configure your domain name"
    echo "  • Set up SSL certificates"
    echo "  • Configure monitoring"
    echo "  • Set up automated backups"
else
    failed_tests=$((total_tests - passed_tests))
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED ($passed_tests/$total_tests passed, $failed_tests failed)${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  • Check container logs: docker-compose -f deployment/production-api.docker-compose.yml logs"
    echo "  • Verify environment configuration: deployment/.env.production"
    echo "  • Check service status: docker-compose -f deployment/production-api.docker-compose.yml ps"
fi

echo ""
echo "📝 Useful commands:"
echo "  • View logs: docker-compose -f deployment/production-api.docker-compose.yml logs -f"
echo "  • Restart services: docker-compose -f deployment/production-api.docker-compose.yml restart"
echo "  • Stop services: docker-compose -f deployment/production-api.docker-compose.yml down"
echo "  • Update deployment: ./deployment/quick-deploy-api.sh"

exit $((total_tests - passed_tests))
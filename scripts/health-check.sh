#!/bin/bash

# WhatsDeX Admin System - Health Check Script
# This script performs comprehensive health checks on the deployed system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="whatsdex-admin"
APP_PORT=3001
DOMAIN_NAME=""
HEALTH_ENDPOINT="http://localhost:$APP_PORT/health"

# Health check results
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

# Check system resources
check_system_resources() {
    print_header "System Resource Check"

    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    if (( $(echo "$cpu_usage < 80" | bc -l) )); then
        print_success "CPU Usage: ${cpu_usage}%"
    else
        print_warning "High CPU Usage: ${cpu_usage}%"
    fi

    # Memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage < 80" | bc -l) )); then
        print_success "Memory Usage: ${mem_usage}%"
    else
        print_warning "High Memory Usage: ${mem_usage}%"
    fi

    # Disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 85 ]; then
        print_success "Disk Usage: ${disk_usage}%"
    else
        print_warning "High Disk Usage: ${disk_usage}%"
    fi
}

# Check application status
check_application() {
    print_header "Application Status Check"

    # Check if PM2 process is running
    if pm2 list | grep -q "$APP_NAME"; then
        print_success "PM2 Process: Running"

        # Get process status
        local process_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")
        if [ "$process_status" = "online" ]; then
            print_success "Application Status: Online"
        else
            print_error "Application Status: $process_status"
        fi

        # Check restart count
        local restart_count=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time")
        if [ "$restart_count" -lt 5 ]; then
            print_success "Restart Count: $restart_count"
        else
            print_warning "High Restart Count: $restart_count"
        fi

    else
        print_error "PM2 Process: Not found"
    fi
}

# Check application health endpoint
check_health_endpoint() {
    print_header "Application Health Check"

    if command -v curl &> /dev/null; then
        # Test internal health endpoint
        if curl -f -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            print_success "Internal Health Endpoint: OK"

            # Get health details
            local health_response=$(curl -s "$HEALTH_ENDPOINT")
            local uptime=$(echo "$health_response" | jq -r '.uptime // empty')
            local status=$(echo "$health_response" | jq -r '.status // empty')

            if [ "$status" = "healthy" ]; then
                print_success "Application Health Status: $status"
            else
                print_error "Application Health Status: $status"
            fi

            if [ -n "$uptime" ]; then
                local uptime_hours=$(echo "scale=1; $uptime / 3600" | bc 2>/dev/null || echo "0")
                print_success "Application Uptime: ${uptime_hours}h"
            fi

        else
            print_error "Internal Health Endpoint: Failed"
        fi

        # Test external health endpoint if domain is configured
        if [ -n "$DOMAIN_NAME" ]; then
            if curl -f -k -s "https://$DOMAIN_NAME/health" > /dev/null 2>&1; then
                print_success "External Health Endpoint: OK"
            else
                print_warning "External Health Endpoint: Failed (check SSL/domain configuration)"
            fi
        fi

    else
        print_warning "curl not available - skipping health endpoint checks"
    fi
}

# Check database connectivity
check_database() {
    print_header "Database Connectivity Check"

    if command -v psql &> /dev/null; then
        # Get database connection details from environment
        if [ -f ".env.production" ]; then
            local db_url=$(grep "DATABASE_URL" .env.production | cut -d'=' -f2- | tr -d '"')

            if [ -n "$db_url" ]; then
                # Extract connection details from URL
                local db_user=$(echo "$db_url" | sed -n 's|.*://\([^:]*\):.*|\1|p')
                local db_password=$(echo "$db_url" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
                local db_host=$(echo "$db_url" | sed -n 's|.*@\([^:]*\):.*|\1|p')
                local db_port=$(echo "$db_url" | sed -n 's|.*:\([^/]*\)/.*|\1|p')
                local db_name=$(echo "$db_url" | sed -n 's|.*/\([^?]*\).*|\1|p')

                # Test connection
                if PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT 1;" > /dev/null 2>&1; then
                    print_success "Database Connection: OK"

                    # Check database size
                    local db_size=$(PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" | tr -d ' ')
                    print_success "Database Size: $db_size"

                    # Check active connections
                    local active_connections=$(PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | tr -d ' ')
                    if [ "$active_connections" -lt 50 ]; then
                        print_success "Active Connections: $active_connections"
                    else
                        print_warning "High Active Connections: $active_connections"
                    fi

                else
                    print_error "Database Connection: Failed"
                fi
            else
                print_error "DATABASE_URL not found in .env.production"
            fi
        else
            print_error ".env.production file not found"
        fi
    else
        print_warning "psql not available - skipping database checks"
    fi
}

# Check nginx status
check_nginx() {
    print_header "Nginx Status Check"

    if command -v nginx &> /dev/null; then
        if sudo systemctl is-active --quiet nginx; then
            print_success "Nginx Service: Running"

            # Test nginx configuration
            if sudo nginx -t > /dev/null 2>&1; then
                print_success "Nginx Configuration: Valid"
            else
                print_error "Nginx Configuration: Invalid"
            fi

            # Check nginx error logs for recent errors
            local recent_errors=$(sudo tail -n 50 /var/log/nginx/error.log 2>/dev/null | grep -c "$(date +%Y/%m/%d)" || echo "0")
            if [ "$recent_errors" -eq 0 ]; then
                print_success "Nginx Error Logs: Clean"
            else
                print_warning "Nginx Error Logs: $recent_errors recent errors"
            fi

        else
            print_error "Nginx Service: Not running"
        fi
    else
        print_warning "nginx not available - skipping nginx checks"
    fi
}

# Check SSL certificate
check_ssl() {
    print_header "SSL Certificate Check"

    if [ -n "$DOMAIN_NAME" ] && command -v openssl &> /dev/null; then
        if openssl s_client -connect "$DOMAIN_NAME:443" -servername "$DOMAIN_NAME" < /dev/null > /dev/null 2>&1; then
            print_success "SSL Certificate: Valid"

            # Check certificate expiry
            local expiry_date=$(echo | openssl s_client -connect "$DOMAIN_NAME:443" -servername "$DOMAIN_NAME" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d'=' -f2)
            if [ -n "$expiry_date" ]; then
                local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local now_epoch=$(date +%s)
                local days_until_expiry=$(( (expiry_epoch - now_epoch) / 86400 ))

                if [ $days_until_expiry -gt 30 ]; then
                    print_success "SSL Expiry: $days_until_expiry days remaining"
                else
                    print_warning "SSL Expiry: $days_until_expiry days remaining"
                fi
            fi
        else
            print_error "SSL Certificate: Invalid or missing"
        fi
    else
        print_warning "SSL check skipped (domain not configured or openssl not available)"
    fi
}

# Check backup status
check_backup() {
    print_header "Backup Status Check"

    local backup_dir="/var/backups/whatsdex"

    if [ -d "$backup_dir" ]; then
        # Check latest backup
        local latest_backup=$(find "$backup_dir" -name "db_backup_*.sql*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

        if [ -n "$latest_backup" ]; then
            local backup_age_hours=$(( ( $(date +%s) - $(stat -c %Y "$latest_backup" 2>/dev/null || stat -f %m "$latest_backup" 2>/dev/null || echo $(date +%s)) ) / 3600 ))

            if [ $backup_age_hours -lt 25 ]; then
                local backup_size=$(du -h "$latest_backup" | cut -f1)
                print_success "Latest Backup: $(basename "$latest_backup") (${backup_size})"
            else
                print_warning "Latest Backup: ${backup_age_hours} hours old"
            fi

            # Check backup count
            local backup_count=$(find "$backup_dir" -name "db_backup_*.sql*" | wc -l)
            print_success "Total Backups: $backup_count"

        else
            print_error "No backup files found"
        fi

        # Check backup disk space
        local backup_size_total=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "0")
        print_success "Backup Storage Used: $backup_size_total"

    else
        print_error "Backup directory not found: $backup_dir"
    fi
}

# Generate health report
generate_report() {
    print_header "Health Check Summary"

    echo -e "${BLUE}Health Check Results:${NC}"
    echo "  ✅ Passed: $CHECKS_PASSED"
    echo "  ⚠️  Warnings: $WARNINGS"
    echo "  ❌ Failed: $CHECKS_FAILED"
    echo ""

    local total_checks=$((CHECKS_PASSED + CHECKS_FAILED))
    if [ $total_checks -gt 0 ]; then
        local success_rate=$(( (CHECKS_PASSED * 100) / total_checks ))
        echo -e "${BLUE}Success Rate: ${success_rate}%${NC}"
        echo ""

        if [ $CHECKS_FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}🎉 All systems operational!${NC}"
        elif [ $CHECKS_FAILED -eq 0 ]; then
            echo -e "${YELLOW}⚠️  System operational with warnings${NC}"
        else
            echo -e "${RED}❌ System has issues that need attention${NC}"
        fi
    fi

    # Save report to file
    local report_file="/tmp/whatsdex-health-report-$(date +%Y%m%d_%H%M%S).txt"
    {
        echo "WhatsDeX Health Check Report"
        echo "Generated: $(date)"
        echo ""
        echo "Checks Passed: $CHECKS_PASSED"
        echo "Warnings: $WARNINGS"
        echo "Checks Failed: $CHECKS_FAILED"
        echo ""
        echo "System Status: $([ $CHECKS_FAILED -eq 0 ] && echo "Healthy" || echo "Issues Detected")"
    } > "$report_file"

    print_status "Report saved to: $report_file"
}

# Main function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN_NAME="${1#*=}"
                shift
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            *)
                echo "Usage: $0 [--domain=yourdomain.com] [--quiet]"
                exit 1
                ;;
        esac
    done

    print_header "WhatsDeX Admin System - Health Check"

    # Run all checks
    check_system_resources
    check_application
    check_health_endpoint
    check_database
    check_nginx
    check_ssl
    check_backup

    # Generate report
    generate_report

    # Exit with appropriate code
    if [ $CHECKS_FAILED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
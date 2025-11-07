#!/bin/bash

# WhatsDeX Monitoring Stack Setup Script
# Comprehensive monitoring deployment and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}❌ $1${NC}"
    elif [ "$2" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    elif [ "$2" = "HEADER" ]; then
        echo -e "${PURPLE}🔷 $1${NC}"
    else
        echo "📋 $1"
    fi
}

show_banner() {
    echo -e "${BLUE}"
    echo "███╗   ███╗ ██████╗ ███╗   ██╗██╗████████╗ ██████╗ ██████╗ ██╗███╗   ██╗ ██████╗ "
    echo "████╗ ████║██╔═══██╗████╗  ██║██║╚══██╔══╝██╔═══██╗██╔══██╗██║████╗  ██║██╔════╝ "
    echo "██╔████╔██║██║   ██║██╔██╗ ██║██║   ██║   ██║   ██║██████╔╝██║██╔██╗ ██║██║  ███╗"
    echo "██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║   ██║   ██║██╔══██╗██║██║╚██╗██║██║   ██║"
    echo "██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║   ██║   ╚██████╔╝██║  ██║██║██║ ╚████║╚██████╔╝"
    echo "╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ "
    echo -e "${NC}"
    echo -e "${PURPLE}📊 WhatsDeX Monitoring Stack Setup${NC}"
    echo "===================================="
}

check_prerequisites() {
    print_status "Checking prerequisites..." "HEADER"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker found: $DOCKER_VERSION" "SUCCESS"
    else
        print_status "Docker not found! Please install Docker first." "ERROR"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_status "Docker Compose found: $COMPOSE_VERSION" "SUCCESS"
    else
        print_status "Docker Compose not found! Please install Docker Compose first." "ERROR"
        exit 1
    fi
    
    # Check available disk space
    AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 10 ]; then
        print_status "Warning: Less than 10GB available disk space" "WARNING"
        echo "Monitoring stack requires at least 10GB for data storage"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_status "Sufficient disk space available: ${AVAILABLE_SPACE}GB" "SUCCESS"
    fi
}

setup_directories() {
    print_status "Setting up monitoring directories..." "HEADER"
    
    # Create required directories
    DIRS=(
        "alerts"
        "grafana/provisioning/datasources"
        "grafana/provisioning/dashboards"
        "grafana/dashboards"
        "data/prometheus"
        "data/grafana" 
        "data/alertmanager"
        "data/loki"
        "logs"
        "config"
    )
    
    for dir in "${DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir" "SUCCESS"
        else
            print_status "Directory exists: $dir" "INFO"
        fi
    done
    
    # Set proper permissions
    chmod 755 data/prometheus data/grafana data/alertmanager data/loki
    print_status "Directory permissions set" "SUCCESS"
}

configure_grafana() {
    print_status "Configuring Grafana..." "HEADER"
    
    # Create Grafana configuration
    cat > grafana/grafana.ini << 'EOF'
[analytics]
reporting_enabled = false
check_for_updates = false

[security]
admin_user = admin
admin_password = ${GRAFANA_PASSWORD}
cookie_secure = true
cookie_samesite = strict

[server]
domain = monitoring.yourdomain.com
root_url = https://monitoring.yourdomain.com
serve_from_sub_path = false

[database]
type = sqlite3
path = /var/lib/grafana/grafana.db

[session]
provider = memory

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[auth.anonymous]
enabled = false

[log]
mode = console
level = info

[plugins]
enable_alpha = false
app_tls_skip_verify_insecure = false

[alerting]
enabled = true
execute_alerts = true

[unified_alerting]
enabled = true
EOF
    
    # Create datasource configuration
    cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "5s"
      
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
    jsonData:
      maxLines: 1000
EOF
    
    # Create dashboard provisioning
    cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
    
    print_status "Grafana configuration created" "SUCCESS"
}

create_additional_configs() {
    print_status "Creating additional monitoring configurations..." "HEADER"
    
    # SSL exporter config
    cat > ssl-exporter-config.yml << 'EOF'
modules:
  https:
    prober: https
    timeout: 5s
    https:
      valid_status_codes: []
      method: "GET"
      no_follow_redirects: false
      fail_if_ssl: false
      fail_if_not_ssl: true
      tls_config:
        insecure_skip_verify: false
      preferred_ip_protocol: "ip4"

targets:
  - name: "whatsdx-main"
    target: "https://yourdomain.com"
  - name: "whatsdx-api"
    target: "https://api.yourdomain.com"
  - name: "whatsdx-monitoring"
    target: "https://monitoring.yourdomain.com"
EOF
    
    # PostgreSQL queries config
    cat > postgres-queries.yaml << 'EOF'
pg_database:
  query: "SELECT pg_database.datname, pg_database_size(pg_database.datname) as size FROM pg_database"
  master: true
  cache_seconds: 30
  metrics:
    - datname:
        usage: "LABEL"
        description: "Name of the database"
    - size:
        usage: "GAUGE"
        description: "Disk space used by the database"

pg_stat_user_tables:
  query: "SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables"
  master: true
  cache_seconds: 30
  metrics:
    - schemaname:
        usage: "LABEL"
        description: "Schema name"
    - tablename:
        usage: "LABEL"
        description: "Table name"
    - seq_scan:
        usage: "COUNTER"
        description: "Number of sequential scans"
    - seq_tup_read:
        usage: "COUNTER"
        description: "Number of tuples read by sequential scans"
    - idx_scan:
        usage: "COUNTER"
        description: "Number of index scans"
    - idx_tup_fetch:
        usage: "COUNTER"
        description: "Number of tuples fetched by index scans"
    - n_tup_ins:
        usage: "COUNTER"
        description: "Number of tuples inserted"
    - n_tup_upd:
        usage: "COUNTER"
        description: "Number of tuples updated"
    - n_tup_del:
        usage: "COUNTER"
        description: "Number of tuples deleted"
EOF
    
    print_status "Additional configurations created" "SUCCESS"
}

validate_configuration() {
    print_status "Validating monitoring configuration..." "HEADER"
    
    # Check if all required files exist
    REQUIRED_FILES=(
        "prometheus-enhanced.yml"
        "alertmanager.yml"
        "docker-compose.monitoring.yml"
        "grafana/grafana.ini"
        "grafana/provisioning/datasources/prometheus.yml"
        "loki-config.yml"
        "promtail-config.yml"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_status "Configuration file exists: $file" "SUCCESS"
        else
            print_status "Missing configuration file: $file" "ERROR"
            return 1
        fi
    done
    
    # Validate Docker Compose configuration
    if docker-compose -f docker-compose.monitoring.yml config --quiet 2>/dev/null; then
        print_status "Docker Compose configuration is valid" "SUCCESS"
    else
        print_status "Docker Compose configuration has errors" "ERROR"
        return 1
    fi
    
    return 0
}

deploy_monitoring() {
    print_status "Deploying monitoring stack..." "HEADER"
    
    # Set environment variables
    export GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin123}
    export POSTGRES_USER=${POSTGRES_USER:-whatsdex}
    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}
    export POSTGRES_DB=${POSTGRES_DB:-whatsdx}
    
    print_status "Starting monitoring services..." "INFO"
    
    # Pull latest images
    docker-compose -f docker-compose.monitoring.yml pull
    
    # Start services
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..." "INFO"
    sleep 30
    
    # Check service health
    SERVICES=(prometheus grafana alertmanager loki)
    for service in "${SERVICES[@]}"; do
        if docker-compose -f docker-compose.monitoring.yml ps "$service" | grep -q "Up"; then
            print_status "$service is running" "SUCCESS"
        else
            print_status "$service failed to start" "ERROR"
            docker-compose -f docker-compose.monitoring.yml logs "$service"
        fi
    done
}

show_access_info() {
    print_status "Access Information" "HEADER"
    
    echo "🌐 Monitoring Services:"
    echo "├── 📊 Prometheus: http://localhost:9090"
    echo "├── 📈 Grafana: http://localhost:3002 (admin/admin123)"
    echo "├── 🚨 Alertmanager: http://localhost:9093"
    echo "├── 📋 Loki: http://localhost:3100"
    echo "└── 💻 Node Exporter: http://localhost:9100"
    
    echo
    echo "📊 Pre-configured Dashboards:"
    echo "├── WhatsDeX Overview"
    echo "├── WhatsDeX Comprehensive Monitoring"
    echo "├── WhatsDeX Business Metrics"
    echo "└── System Resource Monitoring"
    
    echo
    echo "🔧 Management Commands:"
    echo "├── View logs: docker-compose -f docker-compose.monitoring.yml logs -f [service]"
    echo "├── Stop monitoring: docker-compose -f docker-compose.monitoring.yml down"
    echo "├── Restart service: docker-compose -f docker-compose.monitoring.yml restart [service]"
    echo "└── Check status: docker-compose -f docker-compose.monitoring.yml ps"
}

# Main execution
main() {
    show_banner
    
    echo "🚀 Starting WhatsDeX monitoring stack deployment..."
    echo
    
    check_prerequisites
    setup_directories
    configure_grafana
    create_additional_configs
    
    if validate_configuration; then
        print_status "All configurations validated successfully" "SUCCESS"
    else
        print_status "Configuration validation failed" "ERROR"
        exit 1
    fi
    
    deploy_monitoring
    show_access_info
    
    echo
    print_status "Monitoring stack deployment completed!" "SUCCESS"
    print_status "Access Grafana at http://localhost:3002 (admin/admin123)" "INFO"
    print_status "Import dashboards from the grafana/dashboards/ directory" "INFO"
}

# Run main function
main "$@"
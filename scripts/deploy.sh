#!/bin/bash

# WhatsDeX Admin System - Production Deployment Script
# This script automates the deployment process for the admin system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="whatsdex-admin"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/whatsdex"
LOG_DIR="/var/log/whatsdex"

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
       print_error "This script should not be run as root for security reasons"
       exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18+ first."
        exit 1
    fi

    local node_version=$(node -v | sed 's/v//')
    print_success "Node.js version: $node_version"

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi

    local npm_version=$(npm -v)
    print_success "npm version: $npm_version"

    # Check if PostgreSQL is installed
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL first."
        exit 1
    fi

    print_success "PostgreSQL is installed"

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install git."
        exit 1
    fi

    print_success "Git is installed"
}

# Setup directories
setup_directories() {
    print_header "Setting Up Directories"

    # Create application directory
    if [ ! -d "$APP_DIR" ]; then
        print_status "Creating application directory: $APP_DIR"
        sudo mkdir -p "$APP_DIR"
        sudo chown "$USER:$USER" "$APP_DIR"
    fi

    # Create backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown "$USER:$USER" "$BACKUP_DIR"
    fi

    # Create log directory
    if [ ! -d "$LOG_DIR" ]; then
        print_status "Creating log directory: $LOG_DIR"
        sudo mkdir -p "$LOG_DIR"
        sudo chown "$USER:$USER" "$LOG_DIR"
    fi

    print_success "Directories created successfully"
}

# Clone or update repository
setup_repository() {
    print_header "Setting Up Repository"

    if [ ! -d "$APP_DIR/.git" ]; then
        print_status "Cloning repository..."
        git clone . "$APP_DIR"
    else
        print_status "Updating repository..."
        cd "$APP_DIR"
        git pull origin main
    fi

    print_success "Repository setup completed"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    cd "$APP_DIR"

    print_status "Installing npm dependencies..."
    npm ci --production

    print_success "Dependencies installed successfully"
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"

    cd "$APP_DIR"

    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Creating from template..."
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env.production
            print_warning "Please update .env.production with your actual configuration values"
        else
            print_error ".env.production.example not found. Please create .env.production manually"
            exit 1
        fi
    else
        print_success ".env.production already exists"
    fi

    # Validate environment file
    if ! grep -q "DATABASE_URL" .env.production; then
        print_error "DATABASE_URL not found in .env.production"
        exit 1
    fi

    print_success "Environment setup completed"
}

# Setup database
setup_database() {
    print_header "Setting Up Database"

    cd "$APP_DIR"

    # Run database setup script
    if [ -f "scripts/setup-database.sh" ]; then
        print_status "Running database setup script..."
        bash scripts/setup-database.sh
    else
        print_error "Database setup script not found"
        exit 1
    fi

    print_success "Database setup completed"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"

    cd "$APP_DIR"

    print_status "Generating Prisma client..."
    npx prisma generate

    print_status "Running database migrations..."
    npx prisma migrate deploy

    print_success "Database migrations completed"
}

# Build application
build_application() {
    print_header "Building Application"

    cd "$APP_DIR"

    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate

    # Build application if build script exists
    if npm run | grep -q "build"; then
        print_status "Building application..."
        npm run build
    fi

    print_success "Application build completed"
}

# Setup PM2
setup_pm2() {
    print_header "Setting Up PM2 Process Manager"

    cd "$APP_DIR"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        sudo npm install -g pm2
    fi

    # Stop existing application if running
    if pm2 list | grep -q "$APP_NAME"; then
        print_status "Stopping existing application..."
        pm2 stop "$APP_NAME" || true
        pm2 delete "$APP_NAME" || true
    fi

    # Start application with PM2
    print_status "Starting application with PM2..."
    pm2 start ecosystem.config.js --env production

    # Save PM2 configuration
    pm2 save

    # Setup PM2 startup script
    print_status "Setting up PM2 startup script..."
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$USER" --hp "$HOME"

    print_success "PM2 setup completed"
}

# Setup nginx
setup_nginx() {
    print_header "Setting Up Nginx"

    # Check if nginx configuration exists
    if [ -f "$APP_DIR/nginx.conf" ]; then
        print_status "Copying nginx configuration..."
        sudo cp "$APP_DIR/nginx.conf" "/etc/nginx/sites-available/$APP_NAME"

        # Update server name in nginx config
        if [ -n "$DOMAIN_NAME" ]; then
            sudo sed -i "s/yourdomain.com/$DOMAIN_NAME/g" "/etc/nginx/sites-available/$APP_NAME"
        fi

        # Enable site
        sudo ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"

        # Remove default nginx site if it exists
        sudo rm -f /etc/nginx/sites-enabled/default

        # Test nginx configuration
        print_status "Testing nginx configuration..."
        if sudo nginx -t; then
            print_success "Nginx configuration is valid"
            sudo systemctl reload nginx
            print_success "Nginx reloaded successfully"
        else
            print_error "Nginx configuration test failed"
            exit 1
        fi
    else
        print_warning "Nginx configuration file not found. Please configure nginx manually."
    fi
}

# Setup SSL
setup_ssl() {
    print_header "Setting Up SSL Certificate"

    if [ -n "$DOMAIN_NAME" ]; then
        print_status "Setting up SSL certificate for $DOMAIN_NAME..."

        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            print_status "Installing certbot..."
            sudo apt install -y certbot python3-certbot-nginx
        fi

        # Obtain SSL certificate
        print_status "Obtaining SSL certificate..."
        sudo certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos --email "admin@$DOMAIN_NAME"

        print_success "SSL certificate setup completed"
    else
        print_warning "Domain name not provided. Please configure SSL manually."
    fi
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting Up Monitoring"

    # Install monitoring tools
    print_status "Installing monitoring tools..."
    sudo apt install -y prometheus-node-exporter

    # Start node exporter
    sudo systemctl start prometheus-node-exporter
    sudo systemctl enable prometheus-node-exporter

    print_success "Monitoring setup completed"
}

# Setup backup
setup_backup() {
    print_header "Setting Up Automated Backup"

    cd "$APP_DIR"

    if [ -f "scripts/backup.sh" ]; then
        # Make backup script executable
        chmod +x scripts/backup.sh

        # Setup cron job for daily backup
        print_status "Setting up daily backup cron job..."
        (crontab -l ; echo "0 2 * * * $APP_DIR/scripts/backup.sh") | crontab -

        print_success "Automated backup setup completed"
    else
        print_warning "Backup script not found"
    fi
}

# Test deployment
test_deployment() {
    print_header "Testing Deployment"

    # Wait for application to start
    print_status "Waiting for application to start..."
    sleep 10

    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -f -k "http://localhost:3001/health" > /dev/null 2>&1; then
        print_success "Health endpoint test passed"
    else
        print_warning "Health endpoint test failed - application may still be starting"
    fi

    # Test nginx
    if sudo systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_warning "Nginx is not running"
    fi

    # Test PM2
    if pm2 list | grep -q "$APP_NAME"; then
        print_success "PM2 application is running"
    else
        print_error "PM2 application is not running"
        exit 1
    fi

    print_success "Deployment testing completed"
}

# Show deployment summary
show_summary() {
    print_header "Deployment Summary"

    echo -e "${GREEN}WhatsDeX Admin System has been deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Application Details:${NC}"
    echo "  • Application Directory: $APP_DIR"
    echo "  • PM2 Process Name: $APP_NAME"
    echo "  • Port: 3001"
    echo "  • Health Check: http://localhost:3001/health"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Update .env.production with your actual configuration"
    echo "  2. Configure your domain DNS to point to this server"
    echo "  3. Update nginx configuration with your domain name"
    echo "  4. Test the application thoroughly"
    echo "  5. Set up monitoring and alerting"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  • View logs: pm2 logs $APP_NAME"
    echo "  • Restart app: pm2 restart $APP_NAME"
    echo "  • Check status: pm2 status"
    echo "  • Monitor resources: pm2 monit"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "  • Change default passwords and secrets"
    echo "  • Set up proper firewall rules"
    echo "  • Configure backup storage"
    echo "  • Set up monitoring alerts"
}

# Main deployment function
main() {
    print_header "WhatsDeX Admin System - Production Deployment"

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN_NAME="${1#*=}"
                shift
                ;;
            --skip-nginx)
                SKIP_NGINX=true
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Usage: $0 [--domain=yourdomain.com] [--skip-nginx] [--skip-ssl]"
                exit 1
                ;;
        esac
    done

    # Run deployment steps
    check_root
    check_requirements
    setup_directories
    setup_repository
    install_dependencies
    setup_environment
    setup_database
    run_migrations
    build_application
    setup_pm2

    if [ "$SKIP_NGINX" != true ]; then
        setup_nginx
    fi

    if [ "$SKIP_SSL" != true ] && [ -n "$DOMAIN_NAME" ]; then
        setup_ssl
    fi

    setup_monitoring
    setup_backup
    test_deployment
    show_summary

    print_success "Deployment completed successfully! 🎉"
}

# Run main function
main "$@"
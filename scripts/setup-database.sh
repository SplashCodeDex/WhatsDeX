#!/bin/bash

# WhatsDeX Admin Database Setup Script
# This script sets up PostgreSQL database for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="whatsdex_prod"
DB_USER="whatsdex_admin"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

# Function to print colored output
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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Get database password from user
if [ -z "$DB_PASSWORD" ]; then
    echo -n "Enter database password for user '$DB_USER': "
    read -s DB_PASSWORD
    echo
fi

print_status "Setting up WhatsDeX database..."

# Create database and user
print_status "Creating database and user..."
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;

-- Set up extensions
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
EOF

print_success "Database and user created successfully"

# Configure PostgreSQL for production
print_status "Configuring PostgreSQL for production..."

# Backup original config
sudo cp /etc/postgresql/14/main/postgresql.conf /etc/postgresql/14/main/postgresql.conf.backup

# Update PostgreSQL configuration
sudo tee -a /etc/postgresql/14/main/postgresql.conf > /dev/null << EOF

# WhatsDeX Production Configuration
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
tcp_keepalives_idle = 60
tcp_keepalives_interval = 10
tcp_keepalives_count = 6

# Logging
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'ddl'
log_duration = on
log_lock_waits = on
log_temp_files = 0

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 20s
EOF

# Configure pg_hba.conf for local connections
sudo tee -a /etc/postgresql/14/main/pg_hba.conf > /dev/null << EOF

# WhatsDeX Admin Database Access
host    $DB_NAME    $DB_USER    127.0.0.1/32    md5
EOF

# Restart PostgreSQL
print_status "Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Test connection
print_status "Testing database connection..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection test successful"
else
    print_error "Database connection test failed"
    exit 1
fi

# Generate DATABASE_URL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

print_success "Database setup completed!"
print_status "Database URL: $DATABASE_URL"
print_warning "Please save this DATABASE_URL securely and update your .env.production file"

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    print_status "Creating .env.production template..."
    cat > .env.production << EOF
# WhatsDeX Admin System - Production Environment Configuration
DATABASE_URL="$DATABASE_URL"

# Update these values with your actual configuration
NODE_ENV=production
ADMIN_PORT=3001
HOST=127.0.0.1
JWT_SECRET="your-super-secure-jwt-secret-key-change-this-in-production"
FRONTEND_URL="https://yourdomain.com"
CORS_ORIGIN="https://yourdomain.com"
EOF
    print_success ".env.production template created"
else
    print_warning ".env.production already exists, please update DATABASE_URL manually"
fi

print_success "Database setup script completed successfully!"
print_status "Next steps:"
echo "  1. Update .env.production with your configuration"
echo "  2. Run database migrations: npx prisma migrate deploy"
echo "  3. Start the application: npm start"
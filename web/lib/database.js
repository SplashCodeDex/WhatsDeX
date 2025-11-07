// Multi-tenant Database Configuration for WhatsDeX SaaS

import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://whatsdx:password@localhost:5432/whatsdx',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Multi-tenant database schema
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create tenants (customers) table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        plan VARCHAR(50) DEFAULT 'free',
        status VARCHAR(50) DEFAULT 'active',
        whatsapp_session_id VARCHAR(255),
        bot_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create tenant users table (users per tenant)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      )
    `);

    // Create tenant bot instances table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_bots (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        bot_name VARCHAR(255) NOT NULL,
        whatsapp_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'inactive',
        session_data JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create tenant analytics table (per-tenant metrics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_analytics (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        messages_sent INTEGER DEFAULT 0,
        messages_received INTEGER DEFAULT 0,
        commands_executed INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, date)
      )
    `);

    // Create tenant subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        stripe_subscription_id VARCHAR(255),
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        monthly_price DECIMAL(10,2) DEFAULT 0,
        features JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
      CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tenant_bots_tenant_id ON tenant_bots(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tenant_analytics_tenant_date ON tenant_analytics(tenant_id, date);
    `);

    console.log('✅ Multi-tenant database schema initialized');
  } finally {
    client.release();
  }
};

// Tenant management functions
export const createTenant = async (tenantData) => {
  const client = await pool.connect();
  try {
    const { name, email, subdomain, plan = 'free' } = tenantData;
    
    const result = await client.query(
      'INSERT INTO tenants (name, email, subdomain, plan) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, subdomain, plan]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getTenantBySubdomain = async (subdomain) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM tenants WHERE subdomain = $1 AND status = $2',
      [subdomain, 'active']
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getTenantById = async (tenantId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const createTenantUser = async (userData) => {
  const client = await pool.connect();
  try {
    const { tenant_id, email, password_hash, name, role = 'admin' } = userData;
    
    const result = await client.query(
      'INSERT INTO tenant_users (tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tenant_id, email, password_hash, name, role]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getTenantUser = async (tenant_id, email) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM tenant_users WHERE tenant_id = $1 AND email = $2 AND is_active = true',
      [tenant_id, email]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

// Analytics functions per tenant
export const updateTenantAnalytics = async (tenant_id, metrics) => {
  const client = await pool.connect();
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await client.query(`
      INSERT INTO tenant_analytics (tenant_id, date, messages_sent, messages_received, commands_executed, active_users)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id, date)
      DO UPDATE SET
        messages_sent = tenant_analytics.messages_sent + EXCLUDED.messages_sent,
        messages_received = tenant_analytics.messages_received + EXCLUDED.messages_received,
        commands_executed = tenant_analytics.commands_executed + EXCLUDED.commands_executed,
        active_users = GREATEST(tenant_analytics.active_users, EXCLUDED.active_users)
    `, [tenant_id, today, metrics.messages_sent || 0, metrics.messages_received || 0, metrics.commands_executed || 0, metrics.active_users || 0]);
    
  } finally {
    client.release();
  }
};

export const getTenantAnalytics = async (tenant_id, days = 30) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM tenant_analytics 
      WHERE tenant_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `, [tenant_id]);
    
    return result.rows;
  } finally {
    client.release();
  }
};

// Super admin functions
export const getAllTenants = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.*, 
             COUNT(tu.id) as user_count,
             COUNT(tb.id) as bot_count,
             COALESCE(SUM(ta.messages_sent), 0) as total_messages
      FROM tenants t
      LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
      LEFT JOIN tenant_bots tb ON t.id = tb.tenant_id
      LEFT JOIN tenant_analytics ta ON t.id = ta.tenant_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    
    return result.rows;
  } finally {
    client.release();
  }
};

export default pool;
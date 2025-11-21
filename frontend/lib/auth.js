// Multi-tenant Authentication System for WhatsDeX SaaS

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getTenantBySubdomain, getTenantUser, createTenant, createTenantUser } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@whatsdx.com';

// Extract tenant from request (subdomain or header)
export const extractTenant = (req) => {
  // Method 1: Subdomain extraction (e.g., customer1.whatsdx.com)
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  // Method 2: Custom header (for development)
  const tenantHeader = req.headers['x-tenant-id'];
  
  // Method 3: Query parameter (fallback)
  const tenantQuery = req.query.tenant;
  
  return tenantHeader || tenantQuery || subdomain;
};

// Tenant authentication middleware
export const authenticateTenant = async (req, res, next) => {
  try {
    const tenantIdentifier = extractTenant(req);
    
    if (!tenantIdentifier) {
      return res.status(400).json({ error: 'Tenant identifier required' });
    }
    
    const tenant = await getTenantBySubdomain(tenantIdentifier);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Tenant account suspended' });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// User authentication middleware
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Verify user still exists and is active
    if (!decoded.isSuperAdmin) {
      const user = await getTenantUser(decoded.tenant_id, decoded.email);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }
    }
    
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Super admin authentication
export const authenticateSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Customer registration
export const registerCustomer = async (customerData) => {
  const { companyName, email, password, subdomain } = customerData;
  
  try {
    // Check if subdomain is available
    const existingTenant = await getTenantBySubdomain(subdomain);
    if (existingTenant) {
      throw new Error('Subdomain already taken');
    }
    
    // Create tenant
    const tenant = await createTenant({
      name: companyName,
      email: email,
      subdomain: subdomain,
      plan: 'free'
    });
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create admin user for tenant
    const user = await createTenantUser({
      tenant_id: tenant.id,
      email: email,
      password_hash: passwordHash,
      name: companyName,
      role: 'admin'
    });
    
    return { tenant, user };
  } catch (error) {
    throw error;
  }
};

// Customer login
export const loginCustomer = async (tenantIdentifier, email, password) => {
  try {
    // Get tenant
    const tenant = await getTenantBySubdomain(tenantIdentifier);
    if (!tenant) {
      throw new Error('Invalid tenant');
    }
    
    // Get user
    const user = await getTenantUser(tenant.id, email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign({
      user_id: user.id,
      tenant_id: tenant.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_subdomain: tenant.subdomain
    }, JWT_SECRET, { expiresIn: '24h' });
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan
      }
    };
  } catch (error) {
    throw error;
  }
};

// Super admin login
export const loginSuperAdmin = async (email, password) => {
  try {
    if (email !== SUPER_ADMIN_EMAIL) {
      throw new Error('Invalid super admin credentials');
    }
    
    // In production, store this in database with proper hashing
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    
    if (password !== SUPER_ADMIN_PASSWORD) {
      throw new Error('Invalid super admin credentials');
    }
    
    // Generate super admin token
    const token = jwt.sign({
      email: email,
      isSuperAdmin: true,
      role: 'super_admin'
    }, JWT_SECRET, { expiresIn: '24h' });
    
    return {
      token,
      user: {
        email: email,
        role: 'super_admin',
        isSuperAdmin: true
      }
    };
  } catch (error) {
    throw error;
  }
};

// Generate API key for tenant (for bot integration)
export const generateTenantApiKey = (tenant_id) => {
  return jwt.sign({
    tenant_id: tenant_id,
    type: 'api_key'
  }, JWT_SECRET);
};

// Validate tenant API key
export const validateTenantApiKey = (apiKey) => {
  try {
    const decoded = jwt.verify(apiKey, JWT_SECRET);
    if (decoded.type !== 'api_key') {
      throw new Error('Invalid API key type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid API key');
  }
};

// Password utilities
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
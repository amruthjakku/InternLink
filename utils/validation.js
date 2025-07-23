/**
 * Input validation utilities for security and data integrity
 */

import { z } from 'zod';

// Common validation schemas
export const schemas = {
  email: z.string().email().min(1).max(255),
  username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  role: z.enum(['admin', 'POC', 'Tech Lead', 'AI Developer Intern']),
  url: z.string().url().max(500),
  ipAddress: z.string().ip(),
  date: z.coerce.date(),
  positiveInt: z.number().int().positive(),
  nonEmptyString: z.string().min(1).max(1000),
  safeHtml: z.string().max(10000).refine(
    (value) => !/<script|javascript:|on\w+=/i.test(value),
    { message: "Potentially unsafe HTML content" }
  ),
};

// User validation
export const userValidation = {
  create: z.object({
    gitlabUsername: schemas.username,
    gitlabId: z.string().min(1).max(50),
    name: schemas.nonEmptyString.max(100),
    email: schemas.email.optional(),
    role: schemas.role,
    college: schemas.objectId.optional(),
    assignedBy: schemas.nonEmptyString.max(100),
  }),
  
  update: z.object({
    name: schemas.nonEmptyString.max(100).optional(),
    email: schemas.email.optional(),
    role: schemas.role.optional(),
    college: schemas.objectId.optional(),
    isActive: z.boolean().optional(),
  }),
};

// GitLab validation
export const gitlabValidation = {
  webhook: z.object({
    event_type: z.string(),
    user: z.object({
      username: schemas.username,
      id: z.number(),
    }),
    project: z.object({
      id: z.number(),
      name: z.string(),
    }),
  }),
  
  commit: z.object({
    id: z.string(),
    message: z.string().max(500),
    author_name: z.string().max(100),
    author_email: schemas.email,
    timestamp: schemas.date,
  }),
};

// Task validation
export const taskValidation = {
  create: z.object({
    title: schemas.nonEmptyString.max(200),
    description: schemas.safeHtml,
    category: z.string().max(50),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    dueDate: schemas.date.optional(),
    assignedTo: z.array(schemas.objectId).optional(),
    cohortId: schemas.objectId.optional(),
  }),
  
  update: z.object({
    title: schemas.nonEmptyString.max(200).optional(),
    description: schemas.safeHtml.optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: schemas.date.optional(),
  }),
};

// Attendance validation
export const attendanceValidation = {
  checkin: z.object({
    userId: schemas.objectId,
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
    ipAddress: schemas.ipAddress.optional(),
  }),
  
  mark: z.object({
    userId: schemas.objectId,
    date: schemas.date,
    status: z.enum(['present', 'absent', 'late', 'excused']),
    notes: z.string().max(500).optional(),
  }),
};

// API request validation
export const apiValidation = {
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  search: z.object({
    query: z.string().max(100).optional(),
    filters: z.record(z.string()).optional(),
  }),
};

/**
 * Validate request body against schema
 */
export function validateBody(schema, data) {
  try {
    return {
      success: true,
      data: schema.parse(data),
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.errors || error.message,
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQuery(schema, query) {
  const parsed = {};
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      parsed[key] = value[0]; // Take first value if multiple
    } else {
      parsed[key] = value;
    }
  }
  
  return validateBody(schema, parsed);
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(identifier, limit = 100, windowMs = 15 * 60 * 1000) {
  // This would integrate with a rate limiting store (Redis, memory, etc.)
  // For now, just return true
  return true;
}

/**
 * IP address validation and whitelisting
 */
export function validateIpAddress(ip, whitelist = []) {
  if (!ip) return false;
  
  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    const localhostIps = ['127.0.0.1', '::1', 'localhost'];
    if (localhostIps.includes(ip)) return true;
  }
  
  // Check against whitelist
  if (whitelist.length > 0) {
    return whitelist.includes(ip);
  }
  
  return true; // Allow all if no whitelist
}

/**
 * File upload validation
 */
export const fileValidation = {
  image: z.object({
    size: z.number().max(5 * 1024 * 1024), // 5MB max
    type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
    name: z.string().max(255),
  }),
  
  document: z.object({
    size: z.number().max(10 * 1024 * 1024), // 10MB max
    type: z.string().regex(/^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/(plain|csv))$/),
    name: z.string().max(255),
  }),
  
  excel: z.object({
    size: z.number().max(25 * 1024 * 1024), // 25MB max
    type: z.string().regex(/^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/),
    name: z.string().max(255),
  }),
};

export default {
  schemas,
  userValidation,
  gitlabValidation,
  taskValidation,
  attendanceValidation,
  apiValidation,
  fileValidation,
  validateBody,
  validateQuery,
  sanitizeHtml,
  validateRateLimit,
  validateIpAddress,
};
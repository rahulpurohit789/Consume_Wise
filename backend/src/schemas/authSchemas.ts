import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password cannot exceed 100 characters'),
    name: z.string()
      .min(1, 'Name is required')
      .max(50, 'Name cannot exceed 50 characters')
      .trim(),
    preferences: z.object({
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional()
    }).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z.string()
      .min(1, 'Password is required')
  })
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    preferences: z.object({
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional()
    })
  })
});


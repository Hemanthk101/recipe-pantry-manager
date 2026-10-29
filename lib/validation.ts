import { z } from 'zod';
export const registerSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.email().max(254), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });
export const recipeSchema = z.object({ title: z.string().trim().min(2).max(180), description: z.string().max(5000).default(''), cuisine: z.string().trim().min(2).max(80), prepTime: z.coerce.number().int().min(1).max(1440), difficulty: z.enum(['easy','medium','hard']).default('medium'), ingredients: z.array(z.object({ ingredientId: z.coerce.number().int().positive(), quantity: z.coerce.number().positive().max(999999) })).min(1).max(50) });
export const pantrySchema = z.object({ ingredientId: z.coerce.number().int().positive(), quantity: z.coerce.number().min(0).max(999999), expiryDate: z.string().nullable().optional() });
export const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().max(2000).default('') });

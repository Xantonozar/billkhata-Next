import { z } from 'zod';
import mongoose from 'mongoose';
import { MIN_PASSWORD_LENGTH } from '@/lib/passwordConfig';

// ============================================
// COMMON VALIDATORS
// ============================================

export const ObjectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: 'Invalid ObjectId format' }
);

export const EmailSchema = z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim();

export const PasswordSchema = z.string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(100, 'Password too long');

export const KhataIdSchema = z.string()
    .min(3, 'Khata ID must be at least 3 characters')
    .max(50, 'Khata ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Khata ID can only contain letters, numbers, underscores, and hyphens');

// ============================================
// AUTH SCHEMAS
// ============================================

export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, 'Password is required')
});

export const SignupSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name too long')
        .trim(),
    email: EmailSchema,
    password: PasswordSchema,
    role: z.enum(['Manager', 'Member'])
});

export const ProfileUpdateSchema = z.object({
    name: z.string().min(2).max(50).trim().optional(),
    avatarUrl: z.string().url().optional().nullable(),
    whatsapp: z.string().max(20).optional().nullable(),
    facebook: z.string().url().max(200).optional().nullable()
});

// ============================================
// ROOM SCHEMAS
// ============================================

export const CreateRoomSchema = z.object({
    name: z.string()
        .min(2, 'Room name must be at least 2 characters')
        .max(100, 'Room name too long')
        .trim(),
    khataId: KhataIdSchema
});

export const JoinRoomSchema = z.object({
    khataId: KhataIdSchema
});

// ============================================
// BILL SCHEMAS
// ============================================

export const BillShareSchema = z.object({
    userId: ObjectIdSchema,
    userName: z.string().min(1),
    amount: z.number().positive('Amount must be positive'),
    status: z.enum(['Unpaid', 'Pending Approval', 'Paid']).optional()
});

export const CreateBillSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    category: z.string().min(1, 'Category is required'),
    totalAmount: z.number().positive('Total amount must be positive'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format'
    }),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional().nullable(),
    shares: z.array(BillShareSchema).min(1, 'At least one share is required')
});

// ============================================
// DEPOSIT SCHEMAS
// ============================================

export const CreateDepositSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    transactionId: z.string().max(100).optional(),
    screenshotUrl: z.string().optional().nullable().refine(
        (val) => !val || val === '' || z.string().url().safeParse(val).success,
        { message: 'Invalid URL format' }
    )
});

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const CreateExpenseSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1).max(500),
    category: z.string().optional(),
    receiptUrl: z.string().url().optional().nullable()
});

// ============================================
// MEAL SCHEMAS
// ============================================

export const MealEntrySchema = z.object({
    breakfast: z.number().min(0).max(10).default(0),
    lunch: z.number().min(0).max(10).default(0),
    dinner: z.number().min(0).max(10).default(0)
});

export const CreateMealSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format'
    }),
    meals: MealEntrySchema
});

// ============================================
// PAGINATION SCHEMA
// ============================================

export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates request body against a schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(body);
    if (!result.success) {
        const issues = result.error.issues;
        const firstIssue = issues[0];
        return {
            success: false,
            error: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation failed'
        };
    }
    return { success: true, data: result.data };
}

/**
 * Validates query parameters against a schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { success: true; data: T } | { success: false; error: string } {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return validateBody(schema, params);
}

/**
 * Validates that a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
}

// Type exports
export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type CreateBillInput = z.infer<typeof CreateBillSchema>;
export type CreateDepositInput = z.infer<typeof CreateDepositSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type CreateMealInput = z.infer<typeof CreateMealSchema>;

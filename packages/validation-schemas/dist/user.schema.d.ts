import { z } from 'zod';
export declare const investorProfileEnum: z.ZodEnum<["conservative", "moderate", "aggressive"]>;
export type InvestorProfile = z.infer<typeof investorProfileEnum>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
    investorProfile: z.ZodEnum<["conservative", "moderate", "aggressive"]>;
    fayolId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    phone: string;
    password: string;
    investorProfile: "conservative" | "moderate" | "aggressive";
    fayolId?: string | undefined;
}, {
    name: string;
    email: string;
    phone: string;
    password: string;
    investorProfile: "conservative" | "moderate" | "aggressive";
    fayolId?: string | undefined;
}>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export declare const updateUserSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    investorProfile: z.ZodOptional<z.ZodEnum<["conservative", "moderate", "aggressive"]>>;
    fayolId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "password">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    investorProfile?: "conservative" | "moderate" | "aggressive" | undefined;
    fayolId?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    investorProfile?: "conservative" | "moderate" | "aggressive" | undefined;
    fayolId?: string | undefined;
}>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof loginSchema>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=user.schema.d.ts.map
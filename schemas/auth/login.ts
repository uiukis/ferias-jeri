import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email é obrigatório" })
    .trim()
    .email("Email inválido")
    .max(254, "Email muito longo"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .max(128, "Senha muito longa"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;


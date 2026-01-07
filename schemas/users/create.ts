import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Campo obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  role: z.enum(["seller", "admin"]),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;


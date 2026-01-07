import { phoneRegex, timeRegex } from "@/lib/forms/masks";
import { z } from "zod";

export const createVoucherSchema = z.object({
  client_phone: z.string().regex(phoneRegex, "Telefone no formato (xx) xxxxx-xxxx"),
  tour_id: z.string().min(1, "Selecione o passeio"),
  passageiros: z.array(z.string().min(2)).min(1, "Adicione ao menos um passageiro"),
  apto: z.string().optional(),
  partial_amount: z.string().min(1, "Obrigatório"),
  embark_amount: z.string().min(1, "Obrigatório"),
  adults: z.number().min(1, "Ao menos 1 adulto"),
  children: z.number().min(0, "Inválido"),
  embark_location: z.string().min(1, "Obrigatório"),
  embark_time: z.string().regex(timeRegex, "Horário no formato HH:MM"),
  embark_date: z.date({ required_error: "Selecione a data de embarque" }),
  notes: z.string().optional(),
});

export type CreateVoucherFormValues = z.infer<typeof createVoucherSchema>;

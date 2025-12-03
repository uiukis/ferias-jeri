import { z } from "zod";
import { phoneRegex, timeRegex } from "@/lib/forms/masks";

export const createVoucherSchema = z.object({
  client_name: z.string().min(2, "Informe o nome do cliente"),
  client_phone: z.string().regex(phoneRegex, "Telefone no formato (xx) xxxxx-xxxx"),
  tour_name: z.string().min(2, "Informe o pacote/passeio"),
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

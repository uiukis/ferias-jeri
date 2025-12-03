import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  try {
    const parts = path.split(".");
    let cur: unknown = obj;
    for (const p of parts) {
      if (cur == null) return "";
      const idx = Number.isInteger(Number(p)) ? Number(p) : null;
      if (idx !== null && !Number.isNaN(idx)) {
        if (Array.isArray(cur)) {
          cur = (cur as unknown[])[idx];
        } else {
          return "";
        }
      } else if (typeof cur === "object" && cur !== null) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return "";
      }
    }
    return cur ?? "";
  } catch {
    return "";
  }
}

function mergeTemplate(html: string, data: Record<string, unknown>) {
  return html.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_, key) => {
    const v = getByPath(data, key);
    return v == null ? "" : String(v);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const templateName = String(body.templateName || "");
    const rawData = (body.data || {}) as Record<string, unknown>;
    if (!templateName) {
      return new Response("templateName inválido", { status: 400 });
    }

    const serverSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      }
    );

    const { data: tpl, error: tplErr } = await serverSupabase
      .from("templates")
      .select("template")
      .eq("tag", templateName)
      .eq("active", true)
      .maybeSingle();
    if (tplErr) return new Response(String(tplErr.message || tplErr), { status: 500 });
    if (!tpl?.template) return new Response("Template não encontrado", { status: 404 });

    const origin = req.nextUrl.origin;
    const data: Record<string, unknown> = { ...rawData };
    const item = ((data.item as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    if (!item.logo_url) {
      item.logo_url = `${origin}/logo.svg`;
    }
    // Aliases for Portuguese templates from English payload
    const toPt = (v: unknown) => (v == null ? "" : String(v));
    const dateBr = (iso: unknown) => {
      try {
        const s = String(iso || "");
        if (!s) return "";
        const d = new Date(s);
        return d.toLocaleDateString("pt-BR");
      } catch {
        return "";
      }
    };
    const numberBr = (n: unknown) => {
      const num = Number(n || 0);
      return Number.isFinite(num) ? num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
    };
    const aliases: Record<string, unknown> = {
      codigo_voucher: toPt(item.voucher_code),
      cliente_nome: toPt(item.client_name),
      cliente_telefone: toPt(item.client_phone),
      passeio_nome: toPt(item.tour_name),
      data_inicio: dateBr(item.embark_date),
      data_fim: toPt((item as Record<string, unknown>).end_date ?? ""),
      local_embarque: toPt(item.embark_location),
      horario_embarque: toPt(item.embark_time),
      adultos: toPt(item.adults),
      criancas: toPt(item.children),
      observacao: toPt(item.notes),
      status: toPt(item.status),
      valor_parcial: numberBr(item.partial_amount),
      valor_no_embarque: numberBr(item.embark_amount),
      // English formatted helpers
      embark_date_br: dateBr(item.embark_date),
      end_date_br: dateBr((item as Record<string, unknown>).end_date ?? ""),
      partial_amount_br: numberBr(item.partial_amount),
      embark_amount_br: numberBr(item.embark_amount),
    };
    data.item = { ...item, ...aliases };

    const merged = mergeTemplate(tpl.template, data);
    const html = `<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\" />
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
      <style>
        html, body { height: 100%; }
        body { font-family: Arial, sans-serif; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .title { font-size: 18px; font-weight: 700; }
        .muted { color: #64748b; font-size: 12px; }
        .section { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        /* Fix footer message at the bottom */
        .section.text-center.muted { position: fixed; bottom: 16px; left: 0; right: 0; }
      </style>
    </head><body>${merged}</body></html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    const blob = new Blob([Buffer.from(pdf)], { type: "application/pdf" });
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=export.pdf",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 500 });
  }
}

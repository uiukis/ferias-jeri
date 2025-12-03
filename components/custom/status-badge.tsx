import React from "react";

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: {
      label: "Ativo",
      className:
        "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700",
    },
    completed: {
      label: "Completado",
      className:
        "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700",
    },
    cancelled: {
      label: "Cancelado",
      className:
        "inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700",
    },
    expired: {
      label: "Expirado",
      className:
        "inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700",
    },
    excluded: {
      label: "Excluído",
      className:
        "inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700",
    },
  };
  const s = String(value ?? "-");
  const m = map[s] ?? {
    label: s,
    className:
      "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground",
  };
  return <span className={m.className}>{m.label}</span>;
}

export default StatusBadge;

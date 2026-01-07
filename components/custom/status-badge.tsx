export function StatusBadge({ value }: { value: string }) {
  const map: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    emitido: {
      label: "Emitido",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    pago: {
      label: "Pago",
      bg: "bg-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    cancelado: {
      label: "Cancelado",
      bg: "bg-rose-100",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
    expirado: {
      label: "Expirado",
      bg: "bg-slate-200",
      text: "text-slate-700",
      dot: "bg-slate-500",
    },
    excluded: {
      label: "Excluído",
      bg: "bg-gray-200",
      text: "text-gray-700",
      dot: "bg-gray-500",
    },
  };
  const s = String(value ?? "-");
  const m = map[s] ?? {
    label: s,
    bg: "bg-muted",
    text: "text-foreground",
    dot: "bg-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${m.bg} ${m.text}`}
    >
      <span className={`inline-block size-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export default StatusBadge;

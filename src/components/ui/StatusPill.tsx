import { statusColor, statusLabel, type EquipmentStatus } from "@/lib/network";

export function StatusPill({ status }: { status: EquipmentStatus }) {
  const color = statusColor[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium"
    >
      <span className="status-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {statusLabel[status]}
    </span>
  );
}

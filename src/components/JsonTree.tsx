import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function isExpandable(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object";
}

function JsonNode({
  name,
  value,
  depth,
}: {
  name?: string;
  value: unknown;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (isExpandable(value)) {
    const isArray = Array.isArray(value);
    const entries: [string, unknown][] = isArray
      ? value.map((v, i) => [String(i), v])
      : Object.entries(value);
    const count = entries.length;
    const countLabel = isArray ? `${count} items` : `${count} keys`;

    return (
      <div style={{ marginLeft: depth === 0 ? 0 : 14 }}>
        <button
          type="button"
          onClick={() => count > 0 && setOpen((o) => !o)}
          className="flex items-center gap-1 rounded px-0.5 py-0.5 text-left hover:bg-white/5"
          disabled={count === 0}
        >
          {count > 0 ? (
            open ? (
              <ChevronDown className="size-3.5 shrink-0 text-white/50" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-white/50" />
            )
          ) : (
            <span className="inline-block size-3.5 shrink-0" />
          )}
          {name !== undefined && <span className="text-sky-300">{name}</span>}
          {name !== undefined && <span className="text-white/40">:</span>}
          <span className="text-white/50">{isArray ? "[]" : "{}"}</span>
          <span className="text-white/30">{countLabel}</span>
        </button>
        {open && count > 0 && (
          <div>
            {entries.map(([k, v]) => (
              <JsonNode key={k} name={k} value={v} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 14 }} className="flex flex-wrap items-baseline gap-1 px-0.5 py-0.5">
      <span className="inline-block size-3.5 shrink-0" />
      {name !== undefined && <span className="text-sky-300">{name}</span>}
      {name !== undefined && <span className="text-white/40">:</span>}
      <JsonPrimitive value={value} />
    </div>
  );
}

function JsonPrimitive({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-white/40">null</span>;
  if (typeof value === "string") return <span className="text-emerald-400">"{value}"</span>;
  if (typeof value === "boolean" || typeof value === "number")
    return <span className="text-amber-300">{String(value)}</span>;
  return <span className="text-white/70">{String(value)}</span>;
}

export function JsonTree({ data }: { data: unknown }) {
  return (
    <div className="overflow-auto rounded-md bg-[#1e1e1e] p-3 font-mono text-xs leading-relaxed">
      <JsonNode value={data} depth={0} />
    </div>
  );
}

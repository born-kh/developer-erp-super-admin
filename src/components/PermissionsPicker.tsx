import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/LanguageContext";
import type { PermissionGroupWithPermissions } from "@/lib/api";

export function PermissionsPicker({
  groups,
  selectedIds,
  onTogglePermission,
  onToggleGroup,
  loading,
}: {
  groups: PermissionGroupWithPermissions[];
  selectedIds: string[];
  onTogglePermission: (id: string) => void;
  onToggleGroup: (ids: string[], checked: boolean) => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [closedModules, setClosedModules] = useState<Set<string>>(new Set());
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();

  const modules = useMemo(() => {
    const map = new Map<string, PermissionGroupWithPermissions[]>();
    for (const g of groups) {
      const key = g.moduleDisplayName?.trim() || t.permissionsPicker.otherModule;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return Array.from(map.entries()).map(([key, groupsInModule]) => ({ key, groups: groupsInModule }));
  }, [groups, t]);

  const groupMatches = (group: PermissionGroupWithPermissions) => {
    if (!q) return true;
    if ((group.title ?? "").toLowerCase().includes(q)) return true;
    return (group.permissions ?? []).some((p) => (p.title ?? "").toLowerCase().includes(q));
  };

  const visibleModules = modules
    .map((m) => ({ ...m, groups: m.groups.filter(groupMatches) }))
    .filter((m) => m.groups.length > 0);

  const toggleModule = (key: string) =>
    setClosedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroupOpen = (code: string) =>
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.permissionsPicker.noPermissions}</p>;
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={t.permissionsPicker.filterPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {visibleModules.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.permissionsPicker.noResults}</p>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {visibleModules.map((m) => {
            const moduleOpen = Boolean(q) || !closedModules.has(m.key);
            return (
              <Collapsible key={m.key} open={moduleOpen} onOpenChange={() => toggleModule(m.key)}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 border-b bg-muted/50 px-3 py-2 text-left text-sm font-medium last:border-b-0">
                  {moduleOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                  {m.key}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {m.groups.map((g) => {
                    const code = g.code ?? g.title ?? "";
                    const groupOpen = Boolean(q) || !closedGroups.has(code);
                    const perms = g.permissions ?? [];
                    const permIds = perms.map((p) => p.id);
                    const selectedCount = permIds.filter((id) => selectedIds.includes(id)).length;
                    const allSelected = permIds.length > 0 && selectedCount === permIds.length;
                    const someSelected = selectedCount > 0 && !allSelected;
                    return (
                      <Collapsible key={code} open={groupOpen} onOpenChange={() => toggleGroupOpen(code)}>
                        <CollapsibleTrigger className="flex w-full items-center gap-2 border-b bg-muted/20 px-3 py-2 text-left text-sm">
                          {groupOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                          {g.title}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-b bg-background px-3 py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{g.title}</span>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              {t.permissionsPicker.selectAll} ({permIds.length})
                              <Checkbox
                                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                onCheckedChange={(checked) => onToggleGroup(permIds, checked === true)}
                              />
                            </label>
                          </div>
                          <div className="grid gap-1.5">
                            {perms.map((perm) => (
                              <label key={perm.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={selectedIds.includes(perm.id)}
                                  onCheckedChange={() => onTogglePermission(perm.id)}
                                />
                                {perm.title}
                              </label>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}

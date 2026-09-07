import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/LanguageContext";
import type { RoleLookup } from "@/lib/api";

export function RoleManagerDialog({
  open,
  onOpenChange,
  roles,
  loadingRoles,
  assignedIds,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleLookup[];
  loadingRoles?: boolean;
  assignedIds: string[];
  onSave: (toAdd: string[], toRemove: string[]) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedIds);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSelectedIds(assignedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleRole = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (submitting) return;
    const toAdd = selectedIds.filter((id) => !assignedIds.includes(id));
    const toRemove = assignedIds.filter((id) => !selectedIds.includes(id));
    if (!toAdd.length && !toRemove.length) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      await onSave(toAdd, toRemove);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.userDetail.manageRolesTitle}</DialogTitle>
        </DialogHeader>
        {loadingRoles ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.userDetail.noRolesAvailable}</p>
        ) : (
          <div className="grid max-h-72 gap-1.5 overflow-y-auto rounded-md border p-3">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedIds.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                {role.title || role.code}
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

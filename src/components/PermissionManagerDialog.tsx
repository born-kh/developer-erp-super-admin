import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PermissionsPicker } from "@/components/PermissionsPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/LanguageContext";
import type { PermissionGroupWithPermissions } from "@/lib/api";

export function PermissionManagerDialog({
  open,
  onOpenChange,
  groups,
  loadingGroups,
  assignedIds,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: PermissionGroupWithPermissions[];
  loadingGroups?: boolean;
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

  const togglePermission = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleGroup = (ids: string[], checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)),
    );
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.packageDetail.managePermissionsTitle}</DialogTitle>
        </DialogHeader>
        <PermissionsPicker
          groups={groups}
          selectedIds={selectedIds}
          loading={loadingGroups}
          onTogglePermission={togglePermission}
          onToggleGroup={toggleGroup}
        />
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

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  listActivityLogs,
  listUsers,
  ApiRequestError,
  type ActivityLogItem,
  type UserListItem,
} from "../lib/api";
import { formatDateTime } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;
const TYPE_NONE = "none";

type Filters = {
  entityId: string;
  activityCode: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorIpAddress: string;
  serviceName: string;
  sessionId: string;
  requestId: string;
  type: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: Filters = {
  entityId: "",
  activityCode: "",
  creatorId: "",
  creatorName: "",
  creatorEmail: "",
  creatorIpAddress: "",
  serviceName: "",
  sessionId: "",
  requestId: "",
  type: "",
  createdFrom: "",
  createdTo: "",
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function ActivityLogs() {
  const { t, language } = useTranslation();
  const nav = useNavigate();

  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [creatorResults, setCreatorResults] = useState<UserListItem[]>([]);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedFilters(filters);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [filters]);

  const fetchLogs = async (pageArg: number, f: Filters) => {
    setLoadingList(true);
    try {
      const res = await listActivityLogs({
        page: pageArg,
        pageSize: PAGE_SIZE,
        entityId: f.entityId.trim() || undefined,
        activityCode: f.activityCode.trim() || undefined,
        creatorId: f.creatorId || undefined,
        creatorEmail: f.creatorEmail.trim() || undefined,
        creatorIpAddress: f.creatorIpAddress.trim() || undefined,
        serviceName: f.serviceName.trim() || undefined,
        sessionId: f.sessionId.trim() || undefined,
        requestId: f.requestId.trim() || undefined,
        type: f.type || undefined,
        createdFrom: f.createdFrom ? new Date(f.createdFrom).toISOString() : undefined,
        createdTo: f.createdTo ? new Date(f.createdTo).toISOString() : undefined,
      });
      setLogs(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.activityLogs.errors.loadLogs));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilters]);

  useEffect(() => {
    const query = filters.creatorName.trim();
    if (!query || filters.creatorId) {
      setCreatorResults([]);
      return;
    }
    const handle = setTimeout(() => {
      listUsers({ search: query, pageSize: 8 })
        .then((res) => {
          setCreatorResults(res.items ?? []);
          setCreatorOpen(true);
        })
        .catch(() => setCreatorResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [filters.creatorName, filters.creatorId]);

  const selectCreator = (u: UserListItem) => {
    setFilters((f) => ({ ...f, creatorId: u.id, creatorName: u.fullName || u.email || "" }));
    setCreatorResults([]);
    setCreatorOpen(false);
  };

  const changeCreatorName = (value: string) => {
    setFilters((f) => ({ ...f, creatorName: value, creatorId: "" }));
  };

  const typeLabel = (type: string | null | undefined) => {
    switch (type) {
      case "Created":
        return t.activityLogs.types.created;
      case "Updated":
        return t.activityLogs.types.updated;
      case "Deleted":
        return t.activityLogs.types.deleted;
      case "Viewed":
        return t.activityLogs.types.viewed;
      default:
        return type || "—";
    }
  };

  return (
    <>
      <PageHead title={t.activityLogs.title} />

      <Card className="mb-4">
        <CardContent className="grid gap-3">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent className="grid gap-3">
          <div className="grid grid-cols-5 gap-3 max-[1200px]:grid-cols-3 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
            <Field label={t.activityLogs.filters.entityId}>
              <Input
                placeholder={t.activityLogs.filters.entityIdPlaceholder}
                value={filters.entityId}
                onChange={(e) => setFilter("entityId", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.activityCode}>
              <Input
                placeholder={t.activityLogs.filters.activityCodePlaceholder}
                value={filters.activityCode}
                onChange={(e) => setFilter("activityCode", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.creator}>
              <div className="relative">
                <Input
                  placeholder={t.activityLogs.filters.creatorPlaceholder}
                  value={filters.creatorName}
                  onChange={(e) => changeCreatorName(e.target.value)}
                  onFocus={() => creatorResults.length > 0 && setCreatorOpen(true)}
                  onBlur={() => setTimeout(() => setCreatorOpen(false), 150)}
                />
                {creatorOpen && creatorResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {creatorResults.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCreator(u)}
                      >
                        {u.fullName || u.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label={t.activityLogs.filters.email}>
              <Input
                placeholder={t.activityLogs.filters.emailPlaceholder}
                value={filters.creatorEmail}
                onChange={(e) => setFilter("creatorEmail", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.ipAddress}>
              <Input
                placeholder={t.activityLogs.filters.ipAddressPlaceholder}
                value={filters.creatorIpAddress}
                onChange={(e) => setFilter("creatorIpAddress", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.serviceName}>
              <Input
                placeholder={t.activityLogs.filters.serviceNamePlaceholder}
                value={filters.serviceName}
                onChange={(e) => setFilter("serviceName", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.sessionId}>
              <Input
                placeholder={t.activityLogs.filters.sessionIdPlaceholder}
                value={filters.sessionId}
                onChange={(e) => setFilter("sessionId", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.requestId}>
              <Input
                placeholder={t.activityLogs.filters.requestIdPlaceholder}
                value={filters.requestId}
                onChange={(e) => setFilter("requestId", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.type}>
              <Select
                value={filters.type || TYPE_NONE}
                onValueChange={(v) => setFilter("type", v === TYPE_NONE ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.activityLogs.filters.typeNotSelected} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TYPE_NONE}>{t.activityLogs.filters.typeNotSelected}</SelectItem>
                  <SelectItem value="Created">{t.activityLogs.types.created}</SelectItem>
                  <SelectItem value="Updated">{t.activityLogs.types.updated}</SelectItem>
                  <SelectItem value="Deleted">{t.activityLogs.types.deleted}</SelectItem>
                  <SelectItem value="Viewed">{t.activityLogs.types.viewed}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Field label={t.activityLogs.filters.periodFrom} className="w-56 max-w-full">
              <Input
                type="datetime-local"
                value={filters.createdFrom}
                onChange={(e) => setFilter("createdFrom", e.target.value)}
              />
            </Field>
            <Field label={t.activityLogs.filters.periodTo} className="w-56 max-w-full">
              <Input
                type="datetime-local"
                value={filters.createdTo}
                onChange={(e) => setFilter("createdTo", e.target.value)}
              />
            </Field>
          </div>
          </CollapsibleContent>
          <div className="flex justify-end">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {filtersOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                {t.activityLogs.filters.toggle}
              </Button>
            </CollapsibleTrigger>
          </div>
          </Collapsible>
        </CardContent>
      </Card>

      {!loadingList && logs.length === 0 ? (
        <EmptyState title={t.activityLogs.noLogsYet} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.activityLogs.tableCreator}</TableHead>
                <TableHead>{t.activityLogs.tableActivity}</TableHead>
                <TableHead>{t.activityLogs.tableType}</TableHead>
                <TableHead>{t.activityLogs.tableService}</TableHead>
                <TableHead>{t.activityLogs.tableCreatedAt}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t.common.loading}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => nav(`/activity-logs/${log.id}`)}
                  >
                    <TableCell className="font-medium">{log.creatorName || "—"}</TableCell>
                    <TableCell>{log.activityTitle || "—"}</TableCell>
                    <TableCell>{typeLabel(log.type)}</TableCell>
                    <TableCell className="text-muted-foreground">{log.serviceName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(log.createdAt, language)}
                    </TableCell>
                    <TableCell className="w-8 text-muted-foreground">
                      <ChevronRight className="size-4" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination
        page={page}
        onPage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        alwaysShow
      />
    </>
  );
}

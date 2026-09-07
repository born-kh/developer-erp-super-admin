import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError, getActivityLog, type ActivityLogDetail as ActivityLogDetailData } from "../lib/api";
import { formatDate, formatTime } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { JsonTree } from "@/components/JsonTree";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b py-4 first:pt-0 last:border-b-0 sm:flex-row sm:gap-6">
      <div className="shrink-0 text-sm text-muted-foreground sm:w-56">{label}</div>
      <div className="min-w-0 flex-1 text-sm">{children}</div>
    </div>
  );
}

function Copyable({ value }: { value: string }) {
  const { t } = useTranslation();
  const copy = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success(t.activityLogs.detail.copied))
      .catch(() => {});
  };
  return (
    <span className="inline-flex items-center gap-1.5 break-all">
      {value}
      <button
        type="button"
        onClick={copy}
        className="text-muted-foreground hover:text-foreground"
        aria-label={t.activityLogs.detail.copied}
      >
        <Copy className="size-3.5" />
      </button>
    </span>
  );
}

export function ActivityLogDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t, language } = useTranslation();

  const [detail, setDetail] = useState<ActivityLogDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getActivityLog(id)
      .then(setDetail)
      .catch((err) => {
        toast.error(errorMessage(err, t.activityLogs.errors.loadDetail));
        setDetail(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const parsedPayload = useMemo(() => {
    if (!detail?.payload) return null;
    try {
      return JSON.parse(detail.payload);
    } catch {
      return detail.payload;
    }
  }, [detail?.payload]);

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
        return type || t.activityLogs.detail.notAvailable;
    }
  };

  const d = t.activityLogs.detail;
  const na = d.notAvailable;

  if (!loading && !detail) {
    return (
      <>
        <PageHead title={t.activityLogs.title} onBack={() => nav("/activity-logs")} />
        <Card>
          <CardContent className="text-sm text-muted-foreground">{d.notFound}</CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHead title={t.activityLogs.title} onBack={() => nav("/activity-logs")} />
      <Card>
        <CardContent>
          {loading || !detail ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.common.loading}</p>
          ) : (
            <div>
              <Row label={d.activityType}>
                <div className="font-medium">{detail.activityTitle || na}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {d.code}: {detail.activityCode ? <Copyable value={detail.activityCode} /> : na}
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.action}: {typeLabel(detail.type)}
                </div>
              </Row>
              <Row label={d.creator}>
                <div className="font-medium">{detail.creatorName || na}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {d.id}: <Copyable value={detail.creatorId} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.email}: {detail.creatorEmail ? <Copyable value={detail.creatorEmail} /> : na}
                </div>
              </Row>
              <Row label={d.ipAddress}>
                {detail.creatorIpAddress ? <Copyable value={detail.creatorIpAddress} /> : na}
              </Row>
              <Row label={d.date}>
                <div className="font-medium">{formatDate(detail.createdAt, language)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {d.createdAtTime(formatTime(detail.createdAt, language))}
                </div>
              </Row>
              <Row label={d.entityType}>{detail.entityType || na}</Row>
              <Row label={d.systemName}>{detail.serviceName || na}</Row>
              <Row label={d.id}>
                <Copyable value={detail.id} />
              </Row>
              <Row label={d.entityId}>{detail.entityId ? <Copyable value={detail.entityId} /> : na}</Row>
              <Row label={d.sessionId}>{detail.sessionId ? <Copyable value={detail.sessionId} /> : na}</Row>
              <Row label={d.requestId}>{detail.requestId ? <Copyable value={detail.requestId} /> : na}</Row>
              {parsedPayload !== null && parsedPayload !== undefined && (
                <Row label={d.data}>
                  <JsonTree data={parsedPayload} />
                </Row>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

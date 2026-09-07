import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { useTranslation } from "@/i18n/LanguageContext";

export function AppPagination({
  page,
  pageCount,
  onPage,
  hasNextPage,
  hasPreviousPage,
  alwaysShow,
}: {
  page: number;
  /** Total number of pages, when known upfront (client-side pagination). */
  pageCount?: number;
  onPage: (page: number) => void;
  /** Server-driven pagination: pass these instead of pageCount when the total is unknown. */
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  /** Keep the control visible even when there is only one page. */
  alwaysShow?: boolean;
}) {
  const { t } = useTranslation();
  const serverMode = pageCount === undefined;

  if (!alwaysShow && !serverMode && pageCount <= 1) return null;

  const canGoBack = serverMode ? Boolean(hasPreviousPage) : page > 1;
  const canGoNext = serverMode ? Boolean(hasNextPage) : page < pageCount;

  return (
    <Pagination className="mt-4.5 justify-start">
      <PaginationContent>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={!canGoBack} onClick={() => onPage(page - 1)}>
            {t.common.back}
          </Button>
        </PaginationItem>
        {serverMode ? (
          <PaginationItem>
            <Button variant="default" size="icon-sm" disabled>
              {page}
            </Button>
          </PaginationItem>
        ) : (
          Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <PaginationItem key={n}>
              <Button
                variant={n === page ? "default" : "outline"}
                size="icon-sm"
                onClick={() => onPage(n)}
              >
                {n}
              </Button>
            </PaginationItem>
          ))
        )}
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => onPage(page + 1)}>
            {t.common.next}
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

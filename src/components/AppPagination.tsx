import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { useTranslation } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function AppPagination({
  page,
  pageCount,
  onPage,
  hasNextPage,
  hasPreviousPage,
  alwaysShow,
  className,
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
  className?: string;
}) {
  const { t } = useTranslation();
  const serverMode = pageCount === undefined;

  if (!alwaysShow && !serverMode && pageCount <= 1) return null;

  const canGoBack = serverMode ? Boolean(hasPreviousPage) : page > 1;
  const canGoNext = serverMode ? Boolean(hasNextPage) : page < pageCount;

  return (
    <Pagination className={cn("mt-4.5 justify-center", className)}>
      <PaginationContent>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={!canGoBack} onClick={() => onPage(page - 1)}>
            <ChevronLeft />
            {t.common.back}
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => onPage(page + 1)}>
            {t.common.next}
            <ChevronRight />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

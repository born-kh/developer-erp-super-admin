import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function AppPagination({
  page,
  pageCount,
  onPage,
  hasNextPage,
  hasPreviousPage,
  alwaysShow,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
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
  /** Current page size. Pass together with onPageSizeChange to show the page-size selector. */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}) {
  const { t } = useTranslation();
  const serverMode = pageCount === undefined;

  if (!alwaysShow && !serverMode && pageCount <= 1) return null;

  const canGoBack = serverMode ? Boolean(hasPreviousPage) : page > 1;
  const canGoNext = serverMode ? Boolean(hasNextPage) : page < pageCount;

  return (
    <div className={cn("relative mt-4.5 flex flex-wrap items-center justify-center gap-2", className)}>
      <Pagination className="w-auto">
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
      {pageSize !== undefined && onPageSizeChange && (
        <div className="flex items-center gap-2 max-[640px]:w-full max-[640px]:justify-center sm:absolute sm:right-0">
          <span className="text-sm text-muted-foreground">{t.common.pageSize}</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger size="sm" className="w-[76px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

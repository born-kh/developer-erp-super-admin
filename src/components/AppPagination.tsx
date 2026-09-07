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
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;

  return (
    <Pagination className="mt-4.5 justify-start">
      <PaginationContent>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
            {t.common.back}
          </Button>
        </PaginationItem>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <PaginationItem key={n}>
            <Button
              variant={n === page ? "default" : "outline"}
              size="icon-sm"
              onClick={() => onPage(n)}
            >
              {n}
            </Button>
          </PaginationItem>
        ))}
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
          >
            {t.common.next}
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

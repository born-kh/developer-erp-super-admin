import { Building2 } from "lucide-react";
import { useFileUrl } from "../hooks/useFileUrl";

export function CompanyPhoto({
  photoName,
  alt,
  resized = true,
}: {
  photoName?: string | null;
  alt: string;
  /** Small/thumbnail copy by default; pass false for a full-size view. */
  resized?: boolean;
}) {
  const url = useFileUrl(photoName, resized);

  if (!url) {
    return (
      <div className="flex size-full items-center justify-center bg-secondary text-muted-foreground">
        <Building2 className="size-8" />
      </div>
    );
  }

  return <img src={url} alt={alt} className="size-full object-cover" />;
}

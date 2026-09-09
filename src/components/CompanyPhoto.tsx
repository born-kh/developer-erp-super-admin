import { Building2 } from "lucide-react";
import { useFileUrl } from "../hooks/useFileUrl";

export function CompanyPhoto({ photoName, alt }: { photoName?: string | null; alt: string }) {
  const url = useFileUrl(photoName);

  if (!url) {
    return (
      <div className="flex size-full items-center justify-center bg-secondary text-muted-foreground">
        <Building2 className="size-8" />
      </div>
    );
  }

  return <img src={url} alt={alt} className="size-full object-cover" />;
}

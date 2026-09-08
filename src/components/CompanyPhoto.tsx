import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { getAccessToken } from "../auth";
import { getFileUrl } from "../lib/api";

export function CompanyPhoto({ photoName, alt }: { photoName?: string | null; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!photoName) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    const token = getAccessToken();
    fetch(getFileUrl(photoName), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoName]);

  if (!url) {
    return (
      <div className="flex size-full items-center justify-center bg-secondary text-muted-foreground">
        <Building2 className="size-8" />
      </div>
    );
  }

  return <img src={url} alt={alt} className="size-full object-cover" />;
}

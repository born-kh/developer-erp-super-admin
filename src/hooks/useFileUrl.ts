import { useEffect, useState } from "react";
import { getAccessToken } from "../auth";
import { getFileUrl, getImageUrl } from "../lib/api";

// Pass `resized` to fetch via the image endpoint: true for a small/thumbnail
// copy, false for the full-size original. Omit it for non-image files (e.g.
// payment receipts), which always come from the plain file endpoint.
export function useFileUrl(fileName?: string | null, resized?: boolean): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!fileName) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    const token = getAccessToken();
    const target = resized === undefined ? getFileUrl(fileName) : getImageUrl(fileName, resized);
    fetch(target, {
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
  }, [fileName, resized]);

  return url;
}

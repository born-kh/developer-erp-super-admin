import { useEffect, useState } from "react";
import { getAccessToken } from "../auth";
import { getFileUrl } from "../lib/api";

export function useFileUrl(fileName?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!fileName) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    const token = getAccessToken();
    fetch(getFileUrl(fileName), {
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
  }, [fileName]);

  return url;
}

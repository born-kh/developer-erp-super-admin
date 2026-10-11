import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function AppLogo({ className, alt }: { className?: string; alt?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";

  return <img src={src} alt={alt ?? "Enterprise Resource Planning"} className={className} />;
}

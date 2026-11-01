"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/client/api";

export function DemoLaunchButton({
  label = "Open the live demo",
  redirectTo = "/dashboard",
  variant = "violet",
  size = "lg",
  className,
  showIcon = true,
}: {
  label?: string;
  redirectTo?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  showIcon?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function launch() {
    setLoading(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/demo/seed", { method: "POST" });
      toast.success("Curated demo workspace ready", {
        description: "Every sample output is labelled as DEMO.",
      });
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error("Could not load the demo", { description: errorMessage(error) });
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={launch}
      loading={loading}
      className={className}
    >
      {showIcon && !loading && <Sparkles className="h-4 w-4" aria-hidden="true" />}
      {loading ? "Preparing the demo…" : label}
    </Button>
  );
}

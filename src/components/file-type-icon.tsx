import {
  AudioLines,
  FileQuestion,
  FileText,
  Image as ImageIcon,
  Type,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  image: ImageIcon,
  pdf: FileText,
  audio: AudioLines,
  text: Type,
};

export function FileTypeIcon({
  type,
  className,
  iconClassName,
}: {
  type: string;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = ICONS[type] ?? FileQuestion;
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-parchment text-ink-500",
        className,
      )}
    >
      <Icon className={cn("h-5 w-5", iconClassName)} aria-hidden="true" />
    </span>
  );
}

export function fileTypeLabel(type: string): string {
  switch (type) {
    case "image":
      return "Handwritten / image";
    case "pdf":
      return "PDF document";
    case "audio":
      return "Audio recording";
    case "text":
      return "Typed material";
    default:
      return "Study material";
  }
}

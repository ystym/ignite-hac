export function languageLabel(value: string | null | undefined): string {
  if (value === "hinglish") return "Hinglish";
  return "Simple English";
}

export function difficultyLabel(value: string): string {
  switch (value) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "mixed":
      return "Mixed";
    default:
      return value;
  }
}

export function taskTypeLabel(value: string): string {
  switch (value) {
    case "study":
      return "Study";
    case "revision":
      return "Revision";
    case "practice":
      return "Practice";
    case "buffer":
      return "Buffer";
    default:
      return value;
  }
}

export function indexStatusLabel(value: string): string {
  switch (value) {
    case "READY":
      return "Ready";
    case "STALE":
      return "Stale";
    case "FAILED":
      return "Failed";
    case "INDEXING":
      return "Indexing";
    case "PENDING":
      return "Pending";
    default:
      return value;
  }
}

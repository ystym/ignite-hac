import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const jakarta = localFont({
  src: "./fonts/jakarta-var.woff2",
  variable: "--font-jakarta",
  display: "swap",
  weight: "200 800",
  fallback: ["var(--font-inter)", "sans-serif"],
});

const newsreader = localFont({
  src: "./fonts/newsreader-var.woff2",
  variable: "--font-newsreader",
  display: "swap",
  weight: "200 800",
  fallback: ["Georgia", "serif"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "STUDYMATE AI — messy notes in, exam-ready knowledge out",
    template: "%s · STUDYMATE AI",
  },
  description:
    "A multimodal study assistant that turns handwritten notes, PDFs, lectures and messy real-world material into structured notes, grounded quizzes, a day-by-day study plan and cited answers.",
  keywords: [
    "AI study assistant",
    "Gemini",
    "multimodal",
    "RAG",
    "handwriting OCR",
    "study planner",
    "quiz generator",
  ],
  authors: [{ name: "STUDYMATE AI" }],
  openGraph: {
    title: "STUDYMATE AI",
    description:
      "Vision OCR, audio transcription, grounded notes, quizzes and citation-backed answers from your own study material.",
    type: "website",
    url: appUrl,
    siteName: "STUDYMATE AI",
    images: [{ url: "/samples/handwritten-notes.png", width: 1180, height: 1533, alt: "Handwritten physics notes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "STUDYMATE AI",
    description: "Messy notes in. Exam-ready knowledge out.",
    images: ["/samples/handwritten-notes.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7fb",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster
          theme="light"
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "16px",
              fontFamily: "var(--font-inter)",
              border: "1px solid rgba(15,20,51,0.08)",
              boxShadow: "0 24px 48px -20px rgba(15,20,51,0.25)",
            },
          }}
        />
      </body>
    </html>
  );
}

"use client";
import { Toaster as SonnerToaster } from "sonner";
import { useSpotlogTheme } from "@/components/theme-provider";

export function Toaster() {
  const { theme } = useSpotlogTheme();
  const sonnerTheme: "light" | "dark" =
    theme === "dark" || theme === "neon" ? "dark" : "light";
  return (
    <SonnerToaster
      theme={sonnerTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        },
      }}
    />
  );
}

"use client";

const KEY = "spotlog.onboarding.completed";

export function hasCompletedTour(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) === "true";
  } catch {
    return true;
  }
}

export function markTourCompleted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "true");
  } catch {
    // ignore
  }
}

export function resetTour() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

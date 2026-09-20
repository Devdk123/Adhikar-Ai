/**
 * Application store — persists submitted applications in localStorage.
 * Connects the chat agent (ApplyButton) to the dashboard.
 */

import type { ApplicationStatus } from "./types";

export interface StoredApplication {
  id: string;
  schemeName: string;
  schemeNameHindi?: string;
  referenceNumber: string;
  status: ApplicationStatus;
  benefit: string;
  appliedDate: string;
  citizenData?: Record<string, string>;
  timeline: {
    status: ApplicationStatus;
    date: string;
    time: string;
    description: string;
  }[];
}

const STORAGE_KEY = "adhikaar_applications";

export function getApplications(): StoredApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApplication(app: StoredApplication): void {
  const apps = getApplications();
  // Avoid duplicates by reference number
  const exists = apps.findIndex((a) => a.referenceNumber === app.referenceNumber);
  if (exists >= 0) {
    apps[exists] = app;
  } else {
    apps.unshift(app);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  // Dispatch event so dashboard updates in real-time if open
  window.dispatchEvent(new CustomEvent("adhikaar:application-update"));
}

export function updateApplicationStatus(
  referenceNumber: string,
  status: ApplicationStatus,
  description: string
): void {
  const apps = getApplications();
  const app = apps.find((a) => a.referenceNumber === referenceNumber);
  if (!app) return;

  app.status = status;
  const now = new Date();
  app.timeline.push({
    status,
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    description,
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  window.dispatchEvent(new CustomEvent("adhikaar:application-update"));
}

export function clearApplications(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("adhikaar:application-update"));
}

/**
 * Create an application record from a successful automation result.
 */
export function createApplicationFromResult(
  schemeName: string,
  referenceNumber: string,
  benefit?: string,
  citizenData?: Record<string, string>
): StoredApplication {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return {
    id: `APP-${Date.now()}`,
    schemeName,
    referenceNumber,
    status: "submitted",
    benefit: benefit || "—",
    appliedDate: dateStr,
    citizenData,
    timeline: [
      {
        status: "submitted",
        date: dateStr,
        time: timeStr,
        description: "Application submitted via Adhikaar AI",
      },
    ],
  };
}

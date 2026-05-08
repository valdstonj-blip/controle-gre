import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a local date/time string for display.
 */
export function formatSyncDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '---';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Converts a Brazilian date string (DD/MM/YYYY) to an ISO date string (YYYY-MM-DD).
 * If the input is already in ISO format or invalid, it tries to return a valid ISO string.
 */
export function parseBrazilianDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Try to extract just the date part if there's a time (e.g. "08/05/2026 08:00")
  const justDate = dateStr.split(' ')[0].trim();
  
  // Check for DD/MM/YYYY or DD/MM/YY (also handles - or . as separators)
  const brDateMatch = justDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (brDateMatch) {
    let [_, day, month, year] = brDateMatch;
    // Normalize year
    if (year.length === 2) {
      year = `20${year}`;
    }
    // Pad day and month
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback to regular Date parsing if possible
  try {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(justDate)) {
      return justDate;
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Return YYYY-MM-DD in LOCAL time to avoid timezone shifts
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch {
    // Just return as is
  }
  
  return justDate;
}

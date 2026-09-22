/**
 * Returns YYYY-MM-DD string in local system timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns ISO string representation for comparison.
 */
export function formatISODateString(dateString: string): string | null {
  if (!dateString) return null;
  const match = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? dateString : null;
}

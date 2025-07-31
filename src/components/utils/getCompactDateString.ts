/**
 * Generates a compact date string in YYYYMMDD format for the current date
 * @returns A string representation of today's date (e.g., "20250801")
 */
export default function getCompactDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // Months from 0 to 11
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}${month}${day}` // For example: 20250727
}
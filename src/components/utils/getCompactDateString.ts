export default function getCompactDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // חודשים מ-0 עד 11
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}${month}${day}` // למשל: 20250727
}
/**
 * 将 ISO 日期字符串转为相对时间描述
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return '昨天'
  if (diffDay < 30) return `${diffDay}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 判断日期是否为今天
 */
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

/**
 * 判断日期是否在最近 N 天内
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return diffMs < days * 24 * 60 * 60 * 1000
}

/**
 * 年龄分组匹配
 */
export function matchAge(age: number, group: string): boolean {
  switch (group) {
    case '3-4':
      return age >= 3 && age <= 4
    case '5-6':
      return age >= 5 && age <= 6
    case '7-8':
      return age >= 7 && age <= 8
    case '9+':
      return age >= 9
    default:
      return true
  }
}

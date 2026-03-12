const requests = new Map()

export function rateLimit(ip: string) {

  const now = Date.now()
  const window = 60 * 1000

  const user = requests.get(ip)

  if (!user) {
    requests.set(ip, { count: 1, time: now })
    return true
  }

  if (now - user.time > window) {
    requests.set(ip, { count: 1, time: now })
    return true
  }

  if (user.count > 20) {
    return false
  }

  user.count++
  return true
}
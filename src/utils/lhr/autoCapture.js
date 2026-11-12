// A fresh run of passing camera samples triggers once per selected view/shot.
// This gate checks readiness supplied by the camera; it does not recognise anatomy.
export const AUTO_CAPTURE_HOLD_MS = 2000
export function createAutoCaptureGate({ holdMs = AUTO_CAPTURE_HOLD_MS, maxGapMs = 800 } = {}) {
  let context = null
  let startedAt = null
  let lastSample = null
  let fired = false
  function state(trigger = false, remainingMs = holdMs) {
    return {
      phase: fired ? 'captured' : startedAt === null ? 'waiting' : 'holding',
      remainingMs: fired ? 0 : remainingMs,
      trigger,
    }
  }
  function cancel() {
    startedAt = lastSample = null
    return state()
  }
  function reset(key) {
    context = key
    fired = false
    return cancel()
  }
  function reserve(key) {
    if (context !== key) reset(key)
    fired = true
    return cancel()
  }
  function observe({ key, ready, now }) {
    if (context !== key) reset(key)
    if (fired) return state()
    if (!ready || !Number.isFinite(now)) return cancel()
    if (lastSample !== null && (now < lastSample || now - lastSample > maxGapMs)) cancel()
    if (startedAt === null) startedAt = now
    lastSample = now
    const remainingMs = Math.max(0, holdMs - (now - startedAt))
    if (remainingMs === 0) {
      fired = true
      return state(true, 0)
    }
    return state(false, remainingMs)
  }
  return { observe, cancel, reset, reserve }
}

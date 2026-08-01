/** Stub analytics — DEMO-ONLY. Swap for a real tracker later. */
export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.log(`[track] ${name}`, payload ?? {})
  }
}

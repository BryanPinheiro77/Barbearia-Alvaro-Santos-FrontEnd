// Retain the key after network errors/reloads; retries represent the same booking.
function storageKey(kind: string) {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const payload = auth.token?.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    const subject = payload ? JSON.parse(atob(payload)).sub : "anonymous";
    return "booking-request:" + kind + ":" + auth.tipo + ":" + subject;
  } catch { return "booking-request:" + kind; }
}
export function bookingKey(kind: string, payload: unknown): string {
  const storage = storageKey(kind);
  const fingerprint = JSON.stringify(payload);
  try {
    const previous = JSON.parse(sessionStorage.getItem(storage) || "null");
    if (previous?.fingerprint === fingerprint && typeof previous.key === "string") return previous.key;
  } catch { /* replace corrupt state */ }
  const key = crypto.randomUUID();
  sessionStorage.setItem(storage, JSON.stringify({ fingerprint, key }));
  return key;
}
export function finishBooking(kind: string) { sessionStorage.removeItem(storageKey(kind)); }

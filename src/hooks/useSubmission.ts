import { useRef, useState } from "react";

// Ref closes the window before React renders the disabled button.
export function useSubmission() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  function begin() {
    if (locked.current) return false;
    locked.current = true;
    setPending(true);
    return true;
  }
  function end() { locked.current = false; setPending(false); }
  return { pending, begin, end };
}

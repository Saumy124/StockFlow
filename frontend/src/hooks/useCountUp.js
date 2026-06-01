import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number from 0 to `end` using requestAnimationFrame
 * with an ease-out curve. Re-runs whenever `end` changes.
 */
export function useCountUp(end, duration = 900) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = Number(end) || 0;
    fromRef.current = 0;
    startRef.current = null;
    let raf;

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return value;
}

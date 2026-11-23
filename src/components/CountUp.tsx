"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

// Counts from `from` to `to` the first time the number scrolls into view.
// People who ask for reduced motion see the final number straight away.
export default function CountUp({ to, from = 0, prefix = "", suffix = "", duration = 1400 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setValue(from);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(from + (to - from) * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, from, duration]);

  return (
    <span ref={ref} className="tabular" aria-label={`${prefix}${to}${suffix}`}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

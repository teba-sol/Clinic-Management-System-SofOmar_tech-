import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const formatNumber = (n: number) => n.toLocaleString('en-US');

export function CountUp({
  value,
  className,
  duration = 1800,
  delay = 0,
  format = formatNumber,
}: {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const start = performance.now() + delay;
        const tick = (now: number) => {
          const t = Math.min(Math.max((now - start) / duration, 0), 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * value));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {format(display)}
    </span>
  );
}

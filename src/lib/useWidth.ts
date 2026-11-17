import { useLayoutEffect, useRef, useState } from 'react';

/** Measures an element's width (ResizeObserver) for responsive SVG charts. */
export function useWidth<T extends HTMLElement>(initial = 320) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || initial);
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return [ref, width] as const;
}

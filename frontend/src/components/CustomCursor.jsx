import { useEffect, useRef } from 'react';

/**
 * Custom dual-element cursor (dot + trailing ring).
 * The ring lerps toward the pointer for a smooth trailing feel.
 * Body classes are toggled so CSS can restyle the cursor based on
 * what's hovered (links/buttons, text inputs, pressed state).
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    // Skip on touch / coarse-pointer devices
    const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFine) return;

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }

      const el = e.target;
      const interactive = el.closest(
        'button, a, [role="button"], .nav-item, .card-link, .order-row, .clickable, .stat-card, select, .item-remove, .modal-close, .theme-toggle, tr'
      );
      const textual = el.closest('input, textarea');

      document.body.classList.toggle('cursor-hover-link', !!interactive && !textual);
      document.body.classList.toggle('cursor-hover-text', !!textual);
    };

    const onDown = () => document.body.classList.add('cursor-pressed');
    const onUp = () => document.body.classList.remove('cursor-pressed');

    const animate = () => {
      // Smooth trailing lerp for the ring
      ring.current.x += (mouse.current.x - ring.current.x) * 0.18;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}

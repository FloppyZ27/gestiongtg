import { useState, useEffect, useRef, useCallback } from "react";

// Hook custom pour le drag & drop natif avec auto-scroll
export function useKanbanDrag({ onDrop }) {
  const [dragging, setDragging] = useState(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [overColumn, setOverColumn] = useState(null);
  const scrollAnimRef = useRef(null);
  const overColumnRef = useRef(null);

  useEffect(() => { overColumnRef.current = overColumn; }, [overColumn]);

  const handleDragStart = useCallback((e, card) => {
    if (e.preventDefault) e.preventDefault();
    const rect = e.currentTarget?.getBoundingClientRect?.() || { left: e.clientX, top: e.clientY };
    setDragging({ card, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    setGhostPos({ x: e.clientX, y: e.clientY });
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const SCROLL_ZONE = 80;
    const MAX_SPEED = 18;

    const getScrollSpeed = (pos, containerRect) => {
      const distFromLeft = pos - containerRect.left;
      const distFromRight = containerRect.right - pos;
      if (distFromLeft < SCROLL_ZONE) return -Math.round((1 - distFromLeft / SCROLL_ZONE) * MAX_SPEED);
      if (distFromRight < SCROLL_ZONE) return Math.round((1 - distFromRight / SCROLL_ZONE) * MAX_SPEED);
      return 0;
    };

    let currentX = 0;

    const startScrollLoop = (scrollEl, x) => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      const rect = scrollEl.getBoundingClientRect();
      const speed = getScrollSpeed(x, rect);
      if (speed === 0) { scrollAnimRef.current = null; return; }
      scrollEl.scrollLeft += speed;
      scrollAnimRef.current = requestAnimationFrame(() => startScrollLoop(scrollEl, currentX));
    };

    const onMove = (e) => {
      currentX = e.clientX;
      setGhostPos({ x: e.clientX, y: e.clientY });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const colEl = el?.closest('[data-kanban-column]');
      setOverColumn(colEl ? colEl.getAttribute('data-kanban-column') : null);
      const scrollEl = el?.closest('[data-kanban-scroll]');
      if (scrollEl) {
        startScrollLoop(scrollEl, e.clientX);
      } else {
        if (scrollAnimRef.current) { cancelAnimationFrame(scrollAnimRef.current); scrollAnimRef.current = null; }
      }
    };

    const onUp = () => {
      if (scrollAnimRef.current) { cancelAnimationFrame(scrollAnimRef.current); scrollAnimRef.current = null; }
      if (overColumnRef.current && dragging.card) {
        onDrop(dragging.card, overColumnRef.current);
      }
      setDragging(null);
      setOverColumn(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [dragging, onDrop]);

  return { dragging, ghostPos, overColumn, handleDragStart };
}
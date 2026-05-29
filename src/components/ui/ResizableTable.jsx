import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * ResizableTable — remplace la div wrapper d'une <Table> pour avoir des colonnes redimensionnables.
 *
 * Usage:
 *   <ResizableTable tableId="dossiers">
 *     <Table>
 *       <TableHeader>...</TableHeader>
 *       <TableBody>...</TableBody>
 *     </Table>
 *   </ResizableTable>
 *
 * tableId : clé unique pour persister les largeurs en localStorage
 */
export default function ResizableTable({ tableId, children, className, style }) {
  const containerRef = useRef(null);
  const dragging = useRef(null); // { th, startX, startWidth }

  const getSavedWidths = useCallback(() => null, []);

  const saveWidths = useCallback(() => {}, []);

  const applyWidths = useCallback((ths, widths) => {
    ths.forEach((th, i) => {
      if (widths[i] !== undefined) {
        th.style.width = `${widths[i]}px`;
        th.style.minWidth = `${widths[i]}px`;
      }
    });
  }, []);

  const addHandles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const table = container.querySelector('table');
    if (!table) return;

    const ths = Array.from(table.querySelectorAll('thead tr:first-child th'));
    if (ths.length === 0) return;

    // Restore saved widths
    const saved = getSavedWidths();
    if (saved && saved.length === ths.length) {
      table.style.tableLayout = 'fixed';
      applyWidths(ths, saved);
    }

    // Remove existing handles
    container.querySelectorAll('.col-resize-handle').forEach(h => h.remove());

    ths.forEach((th, idx) => {
      // Skip last column
      if (idx === ths.length - 1) return;

      th.style.position = 'relative';
      th.style.userSelect = 'none';

      const handle = document.createElement('div');
      handle.className = 'col-resize-handle';
      handle.style.cssText = `
        position: absolute; right: 0; top: 0; bottom: 0; width: 6px;
        cursor: col-resize; z-index: 10; display: flex; align-items: center; justify-content: center;
      `;

      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 2px; height: 60%; background: rgba(150,150,150,0.3);
        border-radius: 2px; transition: background 0.15s; pointer-events: none;
      `;
      handle.appendChild(bar);

      handle.addEventListener('mouseenter', () => { bar.style.background = 'rgba(220,80,80,0.8)'; });
      handle.addEventListener('mouseleave', () => {
        if (!dragging.current) bar.style.background = 'rgba(150,150,150,0.3)';
      });

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging.current = { th, bar, startX: e.clientX, startWidth: th.offsetWidth };
        bar.style.background = 'rgba(220,80,80,1)';
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        table.style.tableLayout = 'fixed';

        const onMove = (e) => {
          if (!dragging.current) return;
          const { th, startX, startWidth } = dragging.current;
          const newWidth = Math.max(40, startWidth + (e.clientX - startX));
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;
        };

        const onUp = () => {
          if (dragging.current) {
            dragging.current.bar.style.background = 'rgba(150,150,150,0.3)';
            dragging.current = null;
          }
          document.body.style.cursor = '';
          document.body.style.userSelect = '';

          // Save widths
          const allThs = Array.from(table.querySelectorAll('thead tr:first-child th'));
          saveWidths(allThs.map(t => t.offsetWidth));

          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });

      th.appendChild(handle);
    });
  }, [getSavedWidths, applyWidths, saveWidths]);

  // Apply handles after render and when children change
  useEffect(() => {
    // Small delay to let shadcn components render
    const timer = setTimeout(addHandles, 50);
    return () => clearTimeout(timer);
  }, [children, addHandles]);

  return (
    <div ref={containerRef} className={className} style={{ overflowX: 'auto', ...style }}>
      {children}
    </div>
  );
}
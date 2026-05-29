import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * ResizableTable — remplace <Table> pour avoir des colonnes redimensionnables.
 *
 * Usage:
 *   <ResizableTable tableId="dossiers" defaultWidths={[80, 150, 200, 120]}>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </ResizableTable>
 *
 * tableId     : clé unique pour persister les largeurs en localStorage
 * defaultWidths: largeurs initiales en px (une par colonne)
 * minWidth    : largeur minimale par colonne (défaut: 40px)
 */
export default function ResizableTable({ tableId, defaultWidths = [], minWidth = 40, children, className, ...props }) {
  const [widths, setWidths] = useState(() => {
    if (tableId) {
      const saved = localStorage.getItem(`resizable-table-${tableId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return defaultWidths;
  });

  const tableRef = useRef(null);
  const dragging = useRef(null); // { colIndex, startX, startWidth }

  // Persist widths
  useEffect(() => {
    if (tableId && widths.length > 0) {
      localStorage.setItem(`resizable-table-${tableId}`, JSON.stringify(widths));
    }
  }, [widths, tableId]);

  // Auto-detect number of columns if defaultWidths not provided
  useEffect(() => {
    if (widths.length === 0 && tableRef.current) {
      const ths = tableRef.current.querySelectorAll("thead tr:first-child th");
      if (ths.length > 0) {
        setWidths(Array.from(ths).map(th => th.offsetWidth || 150));
      }
    }
  }, [children]);

  const onMouseDown = useCallback((e, colIndex) => {
    e.preventDefault();
    dragging.current = {
      colIndex,
      startX: e.clientX,
      startWidth: widths[colIndex] ?? 150,
    };

    const onMove = (e) => {
      if (!dragging.current) return;
      const { colIndex, startX, startWidth } = dragging.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + delta);
      setWidths(prev => {
        const next = [...prev];
        next[colIndex] = newWidth;
        return next;
      });
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [widths, minWidth]);

  // Clone children to inject resize handles into <th> elements
  const enhanceChildren = (children) => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      const type = child.type;
      const typeName = typeof type === "string" ? type : type?.displayName || type?.name || "";

      // thead or TableHeader
      if (typeName === "thead" || typeName === "TableHeader" || child.props?.className?.includes("TableHeader")) {
        return React.cloneElement(child, {}, enhanceChildren(child.props.children));
      }

      // tr or TableRow inside thead context
      if (typeName === "tr" || typeName === "TableRow") {
        return React.cloneElement(child, {}, enhanceTrChildren(child.props.children));
      }

      return React.cloneElement(child, {}, enhanceChildren(child.props.children));
    });
  };

  const enhanceTrChildren = (children) => {
    let colIndex = 0;
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      const typeName = typeof child.type === "string" ? child.type : child.type?.displayName || child.type?.name || "";
      if (typeName === "th" || typeName === "TableHead") {
        const idx = colIndex++;
        const width = widths[idx];
        return React.cloneElement(child, {
          style: { ...child.props.style, width: width ? `${width}px` : undefined, minWidth: `${minWidth}px`, position: "relative", userSelect: "none" },
        }, [
          child.props.children,
          <span
            key="resize-handle"
            onMouseDown={(e) => onMouseDown(e, idx)}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "6px",
              cursor: "col-resize",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={e => e.stopPropagation()}
          >
            <span style={{
              width: "2px",
              height: "60%",
              background: "rgba(150,150,150,0.3)",
              borderRadius: "2px",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,80,80,0.7)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(150,150,150,0.3)"}
            />
          </span>
        ]);
      }
      return child;
    });
  };

  return (
    <div className={cn("w-full overflow-auto", className)} style={{ cursor: dragging.current ? "col-resize" : undefined }}>
      <table
        ref={tableRef}
        style={{ tableLayout: widths.length > 0 ? "fixed" : "auto", width: "100%", borderCollapse: "collapse" }}
        {...props}
      >
        {widths.length > 0 && (
          <colgroup>
            {widths.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}
          </colgroup>
        )}
        {enhanceChildren(children)}
      </table>
    </div>
  );
}
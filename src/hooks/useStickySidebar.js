import { useEffect } from "react";

/**
 * Rend un élément (sidebarRef) sticky par rapport à un conteneur scrollable.
 * L'élément reste à sa position naturelle (position: fixed, top = initialViewportTop - scrollTop)
 * jusqu'à ce que le haut du viewport à headerHeight px soit atteint, puis il colle là.
 *
 * @param {React.RefObject} sidebarRef - ref sur le panneau fixe (position: fixed)
 * @param {React.RefObject} placeholderRef - ref sur le placeholder dans le flux DOM
 * @param {number} headerHeight - hauteur de la topbar (px)
 * @param {string} scrollContainerId - id du conteneur scrollable
 */
export function useStickySidebar(sidebarRef, placeholderRef, headerHeight = 73, scrollContainerId = 'main-scroll-container') {
  useEffect(() => {
    const container = document.getElementById(scrollContainerId);
    if (!container) return;

    let cleanup = null;

    const timer = setTimeout(() => {
      if (!placeholderRef.current || !sidebarRef.current) return;

      // Position du placeholder dans le viewport au moment du montage (scroll = valeur actuelle)
      // On veut sa position viewport quand scrollTop=0, donc on corrige avec scrollTop courant.
      const placeholderRect = placeholderRef.current.getBoundingClientRect();
      const scrollAtMount = container.scrollTop;

      // initialViewportTop = top dans le viewport si scrollTop était 0
      const initialViewportTop = placeholderRect.top + scrollAtMount;

      // Seuil : scrollTop à partir duquel le panneau touche la topbar
      // naturalTop = initialViewportTop - scrollTop
      // naturalTop === headerHeight => scrollTop = initialViewportTop - headerHeight
      const stickyThreshold = initialViewportTop - headerHeight;

      const update = () => {
        if (!sidebarRef.current) return;
        const scrollTop = container.scrollTop;
        let topValue;
        if (scrollTop < stickyThreshold) {
          // Position naturelle dans le viewport
          topValue = initialViewportTop - scrollTop;
        } else {
          // Collé sous la topbar
          topValue = headerHeight;
        }
        sidebarRef.current.style.top = topValue + 'px';
        sidebarRef.current.style.maxHeight = (window.innerHeight - topValue - 10) + 'px';
      };

      update();
      container.addEventListener('scroll', update, { passive: true });
      cleanup = () => container.removeEventListener('scroll', update);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, []);
}
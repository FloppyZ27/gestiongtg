import { useEffect } from "react";

/**
 * Rend un élément (sidebarRef) sticky par rapport à un conteneur scrollable.
 * L'élément reste à sa position naturelle jusqu'à ce que le haut du viewport
 * (à HEADER_HEIGHT px) le touche, puis il colle à cette hauteur.
 *
 * @param {React.RefObject} sidebarRef - ref sur le panneau fixe
 * @param {React.RefObject} placeholderRef - ref sur le placeholder dans le flux
 * @param {number} headerHeight - hauteur de la topbar à éviter (px)
 * @param {string} scrollContainerId - id du conteneur scrollable
 */
export function useStickySidebar(sidebarRef, placeholderRef, headerHeight = 73, scrollContainerId = 'main-scroll-container') {
  useEffect(() => {
    const container = document.getElementById(scrollContainerId);
    if (!container) return;

    let cleanup = null;

    const timer = setTimeout(() => {
      if (!placeholderRef.current || !sidebarRef.current) return;

      const containerRect = container.getBoundingClientRect();
      const placeholderRect = placeholderRef.current.getBoundingClientRect();

      // Offset absolu du placeholder depuis le top du conteneur scrollable
      const initialOffsetFromContainer = placeholderRect.top - containerRect.top + container.scrollTop;

      // Seuil de scroll à partir duquel on colle
      const stickyThreshold = initialOffsetFromContainer + containerRect.top - headerHeight;

      const update = () => {
        if (!sidebarRef.current) return;
        const scrollTop = container.scrollTop;
        if (scrollTop < stickyThreshold) {
          const naturalTop = initialOffsetFromContainer - scrollTop + containerRect.top;
          sidebarRef.current.style.top = naturalTop + 'px';
        } else {
          sidebarRef.current.style.top = headerHeight + 'px';
        }
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
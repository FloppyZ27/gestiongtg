import { useEffect } from "react";

/**
 * Simule un comportement sticky pour un panneau dans un conteneur scrollable interne.
 *
 * Au départ : l'élément est dans le flux normal (position: static/relative).
 * Quand le scroll fait que l'élément toucherait la topbar, on le passe en position: fixed.
 *
 * @param {React.RefObject} sidebarRef - ref sur le panneau à rendre sticky
 * @param {number} topOffset - distance depuis le haut du viewport une fois sticky (px)
 * @param {string} scrollContainerId - id du conteneur scrollable
 */
export function useStickySidebar(sidebarRef, topOffset = 160, scrollContainerId = 'main-scroll-container') {
  useEffect(() => {
    const container = document.getElementById(scrollContainerId);
    if (!container || !sidebarRef.current) return;

    // Attendre que le layout soit stable
    const timer = setTimeout(() => {
      if (!sidebarRef.current) return;

      const el = sidebarRef.current;

      // Position initiale du panneau par rapport au haut du conteneur scrollable
      // = distance depuis le haut du conteneur jusqu'au haut de l'élément (quand scroll=0)
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const initialOffsetInContainer = elRect.top - containerRect.top + container.scrollTop;

      // Seuil : à quel scrollTop l'élément toucherait la topbar
      // naturalTop dans viewport = initialOffsetInContainer - scrollTop + containerRect.top
      // On colle quand naturalTop <= topOffset
      // => initialOffsetInContainer - scrollTop + containerRect.top <= topOffset
      // => scrollTop >= initialOffsetInContainer + containerRect.top - topOffset
      const stickyThreshold = initialOffsetInContainer + containerRect.top - topOffset;

      // Largeur initiale à conserver quand on passe en fixed
      const width = el.offsetWidth;

      const update = () => {
        if (!sidebarRef.current) return;
        const scrollTop = container.scrollTop;

        if (scrollTop >= stickyThreshold) {
          // Mode sticky : fixed sous la topbar
          el.style.position = 'fixed';
          el.style.top = topOffset + 'px';
          el.style.width = width + 'px';
        } else {
          // Mode normal : dans le flux
          el.style.position = '';
          el.style.top = '';
          el.style.width = '';
        }
      };

      update();
      container.addEventListener('scroll', update, { passive: true });

      return () => container.removeEventListener('scroll', update);
    }, 200);

    return () => clearTimeout(timer);
  }, []);
}
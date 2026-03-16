"use client";

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Reset window scroll for pages without the MainLayout (like Login/Onboarding)
    window.scrollTo(0, 0);
    
    // Reset the main container scroll which is the primary scroller in MainLayout
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
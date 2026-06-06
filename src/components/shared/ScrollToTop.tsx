
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // 1. Reset the standard window scroll (important for pages like Login/Onboarding)
    window.scrollTo(0, 0);
    
    // 2. Reset the specific scroll container used in MainLayout
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
    
    // 3. Fallback for any generic 'main' element
    const mainElement = document.querySelector('main');
    if (mainElement && mainElement !== scrollContainer) {
      mainElement.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
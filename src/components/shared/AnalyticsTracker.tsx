import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";
import { captureUtmFromUrl } from "@/lib/utm";

/**
 * Fires a page_view event on route change and captures UTM params once on
 * mount. Renders nothing. Must be rendered inside <BrowserRouter>.
 */
export default function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}
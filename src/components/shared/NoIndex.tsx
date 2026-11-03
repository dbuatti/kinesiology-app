import { useEffect } from "react";

/**
 * Keeps anything behind the practice login out of search engines and out of
 * link previews. The SPA is one static index.html for every route, so a
 * crawler that follows a link to /clients otherwise sees the *public* title,
 * description and Open Graph tags from index.html and can index the URL.
 *
 * Two layers cover this:
 *   1. `X-Robots-Tag: noindex, nofollow` response headers for admin paths
 *      (vercel.json) — the layer crawlers see before any JS runs.
 *   2. This component — the in-document <meta name="robots">, added when an
 *      admin page mounts and removed when it unmounts, which is what a
 *      JS-executing crawler (and any saved/bookmarked render) reads.
 *
 * Mount it once per admin shell (MainLayout) and on the portal pages.
 */
const NoIndex = ({ tag = "noindex, nofollow, noarchive" }: { tag?: string }) => {
  useEffect(() => {
    const metas = [
      { name: "robots", content: tag },
      { name: "googlebot", content: tag },
    ].map(({ name, content }) => {
      const el = document.createElement("meta");
      el.setAttribute("name", name);
      el.setAttribute("content", content);
      el.setAttribute("data-rk-noindex", "true");
      document.head.appendChild(el);
      return el;
    });

    return () => metas.forEach((el) => el.remove());
  }, [tag]);

  return null;
};

export default NoIndex;

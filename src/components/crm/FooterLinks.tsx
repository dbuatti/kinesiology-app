import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const FooterLinks = () => {
  const groups = [
    {
      title: "Navigate",
      links: [
        { label: "Today", to: "/" },
        { label: "Calendar", to: "/calendar" },
        { label: "People", to: "/clients" },
      ],
    },
    {
      title: "Practice",
      links: [
        { label: "Sessions", to: "/sessions" },
        { label: "Open hours", to: "/availability" },
        { label: "Availability", to: "/timetable" },
      ],
    },
    {
      title: "Business",
      links: [
        { label: "Inbox", to: "/inbox" },
        { label: "Follow-up", to: "/follow-up" },
        { label: "Money", to: "/money" },
      ],
    },
    {
      title: "Growth",
      links: [
        { label: "Morning Program", to: "/morning-program" },
        { label: "Practice Hub", to: "/practice" },
        { label: "Library", to: "/library" },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-border/70 print:hidden">
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {groups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-xs font-medium text-foreground/80">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Reference</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                  FNH Ref App <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                  Notion manual <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/settings" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Settings</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground/60 sm:flex-row">
          <span>Resonance Kinesiology Practice Suite</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterLinks;

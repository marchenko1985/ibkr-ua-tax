import { cn } from "cn";
import { useEffect, useState } from "react";

/** a section is current once its top passes this many px from the viewport top, just below the bar */
const ACTIVE_OFFSET = 96;

const LINK = "shrink-0 rounded-md px-3 py-1.5 text-muted-foreground text-sm hover:bg-background hover:text-foreground";

/**
 * Sticky menu of the statement sections. Sections mark themselves with `data-nav="<label>"`,
 * so cards, including the optional stats module, are listed without the menu importing them.
 */
export function SectionNav() {
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [active, setActive] = useState<HTMLElement | undefined>();

  useEffect(() => {
    const found = [...document.querySelectorAll<HTMLElement>("[data-nav]")];
    setSections(found);

    function onScroll() {
      setActive(found.findLast((section) => section.getBoundingClientRect().top <= ACTIVE_OFFSET));
    }
    onScroll();
    globalThis.addEventListener("scroll", onScroll, { passive: true });
    return () => globalThis.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="sticky top-0 z-20 -mx-4 flex gap-1 overflow-x-auto border-b bg-secondary/90 px-4 py-2 backdrop-blur print:hidden">
      {sections.map((section) => (
        <button key={section.dataset.nav} type="button" className={cn(LINK, section === active && "bg-background font-medium text-foreground shadow-sm")} onClick={() => section.scrollIntoView()}>
          {section.dataset.nav}
        </button>
      ))}
      <button type="button" className={cn(LINK, "ml-auto")} onClick={() => globalThis.scrollTo({ top: 0 })}>
        ↑ Вгору
      </button>
    </nav>
  );
}

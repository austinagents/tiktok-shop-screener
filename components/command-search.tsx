"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { searchIndex } from "@/lib/data";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex.slice(0, 8);
    return searchIndex
      .filter((item) => `${item.label} ${item.type} ${item.tags}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query]);
  const grouped = useMemo(() => {
    return results.reduce<Record<string, typeof results>>((groups, item) => {
      groups[item.type] = [...(groups[item.type] ?? []), item];
      return groups;
    }, {});
  }, [results]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
      if (!open) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((current) => Math.min(current + 1, results.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter" && results[active]) {
        window.location.href = results[active].slug;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, open, results]);

  return (
    <>
      <button className="searchBox commandTrigger" onClick={() => setOpen(true)} type="button">
        <Search size={16} />
        <span>Search tools, workflows, creators, categories</span>
        <kbd>/</kbd>
      </button>
      {open && (
        <div className="commandOverlay" role="dialog" aria-label="Command search">
          <div className="commandPanel">
            <div className="commandInput">
              <Search size={16} />
              <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} placeholder="Slash search AppScreener" />
              <button onClick={() => setOpen(false)} type="button"><X size={16} /></button>
            </div>
            <div className="commandResults">
              {results.length ? Object.entries(grouped).map(([type, items]) => (
                <div className="commandGroup" key={type}>
                  <span>{type}</span>
                  {items.map((item) => {
                    const index = results.findIndex((result) => result.slug === item.slug && result.type === item.type);
                    return (
                      <a className={index === active ? "active" : ""} href={item.slug} key={`${item.type}-${item.slug}`}>
                        <strong>{item.label}</strong>
                        <small>{item.tags}</small>
                      </a>
                    );
                  })}
                </div>
              )) : <p className="emptyState">No matching ecosystem nodes found.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

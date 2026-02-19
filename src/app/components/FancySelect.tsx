"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FancySelectOption = {
  value: string;
  label: string;
  emoji?: string;
};

type FancySelectProps = {
  value: string;
  options: FancySelectOption[];
  onChange: (nextValue: string) => void;
  placeholder?: string;
};

export default function FancySelect({
  value,
  options,
  onChange,
  placeholder = "선택",
}: FancySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = useMemo(
    () => options.find((item) => item.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="h-12 w-full rounded-2xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.97))] px-4 text-left text-sm font-semibold text-zinc-700 shadow-[0_8px_22px_rgba(120,53,15,0.08)] outline-none transition hover:bg-white focus:border-amber-300 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.18)]"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="pr-8">
          {selectedOption?.emoji ? <span className="mr-1.5">{selectedOption.emoji}</span> : null}
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-amber-700/80">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5.25 7.5L10 12.25L14.75 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white/95 p-1.5 shadow-[0_18px_38px_-24px_rgba(54,41,31,0.55)] backdrop-blur">
          <ul className="max-h-64 overflow-y-auto" role="listbox">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      active
                        ? "bg-[var(--accent)]/12 text-[var(--ink)]"
                        : "text-zinc-700 hover:bg-[var(--paper)]"
                    }`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.emoji ? <span className="mr-1.5">{option.emoji}</span> : null}
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface SearchItem {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchSelectProps {
  items: SearchItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  notFound?: string;
}

export function SearchSelect({
  items,
  value,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled,
  className,
  notFound = 'No results found',
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => i.value === value);

  const filtered = query
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(query.toLowerCase())),
      )
    : items;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const anchor = rect;
  const openUp = anchor !== null && anchor.top + 288 > window.innerHeight;
  const dropdown =
    open && anchor ? (
      <div
        ref={dropdownRef}
        className="fixed z-[60] rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden"
        style={{
          top: openUp ? undefined : anchor.top + 4,
          bottom: openUp ? window.innerHeight - anchor.top + 4 : undefined,
          left: anchor.left,
          width: anchor.width,
        }}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">{notFound}</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onValueChange(item.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                  item.value === value && 'bg-accent font-medium',
                )}
              >
                <Check
                  className={cn(
                    'size-4 shrink-0',
                    item.value === value ? 'text-primary opacity-100' : 'opacity-0',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{item.label}</span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground truncate block">{item.subtitle}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full justify-between h-9 rounded-lg font-normal"
      >
        {selected ? (
          <span className="truncate text-left flex-1">
            <span>{selected.label}</span>
            {selected.subtitle && (
              <span className="text-muted-foreground ml-1.5 text-xs">— {selected.subtitle}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-2" />
      </Button>

      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

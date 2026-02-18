import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_CATEGORIES = [
  'Gimnasio', 'CrossFit', 'Yoga', 'Pilates', 'Boxeo',
  'Natación', 'Artes Marciales', 'Escuela de baile', 'Muay Thai', 'Funcional',
];

interface MultiCategorySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const MultiCategorySelect = ({ value, onChange, placeholder = 'Selecciona categorías…' }: MultiCategorySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const removeCategory = (cat: string) => {
    onChange(value.filter((c) => c !== cat));
  };

  const addCategory = (cat: string) => {
    if (!value.includes(cat)) {
      onChange([...value, cat]);
    }
    setSearch('');
  };

  const filteredOptions = DEFAULT_CATEGORIES.filter(
    (cat) => !value.includes(cat) && cat.toLowerCase().includes(search.toLowerCase())
  );

  const searchTrimmed = search.trim();
  const isCustom = searchTrimmed.length > 0
    && !DEFAULT_CATEGORIES.some((c) => c.toLowerCase() === searchTrimmed.toLowerCase())
    && !value.some((c) => c.toLowerCase() === searchTrimmed.toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background'
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {value.map((cat) => (
          <Badge key={cat} variant="secondary" className="gap-1 pr-1">
            {cat}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeCategory(cat); }}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        <ChevronDown className="h-4 w-4 text-muted-foreground self-center shrink-0" />
      </div>

      {open && (filteredOptions.length > 0 || isCustom) && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filteredOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => addCategory(cat)}
            >
              {cat}
            </button>
          ))}
          {isCustom && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 text-primary font-medium"
              onClick={() => addCategory(searchTrimmed)}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar "{searchTrimmed}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiCategorySelect;

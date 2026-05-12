import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';

interface Option {
  id: string;
  label: string;
  [key: string]: unknown;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: Option) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  className = '',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const search = value.toLowerCase().trim();
    if (search.length === 0) return options.slice(0, 10);
    return options
      .filter(opt => opt.label.toLowerCase().includes(search))
      .slice(0, 10);
  }, [value, options]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlight(0);
  }, [filtered.length]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep highlighted item visible
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${highlight}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  const handleSelect = (opt: Option) => {
    onSelect(opt);
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filtered.length === 0) {
      if (e.key === 'ArrowDown' && filtered.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => (h + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => (h - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      // Only intercept Enter when a real match is highlighted
      if (filtered[highlight]) {
        e.preventDefault();
        handleSelect(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClass}
      />
      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {filtered.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              data-idx={idx}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlight(idx)}
              className={`block w-full px-3 py-2 text-left text-sm ${
                idx === highlight ? 'bg-blue-100 text-blue-900' : 'text-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";

type ProductSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProductSearchBar({ value, onChange }: ProductSearchBarProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onChange(draft.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [draft, onChange]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange(draft.trim());
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        className="search-input"
        type="search"
        placeholder="Search by name, category, brand, or description"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button className="primary-button" type="submit">
        Search
      </button>
    </form>
  );
}

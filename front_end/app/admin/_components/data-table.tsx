import Link from "next/link";
import type React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (item: T) => React.ReactNode;
};

export type DataTableFilter = {
  name: string;
  label: string;
  value?: string;
  options: { label: string; value: string }[];
};

export function DataTable<T>({
  title,
  description,
  items,
  columns,
  total,
  page,
  pageSize,
  search,
  sort,
  sortOptions,
  filters = [],
  createSlot,
  emptyLabel = "No records found.",
  getRowKey,
}: {
  title: string;
  description: string;
  items: T[];
  columns: DataTableColumn<T>[];
  total: number;
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  sortOptions: { label: string; value: string }[];
  filters?: DataTableFilter[];
  createSlot?: React.ReactNode;
  emptyLabel?: string;
  getRowKey?: (item: T, index: number) => React.Key;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader className="gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {createSlot}
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 rounded-md border border-blue-100 bg-blue-50/40 p-3 lg:grid-cols-[minmax(220px,1fr)_180px_repeat(3,150px)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={search ?? ""} placeholder="Search" className="pl-9" />
          </div>
          <select name="sort" defaultValue={sort ?? sortOptions[0]?.value} className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950 shadow-sm">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {filters.map((filter) => (
            <select key={filter.name} name={filter.name} defaultValue={filter.value ?? filter.options[0]?.value} className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950 shadow-sm" aria-label={filter.label}>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
          <select name="page_size" defaultValue={String(pageSize)} className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950 shadow-sm" aria-label="Rows per page">
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
          <Button type="submit">Apply</Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((item, index) => (
                <TableRow key={getRowKey ? getRowKey(item, index) : index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-blue-100 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {page} of {pageCount} · {total} total
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className={page <= 1 ? "pointer-events-none opacity-50" : undefined}>
              <Link href={paginationHref(page - 1, pageSize, search, sort, filters)}>Previous</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}>
              <Link href={paginationHref(page + 1, pageSize, search, sort, filters)}>Next</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function paginationHref(page: number, pageSize: number, search?: string, sort?: string, filters: DataTableFilter[] = []) {
  const params = new URLSearchParams();
  if (search) {
    params.set("q", search);
  }
  if (sort) {
    params.set("sort", sort);
  }
  filters.forEach((filter) => {
    if (filter.value) {
      params.set(filter.name, filter.value);
    }
  });
  params.set("page", String(Math.max(1, page)));
  params.set("page_size", String(pageSize));
  return `?${params.toString()}`;
}

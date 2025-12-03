"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table as TB,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { LayoutGroup, motion } from "framer-motion";
import * as React from "react";

export type TableActions<TData> = {
  customActions?: ((row: TData) => React.ReactNode)[];
  showActions?: boolean;
};

export type TableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  actions?: TableActions<TData>;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  onRowClick?: (row: TData) => void;
};

function ActionsCell<TData>({
  row,
  actions,
}: {
  row: TData;
  actions: TableActions<TData>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="p-0 h-fit w-fit hover:bg-transparent"
          size="sm"
        >
          ⋮
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-54">
        {actions.customActions?.map((action, idx) => (
          <div key={idx}>{action(row)}</div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Table<TData>({
  data,
  columns,
  actions,
  className = "",
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  page = 1,
  pageSize = 10,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  showPagination = true,
  onRowClick,
}: TableProps<TData>) {
  const tableColumns: ColumnDef<TData>[] = [
    ...columns,
    ...(actions?.showActions
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: Row<TData> }) => (
              <ActionsCell row={row.original} actions={actions} />
            ),
            size: 60,
            enableSorting: false,
          } as ColumnDef<TData>,
        ]
      : []),
  ];

  const total = totalRecords ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const isServerPaginated = typeof totalRecords === "number" && !!onPageChange;
  const pageData = isServerPaginated ? data : data.slice(startIndex, endIndex);

  const table = useReactTable({
    data: pageData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [hoveredPage, setHoveredPage] = React.useState<number | null>(null);
  return (
    <div
      className={cn("border rounded-lg overflow-hidden bg-white", className)}
    >
      <TB>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    maxWidth: header.column.getSize(),
                    width: header.column.getSize(),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {table.getAllColumns().map((col, idx) => (
                  <TableCell key={`${col.id}-${idx}`} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                className="px-4 py-6 text-sm text-muted-foreground"
                colSpan={table.getAllColumns().length}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.03 }}
                className={cn(
                  "hover:bg-muted/50 border-b transition-colors",
                  onRowClick ? "cursor-pointer" : ""
                )}
                onClick={
                  onRowClick
                    ? () => onRowClick(row.original as TData)
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </motion.tr>
            ))
          )}
        </TableBody>
      </TB>
      {!loading && showPagination && total > 0 && (
        <div className="px-4 py-3 flex justify-between items-center bg-secondary">
          <div className="flex items-center gap-2">
            <span className="text-sm">Exibir:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="h-8 rounded-md border bg-transparent px-3 text-sm"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">
              de {total.toLocaleString("pt-BR")} resultados
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Anterior"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            >
              ‹ Anterior
            </Button>
            <LayoutGroup>
              {getVisiblePages(totalPages, currentPage).map((p, idx) =>
                typeof p === "number" ? (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative px-3",
                      p === currentPage
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                    onClick={() => onPageChange?.(p)}
                    onMouseEnter={() => setHoveredPage(p)}
                    onMouseLeave={() =>
                      setHoveredPage((v) => (v === p ? null : v))
                    }
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {hoveredPage === null && p === currentPage && (
                      <span className="absolute inset-0 rounded-full bg-primary/15 z-0" />
                    )}
                    <span className="relative z-10">{p}</span>
                  </Button>
                ) : (
                  <span key={idx} className="px-2 text-muted-foreground">
                    …
                  </span>
                )
              )}
            </LayoutGroup>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Próxima"
              disabled={currentPage === totalPages}
              onClick={() =>
                onPageChange?.(Math.min(totalPages, currentPage + 1))
              }
            >
              Próximo ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getVisiblePages(totalPages: number, current: number) {
  const pages: Array<number | string> = [];
  const add = (p: number) => {
    if (!pages.includes(p)) pages.push(p);
  };
  add(1);
  if (current > 3) pages.push("...");
  for (let p = current - 1; p <= current + 1; p++) {
    if (p > 1 && p < totalPages) add(p);
  }
  if (current < totalPages - 2) pages.push("...");
  if (totalPages > 1) add(totalPages);
  return pages;
}

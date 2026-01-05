"use client";

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, TablePagination, Typography, CircularProgress, TableSortLabel } from "@mui/material";

export interface DataTableColumn<T> { id: string; label: string; render?: (row: T) => React.ReactNode; sortable?: boolean; width?: string | number; align?: "left" | "right" | "center"; }

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  pageSize?: number;
  totalCount?: number;
  page?: number;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onPageChange?: (page: number, pageSize: number) => void;
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  onSelectionChange?: (ids: string[]) => void;
  selectedIds?: string[];
  emptyMessage?: string;
  rowKey: keyof T | ((row: T) => string);
}

export function DataTable<T>({ columns, rows, loading = false, pageSize = 10, totalCount, page = 0, sortColumn, sortDirection, onPageChange, onSort, onSelectionChange, selectedIds = [], emptyMessage = "No data available", rowKey }: DataTableProps<T>) {
  const total = totalCount ?? rows.length;
  const getRowKey = (row: T): string => typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const handleSelectAll = (checked: boolean) => onSelectionChange?.(checked ? rows.map(getRowKey) : []);
  const handleSelectRow = (rowId: string) => { const newSelected = selectedIds.includes(rowId) ? selectedIds.filter((id) => id !== rowId) : [...selectedIds, rowId]; onSelectionChange?.(newSelected); };
  const handleSort = (columnId: string) => { const isAsc = sortColumn === columnId && sortDirection === "asc"; onSort?.(columnId, isAsc ? "desc" : "asc"); };

  if (loading) return <Paper sx={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Paper>;
  if (rows.length === 0) return <Paper sx={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary">{emptyMessage}</Typography></Paper>;

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"><Checkbox indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length} checked={allSelected} onChange={(_, checked) => handleSelectAll(checked)} /></TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || "left"} sx={{ width: column.width }}>
                  {column.sortable ? (
                    <TableSortLabel active={sortColumn === column.id} direction={sortDirection || "asc"} onClick={() => handleSort(column.id)}>
                      {column.label}
                    </TableSortLabel>
                  ) : column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => { const rowId = getRowKey(row); return (
              <TableRow key={rowId} hover selected={selectedIds.includes(rowId)}>
                <TableCell padding="checkbox"><Checkbox checked={selectedIds.includes(rowId)} onChange={() => handleSelectRow(rowId)} /></TableCell>
                {columns.map((column) => <TableCell key={column.id} align={column.align || "left"}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.id] ?? "")}</TableCell>)}
              </TableRow>
            ); })}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && total > pageSize && <TablePagination component="div" count={total} page={page} onPageChange={(_, newPage) => onPageChange(newPage, pageSize)} rowsPerPage={pageSize} rowsPerPageOptions={[pageSize]} />}
    </Paper>
  );
}

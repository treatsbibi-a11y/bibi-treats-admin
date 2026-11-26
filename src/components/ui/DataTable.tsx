'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSort,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  minWidthClass?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  loading = false,
  loadingMessage = 'กำลังโหลดข้อมูล...',
  emptyMessage = 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข',
  defaultSort,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  showPagination = true,
  minWidthClass = 'min-w-[760px]',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.direction ?? 'asc');
  const [pageSize, setPageSize] = useState<number | 'ALL'>(defaultPageSize);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data.length, pageSize]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return data;

    const getVal = col.sortValue;
    return [...data].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), 'th');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, columns, sortKey, sortDir]);

  const totalItems = sortedData.length;
  const effectivePageSize = pageSize === 'ALL' ? Math.max(totalItems, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(page, totalPages);

  const pagedData = useMemo(() => {
    if (!showPagination || pageSize === 'ALL') return sortedData;
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, showPagination, pageSize, safePage]);

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable || !col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  const alignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * effectivePageSize + 1;
  const endIdx =
    pageSize === 'ALL' ? totalItems : Math.min(safePage * pageSize, totalItems);

  return (
    <div className="bg-surface rounded-card shadow-card overflow-hidden">
      <div className="overflow-x-auto touch-scroll">
        <table className={`w-full ${minWidthClass} text-left text-[13px] text-ink-secondary border-collapse`}>
          <thead className="bg-surface-secondary text-[11px] font-semibold uppercase tracking-wider text-ink-muted border-b border-surface-border">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-3 xl:px-4 py-2.5 whitespace-nowrap select-none ${alignClass(col.align)} ${
                      col.headerClassName ?? ''
                    }`}
                  >
                    {col.sortable && col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className={`inline-flex items-center gap-1.5 hover:text-ink transition-colors ${
                          col.align === 'right'
                            ? 'flex-row-reverse'
                            : col.align === 'center'
                            ? 'justify-center'
                            : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        <FontAwesomeIcon
                          icon={
                            !isSorted
                              ? faSort
                              : sortDir === 'asc'
                              ? faSortUp
                              : faSortDown
                          }
                          className={`w-2.5 h-2.5 ${
                            isSorted ? 'text-primary-text' : 'text-ink-disabled'
                          }`}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border-light">
            {pagedData.length > 0 ? (
              pagedData.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`bg-surface hover:bg-surface-secondary/70 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 xl:px-4 py-2.5 align-middle ${alignClass(col.align)} ${
                        col.className ?? ''
                      }`}
                    >
                      {col.render(row, idx)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-ink-muted text-xs"
                >
                  {loading ? loadingMessage : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalItems > 0 && (
        <div className="px-4 py-2.5 border-t border-surface-border-light bg-surface-secondary/50 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono-num">
              แสดง {startIdx}–{endIdx} จาก {totalItems.toLocaleString()} รายการ
            </span>
            <label className="inline-flex items-center gap-1.5">
              <span>ต่อหน้า:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                }}
                className="px-2 py-1 rounded-sm border border-surface-border bg-surface text-ink text-xs font-mono-num outline-none focus:border-primary"
                aria-label="จำนวนแถวต่อหน้า"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="ALL">ทั้งหมด</option>
              </select>
            </label>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-sm border border-surface-border bg-surface text-ink-secondary hover:text-ink hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors"
                aria-label="หน้าก่อนหน้า"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-2.5 h-2.5" />
              </button>

              <span className="px-2 font-mono-num text-xs text-ink">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-sm border border-surface-border bg-surface text-ink-secondary hover:text-ink hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors"
                aria-label="หน้าถัดไป"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock3, FileDiff, Globe, MapPin, Shield, UserRound, X } from 'lucide-react';

import { formatDateTime, cn } from '@/lib/utils';
import type { AuditLog } from '@/services/auditLogService';

type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffRow {
  path: string;
  oldValue?: string;
  newValue?: string;
  kind: DiffKind;
}

interface AuditLogDiffModalProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

const KIND_STYLES: Record<DiffKind, string> = {
  added: 'bg-emerald-50/80',
  removed: 'bg-rose-50/80',
  changed: 'bg-amber-50/80',
  unchanged: 'bg-white',
};

function flattenJson(value: unknown, parentPath = ''): Map<string, unknown> {
  const rows = new Map<string, unknown>();

  if (Array.isArray(value)) {
    if (value.length === 0) {
      rows.set(parentPath || '(root)', []);
      return rows;
    }

    value.forEach((item, index) => {
      const nextPath = parentPath ? `${parentPath}[${index}]` : `[${index}]`;
      const nested = flattenJson(item, nextPath);
      nested.forEach((nestedValue, nestedPath) => rows.set(nestedPath, nestedValue));
    });
    return rows;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      rows.set(parentPath || '(root)', {});
      return rows;
    }

    entries.forEach(([key, nestedValue]) => {
      const nextPath = parentPath ? `${parentPath}.${key}` : key;
      const nested = flattenJson(nestedValue, nextPath);
      nested.forEach((valueAtPath, nestedPath) => rows.set(nestedPath, valueAtPath));
    });
    return rows;
  }

  rows.set(parentPath || '(root)', value);
  return rows;
}

function formatCellValue(value: unknown): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function formatAuditDate(value?: string | null) {
  return value ? formatDateTime(value) : '-';
}

function buildDiffRows(log: AuditLog | null): DiffRow[] {
  if (!log) return [];

  const oldMap = flattenJson(log.oldValues ?? {});
  const newMap = flattenJson(log.newValues ?? {});
  const keys = Array.from(new Set([...oldMap.keys(), ...newMap.keys()])).sort();

  return keys.map((key) => {
    const oldValue = oldMap.get(key);
    const newValue = newMap.get(key);
    const oldText = formatCellValue(oldValue);
    const newText = formatCellValue(newValue);

    let kind: DiffKind = 'unchanged';
    if (!oldMap.has(key)) kind = 'added';
    else if (!newMap.has(key)) kind = 'removed';
    else if (oldText !== newText) kind = 'changed';

    return {
      path: key,
      oldValue: oldMap.has(key) ? oldText : '',
      newValue: newMap.has(key) ? newText : '',
      kind,
    };
  });
}

export default function AuditLogDiffModal({ log, open, onClose }: AuditLogDiffModalProps) {
  const [mounted, setMounted] = useState(false);

  const diffRows = useMemo(() => buildDiffRows(log), [log]);
  const changedRows = diffRows.filter((row) => row.kind !== 'unchanged');
  const rowsToRender = changedRows.length > 0 ? changedRows : diffRows;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!mounted || !open || !log) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-4 right-4 left-4 md:left-auto md:w-[min(1100px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/10 bg-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              <FileDiff className="h-3.5 w-3.5" />
              Audit Diff
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {log.entityName}
                {log.entityId ? ` #${log.entityId}` : ''}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                So sánh trước và sau thay đổi theo chuẩn 5W1H.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="grid gap-4 border-b border-slate-200 bg-white px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <UserRound className="h-3.5 w-3.5" />
                Who
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{log.username || 'Anonymous'}</div>
              <div className="text-xs text-slate-500">User ID: {log.userId ?? '-'}</div>
              <div className="text-xs text-slate-500">Role: {log.userRole || '-'}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Shield className="h-3.5 w-3.5" />
                Action
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{log.action}</div>
              <div className="text-xs text-slate-500">Entity: {log.entityName}</div>
              <div className="text-xs text-slate-500">Reason: {log.reason || 'Không có'}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                When
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {formatAuditDate(log.createdAt)}
              </div>
              <div className="text-xs text-slate-500">Changed fields: {changedRows.length}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Globe className="h-3.5 w-3.5" />
                Where
              </div>
              <div className="mt-2 flex items-start gap-2 text-sm text-slate-900">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <div className="font-semibold">{log.ipAddress || '-'}</div>
                  <div className="truncate text-xs text-slate-500" title={log.userAgent || ''}>
                    {log.userAgent || 'Unknown agent'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[220px_1fr_1fr] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div className="px-4 py-3">Field</div>
                <div className="border-l border-slate-200 px-4 py-3">Old Values</div>
                <div className="border-l border-slate-200 px-4 py-3">New Values</div>
              </div>

              {rowsToRender.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  Bản ghi này không có dữ liệu diff để hiển thị.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {rowsToRender.map((row) => (
                    <div
                      key={row.path}
                      className={cn(
                        'grid grid-cols-[220px_1fr_1fr] text-sm',
                        KIND_STYLES[row.kind],
                      )}
                    >
                      <div className="px-4 py-3 font-mono text-xs text-slate-600">{row.path}</div>
                      <div className="border-l border-slate-200 px-4 py-3">
                        <code className="whitespace-pre-wrap break-words text-rose-700">
                          {row.oldValue || ' '}
                        </code>
                      </div>
                      <div className="border-l border-slate-200 px-4 py-3">
                        <code className="whitespace-pre-wrap break-words text-emerald-700">
                          {row.newValue || ' '}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

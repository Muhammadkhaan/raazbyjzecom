'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldAlert,
  Clock,
  User,
  Activity,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/catalog/pagination';

function AdminAuditLogsList() {
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [logs, setLogs] = React.useState<any[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${currentPage}&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Administrative Audit Ledger ({totalCount})
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Immutable system audit logs recording product mutations, stock adjustments, order refunds, and promotions.
          </p>
        </div>
      </div>

      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
            <p className="text-xs text-[#737373]">Querying immutable audit logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Payload Summary</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4 text-[#737373] font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      {new Date(log.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-[#141414]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="outline" size="sm">
                        {log.entityType}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-[#525252]">
                      <div className="font-semibold text-[#141414]">{log.actorEmail}</div>
                      <span className="text-[10px] text-[#737373]">{log.actorRole}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-[11px] font-mono text-[#525252]">
                      {log.payload ? (
                        <span className="truncate block" title={JSON.stringify(log.payload)}>
                          {JSON.stringify(log.payload)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#737373]">
                      {log.ipAddress || 'internal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h3 className="font-semibold text-sm text-[#141414]">No audit logs recorded yet</h3>
            <p className="text-xs text-[#737373]">
              Administrative actions such as product changes, restocks, and settings updates will appear here.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E5E5]">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading audit logs...</p>
        </div>
      }
    >
      <AdminAuditLogsList />
    </React.Suspense>
  );
}

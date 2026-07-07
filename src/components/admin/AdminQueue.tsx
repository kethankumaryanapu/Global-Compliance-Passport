'use client';

import { useState } from 'react';
import { Search, Sliders, CheckCircle, XCircle, Clock, Eye, AlertCircle, FileText, ChevronDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminQueueProps {
  documents: any[];
  onActionComplete: () => void;
  onSelectDoc: (doc: any) => void;
  selectedDocId?: string;
}

export default function AdminQueue({ documents, onActionComplete, onSelectDoc, selectedDocId }: AdminQueueProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // Default to ALL status view
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting
  const [sortField, setSortField] = useState<'createdAt' | 'type' | 'company'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const docTypes = Array.from(new Set(documents.map((d) => d.type)));

  const handleSort = (field: 'createdAt' | 'type' | 'company') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getFilteredDocs = () => {
    return documents.filter((doc) => {
      const q = search.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        (doc.company?.name && doc.company.name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filtering
      if (statusFilter === 'PENDING') {
        if (doc.status !== 'UPLOADED' && doc.status !== 'PROCESSING') return false;
      } else if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
        return false;
      }

      // Type filtering
      if (typeFilter !== 'ALL' && doc.type !== typeFilter) return false;

      return true;
    });
  };

  const sortedDocs = getFilteredDocs().sort((a, b) => {
    let fieldA: any = a[sortField];
    let fieldB: any = b[sortField];

    if (sortField === 'company') {
      fieldA = a.company?.name || '';
      fieldB = b.company?.name || '';
    }

    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated docs
  const totalPages = Math.ceil(sortedDocs.length / itemsPerPage);
  const paginatedDocs = sortedDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
      case 'VERIFIED':
      case 'AI_VALIDATED':
        return <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">{status === 'AI_VALIDATED' ? 'AI Validated' : 'Verified'}</span>;
      case 'Verification Failed':
      case 'REJECTED':
      case 'FAILED':
        return <span className="text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px]">Rejected</span>;
      case 'PROCESSING':
      case 'OCR Analysis':
      case 'Uploading':
        return <span className="text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[10px]">OCR Analysis</span>;
      default:
        return <span className="text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">{status || 'Awaiting Review'}</span>;
    }
  };

  return (
    <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-6">
      {/* Filters block */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="flex bg-zinc-950/40 border border-border rounded-xl p-2 items-center gap-2 w-64">
            <Search className="h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search queue registry..."
              className="bg-transparent text-xs outline-none text-foreground w-full"
            />
          </div>

          {/* Status select filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-border bg-card/60 p-2.5 rounded-xl text-foreground outline-none"
          >
            <option value="ALL">Filter: All Statuses</option>
            <option value="VERIFIED">Filter: Approved</option>
            <option value="REJECTED">Filter: Rejected</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-border bg-card/60 p-2.5 rounded-xl text-foreground outline-none"
          >
            <option value="ALL">Filter: All Doc Types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Datatable */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <th
                onClick={() => handleSort('company')}
                className="py-3 px-2 cursor-pointer hover:text-foreground transition-colors"
              >
                Startup Company
              </th>
              <th
                onClick={() => handleSort('type')}
                className="py-3 px-2 cursor-pointer hover:text-foreground transition-colors"
              >
                Doc Type
              </th>
              <th className="py-3 px-2">File Name</th>
              <th
                onClick={() => handleSort('createdAt')}
                className="py-3 px-2 cursor-pointer hover:text-foreground transition-colors"
              >
                Upload Time
              </th>
              <th className="py-3 px-2">Verification Status</th>
              <th className="py-3 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/45">
            {paginatedDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                  No verification items matched the select filters.
                </td>
              </tr>
            ) : (
              paginatedDocs.map((doc) => {
                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-neutral-800/10 transition-colors ${
                      selectedDocId === doc.id ? 'bg-primary/5 text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    <td className="py-4 px-2 font-bold text-foreground">
                      {doc.company?.name || 'Loading company info...'}
                    </td>
                    <td className="py-4 px-2 font-mono text-primary uppercase font-bold">{doc.type}</td>
                    <td className="py-4 px-2 truncate max-w-[120px]" title={doc.name}>
                      {doc.name}
                    </td>
                    <td className="py-4 px-2">{new Date(doc.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-2">{getStatusBadge(doc.status)}</td>
                    <td className="py-4 px-2 text-right">
                      <button
                        onClick={() => onSelectDoc(doc)}
                        className="inline-flex items-center justify-center p-1.5 hover:text-foreground hover:bg-neutral-800/40 rounded-lg transition-colors border border-border"
                        title="Audit credential details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination blocks */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-border/40 pt-4 text-xs text-muted-foreground">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 h-8 border border-border bg-card/40 hover:bg-card rounded-xl transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 h-8 border border-border bg-card/40 hover:bg-card rounded-xl transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

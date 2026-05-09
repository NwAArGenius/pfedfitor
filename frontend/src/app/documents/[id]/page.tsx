'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { PDFViewer } from '@/components/editor/PDFViewer';
import { useDocumentStore } from '@/store/useDocumentStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  History, 
  FileText, 
  MoreVertical,
  Check
} from 'lucide-react';

export default function DocumentEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    currentDocument, 
    setCurrentDocument, 
    currentPage, 
    setCurrentPage, 
    edits, 
    setEdits 
  } = useDocumentStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await api.get(`/documents/${id}`);
        setCurrentDocument(response.data);
        // Also fetch edits if any exist in the backend
        // const editsResponse = await api.get(`/documents/${id}/edits`);
        // setEdits(editsResponse.data);
      } catch (error) {
        console.error('Failed to fetch document', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDocument();
  }, [id, setCurrentDocument, router]);

  const handleExport = async () => {
    setSaving(true);
    try {
      // First save all edits if they are new (in a real app)
      // Then trigger export
      const response = await api.post(`/documents/${id}/export`);
      alert(`Export successful! File: ${response.data.filename}`);
      // In a real app, we'd trigger a download of the returned path
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export document');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await api.get(`/documents/${id}/report`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_report_${currentDocument?.filename}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Report download failed', error);
      alert('Failed to download audit report');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading editor...</div>;
  if (!currentDocument) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Editor Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[300px]">
              {currentDocument.filename}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {currentDocument.is_scanned ? 'Scanned PDF' : 'Text PDF'} • {currentDocument.page_count} pages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex-shrink-0"
          >
            <History className="w-4 h-4" />
            Audit Report
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1 mx-2 flex-shrink-0">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              className="p-1.5 hover:bg-white rounded shadow-sm disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-medium">Page {currentPage + 1} / {currentDocument.page_count}</span>
            <button 
              disabled={currentPage === currentDocument.page_count - 1}
              onClick={() => setCurrentPage(Math.min(currentDocument.page_count - 1, currentPage + 1))}
              className="p-1.5 hover:bg-white rounded shadow-sm disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleExport}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {saving ? 'Exporting...' : 'Export PDF'}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar (Simplified) */}
        <div className="w-48 bg-white border-r overflow-y-auto p-4 hidden lg:block">
          <div className="space-y-4">
            {Array.from({ length: currentDocument.page_count }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-full aspect-[1/1.4] border-2 rounded-lg transition-all flex items-center justify-center text-sm font-medium
                  ${currentPage === i ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-400'}`}
              >
                Page {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-200/50 flex flex-col items-center">
          <div className="p-8 max-w-full">
            <PDFViewer documentId={id as string} pageNumber={currentPage} />
          </div>
        </div>

        {/* Properties / Audit Sidebar */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b flex items-center gap-2 font-semibold text-gray-900">
            <History className="w-4 h-4 text-blue-600" />
            Audit Trail
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {edits.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm italic">
                No modifications yet
              </div>
            ) : (
              edits.map((edit, i) => (
                <div key={edit.id} className="p-3 border rounded-xl bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">#{edits.length - i}</span>
                    <span className="text-[10px] text-gray-400">Just now</span>
                  </div>
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${edit.edit_type === 'redact' ? 'bg-black text-white' : 'bg-blue-100 text-blue-600'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 capitalize">
                        {edit.edit_type.replace('_', ' ')}
                      </p>
                      <p className="text-[11px] text-gray-500">Page {edit.page_number + 1} • {Math.round(edit.width)}x{Math.round(edit.height)}px</p>
                    </div>
                  </div>
                  {edit.new_value && (
                    <div className="mt-2 p-2 bg-white border rounded text-[11px] text-gray-600 font-mono italic">
                      "{edit.new_value}"
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-green-600 font-medium">
                    <Check className="w-3 h-3" />
                    Logged to history
                  </div>
                </div>
              )).reverse()
            )}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <p className="text-[10px] text-gray-400 leading-relaxed italic">
              All modifications are permanent in the exported version and are logged according to legitimate usage policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  filename: string;
  file_size: number;
  page_count: number;
  status: string;
  is_scanned: boolean;
  created_at: string;
}

export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get('/documents/');
        setDocuments(response.data);
      } catch (error) {
        console.error('Failed to fetch documents', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) return <div>Loading documents...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <Link 
          key={doc.id} 
          href={`/documents/${doc.id}`}
          className="block p-6 bg-white border rounded-xl hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            {doc.status === 'ready' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : doc.status === 'failed' ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            )}
          </div>
          <h3 className="mt-4 font-semibold text-gray-900 truncate">{doc.filename}</h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>{doc.page_count} pages</span>
            <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full ${doc.is_scanned ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {doc.is_scanned ? 'Scanned PDF' : 'Text PDF'}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(doc.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
      {documents.length === 0 && (
        <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">No documents yet. Upload your first PDF to get started.</p>
        </div>
      )}
    </div>
  );
};

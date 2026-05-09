'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const UploadZone: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      router.push(`/documents/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`p-10 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <div className="p-4 bg-blue-50 rounded-full mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-lg font-medium text-gray-900">
          {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
        </p>
        <p className="mt-1 text-sm text-gray-500">Only PDF files are supported</p>
      </div>

      {file && (
        <div className="mt-6 p-4 bg-white border rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <File className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFile(null)}
              className="p-1 hover:bg-gray-100 rounded text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

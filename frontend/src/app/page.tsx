'use client';

import { DocumentList } from '@/components/dashboard/DocumentList';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { FileText, Shield, History, LogOut } from 'lucide-react';
import React from 'react';
export default function DashboardPage() {
  const handleLogout = () => {};
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">PDF Fixer <span className="text-blue-600">Pro</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <History className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
              <p className="mt-1 text-gray-500">Manage, correct and annotate your PDF documents securely.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">3 team members active</span>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="mb-12">
          <UploadZone />
        </section>

        {/* Document List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Recent Documents
            </h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <DocumentList />
        </section>
      </main>

      <footer className="mt-20 border-t py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">© 2026 PDF Fixer Pro. Secure & Legitimate PDF Editing.</p>
          <p className="mt-2 text-xs text-gray-400 max-w-2xl mx-auto italic">
            This application is intended only for the authorized correction, annotation and re-edition of documents belonging to the user or for which they have explicit authorization.
          </p>
        </div>
      </footer>
    </div>
  );
}

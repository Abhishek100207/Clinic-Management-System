import React from 'react';
import { Upload, FileUp, AlertCircle } from 'lucide-react';

const UploadResultsPage = () => {
  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Upload Scan Results</h1>
        <p className="text-slate-500">Securely attach DICOM images, PDF reports, and lab results to patient records.</p>
      </div>

      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Upload size={32} className="text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-navy mb-2">Drag and drop files here</h3>
        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          Support for .dcm, .pdf, .jpg, and .png files. Maximum file size: 50MB.
        </p>
        <button className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          Select Files from Computer
        </button>
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm">
          <AlertCircle size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900 mb-1">Coming Soon: PACS Integration</p>
          <p className="text-xs text-amber-800 opacity-80 leading-relaxed">
            We are working on direct integration with the PACS server to automatically fetch and link DICOM series.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadResultsPage;

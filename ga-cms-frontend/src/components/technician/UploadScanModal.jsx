import React from 'react';
import { PlusCircle, Loader2, Save } from 'lucide-react';

// PERF: Extracted heavy modal component for lazy loading
const UploadScanModal = ({ setIsModalOpen, uploadData, setUploadData, patients, uploading, handleUploadSubmit }) => {
  return (
    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <PlusCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Upload Scan Result</h2>
              <p className="text-slate-400 text-xs mt-1">Fill in the details and attach the file.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleUploadSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record Type</label>
            <select 
              value={uploadData.type}
              onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
              required
            >
              <option value="scan">Scan Result</option>
              <option value="lab">Lab Result</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</label>
            <select 
              value={uploadData.patient_id}
              onChange={(e) => setUploadData({...uploadData, patient_id: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
              required
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id || p.id})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Type</label>
            <input 
              type="text"
              value={uploadData.scan_type}
              onChange={(e) => setUploadData({...uploadData, scan_type: e.target.value})}
              placeholder="e.g., MRI - Brain"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
              required
            />
          </div>
          {uploadData.type === 'scan' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Date</label>
              <input 
                type="date"
                value={uploadData.scan_date}
                onChange={(e) => setUploadData({...uploadData, scan_date: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
                required={uploadData.type === 'scan'}
              />
            </div>
          )}
        </div>

        {uploadData.type === 'scan' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Findings</label>
            <textarea 
              value={uploadData.findings}
              onChange={(e) => setUploadData({...uploadData, findings: e.target.value})}
              placeholder="Enter radiology findings..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-32 focus:border-amber-500 outline-none transition-all resize-none"
              required={uploadData.type === 'scan'}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attach File (PDF/Image)</label>
          <input 
            type="file"
            onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
            accept=".pdf,image/*"
            required
          />
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={uploading}
            className="px-8 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {uploading ? 'Uploading...' : 'Submit Scan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadScanModal;

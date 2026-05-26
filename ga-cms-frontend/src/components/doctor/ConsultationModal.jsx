import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Pill, Clipboard, Stethoscope, AlertCircle, Users, Calendar } from 'lucide-react';
import api from '../../api/axios';

const ConsultationModal = ({ isOpen, onClose, patient, onSave }) => {
  const [activeTab, setActiveTab] = useState('soap');
  const [soap, setSoap] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [prescriptions, setPrescriptions] = useState([
    { medication: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [referredDoctorId, setReferredDoctorId] = useState('');
  const [referralNote, setReferralNote] = useState('');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/api/users/doctors/');
        setDoctors(res.data || []);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    setPrescriptions([...prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedication = (index) => {
    const newPrescriptions = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(newPrescriptions.length ? newPrescriptions : [{ medication: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleMedChange = (index, field, value) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index][field] = value;
    setPrescriptions(newPrescriptions);
  };

  const handleSave = () => {
    onSave({ 
      soap, 
      prescriptions, 
      prescriptionNotes, 
      followUpDate, 
      referral: { 
        referredDoctorId, 
        referralNote 
      } 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Stethoscope size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">New Consultation</h2>
              <p className="text-indigo-100 text-xs font-medium opacity-90">Patient: <span className="text-white font-bold">{patient?.patient_name || patient?.full_name || 'Anonymous Patient'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('soap')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'soap' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Clipboard size={18} /> SOAP Notes
          </button>
          <button 
            onClick={() => setActiveTab('prescription')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'prescription' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Pill size={18} /> Prescription
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'soap' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subjective (S)</label>
                  <textarea 
                    value={soap.subjective}
                    onChange={(e) => setSoap({...soap, subjective: e.target.value})}
                    placeholder="Patient's symptoms and history..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-32 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objective (O)</label>
                  <textarea 
                    value={soap.objective}
                    onChange={(e) => setSoap({...soap, objective: e.target.value})}
                    placeholder="Physical exam results, vitals..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-32 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment (A)</label>
                  <textarea 
                    value={soap.assessment}
                    onChange={(e) => setSoap({...soap, assessment: e.target.value})}
                    placeholder="Diagnosis or differential diagnosis..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-32 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan (P)</label>
                  <textarea 
                    value={soap.plan}
                    onChange={(e) => setSoap({...soap, plan: e.target.value})}
                    placeholder="Next steps, follow-up, tests..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-32 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Specialist Consult & Referral Card */}
              <div className="bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-3xl p-6 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Specialist Consult & Referral</h4>
                    <p className="text-[11px] text-slate-400">Request second opinion or refer the patient to another specialist</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Doctor / Specialist</label>
                    <select
                      value={referredDoctorId}
                      onChange={(e) => setReferredDoctorId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors"
                    >
                      <option value="">No referral (None)</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.user?.full_name || d.user?.first_name || 'Unknown'} ({d.specialty || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Request / Notes</label>
                    <input
                      type="text"
                      value={referralNote}
                      onChange={(e) => setReferralNote(e.target.value)}
                      placeholder="E.g. Please evaluate for chronic chest pain..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Pill size={16} className="text-indigo-500" /> Medications List
                </h3>
                <button 
                  onClick={handleAddMedication}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Prescription
                </button>
              </div>
              
              {prescriptions.map((med, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-left duration-200">
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Medication Name</label>
                    <input 
                      type="text"
                      value={med.medication}
                      onChange={(e) => handleMedChange(index, 'medication', e.target.value)}
                      placeholder="E.g. Amoxicillin"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</label>
                    <input 
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                      placeholder="500mg"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Frequency</label>
                    <select 
                      value={med.frequency}
                      onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="1-0-1">1-0-1 (Morning, Night)</option>
                      <option value="1-1-1">1-1-1 (M, A, N)</option>
                      <option value="1-0-0">1-0-0 (Morning)</option>
                      <option value="0-0-1">0-0-1 (Night)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                    <input 
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                      placeholder="5 Days"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center pb-1">
                    <button 
                      onClick={() => handleRemoveMedication(index)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Prescription Notes / Advice & Follow-up Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 mt-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    Prescription Notes / Advice
                  </label>
                  <textarea
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="E.g. Take medications after food. Avoid cold beverages and rest well."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-28 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400 inline" /> Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  Please verify drug interactions and patient allergies before finalizing the prescription. All prescriptions will be digitally signed with your credentials.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            {activeTab === 'soap' ? <Clipboard size={14} /> : <Pill size={14} />} 
            {activeTab === 'soap' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <Save size={14} /> Finalize Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;

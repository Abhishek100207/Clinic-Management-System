import React, { useState } from 'react';
import { X, Save, Clipboard, TestTube, ChevronRight, ChevronLeft, Scale, User, Calendar, Droplets, Pill, Plus, Trash2 } from 'lucide-react';

const OPConsultationModal = ({ isOpen, onClose, patient, onSave }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    weight: '',
    soap: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    },
    recommendedTests: '',
    prescriptions: [{ medicine: '', dosage: '' }]
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleAddMedicine = () => {
    setFormData({
      ...formData,
      prescriptions: [...formData.prescriptions, { medicine: '', dosage: '' }]
    });
  };

  const handleRemoveMedicine = (index) => {
    const newPres = formData.prescriptions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      prescriptions: newPres.length ? newPres : [{ medicine: '', dosage: '' }]
    });
  };

  const handleMedChange = (index, field, value) => {
    const newPres = [...formData.prescriptions];
    newPres[index][field] = value;
    setFormData({ ...formData, prescriptions: newPres });
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{patient?.patient_name || 'Rahul Verma'}</h2>
                <div className="flex items-center gap-4 mt-1 opacity-70 text-sm">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {patient?.age || '28'}y, {patient?.gender || 'Male'}</span>
                  <span className="flex items-center gap-1.5"><Droplets size={14} className="text-rose-400" /> {patient?.blood_group || 'O+'}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consultation Date</p>
              <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="relative">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient Weight (kg)</p>
              <div className="flex items-center gap-2">
                <Scale size={14} className="text-blue-400" />
                <input 
                  type="number" 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="bg-transparent border-b border-white/20 focus:border-blue-400 outline-none text-sm font-bold w-16"
                  placeholder="00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Clipboard size={18} className="text-blue-500" /> SOAP Format Consultation
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Subjective (S)', key: 'subjective', placeholder: "Patient's symptoms, history..." },
                  { label: 'Objective (O)', key: 'objective', placeholder: "Physical exam, vitals, observations..." },
                  { label: 'Assessment (A)', key: 'assessment', placeholder: "Diagnosis or clinical impressions..." },
                  { label: 'Plan (P)', key: 'plan', placeholder: "Treatment plan, next steps..." }
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</label>
                    <textarea 
                      value={formData.soap[item.key]}
                      onChange={(e) => setFormData({
                        ...formData, 
                        soap: { ...formData.soap, [item.key]: e.target.value }
                      })}
                      placeholder={item.placeholder}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm h-32 focus:border-blue-500 outline-none transition-all resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <TestTube size={18} className="text-blue-500" /> Recommended Tests
                </h3>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Write down recommended tests</label>
                <textarea 
                  value={formData.recommendedTests}
                  onChange={(e) => setFormData({...formData, recommendedTests: e.target.value})}
                  placeholder="E.g. Full Blood Count, HbA1c, Chest X-Ray..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm h-48 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Pill size={18} className="text-blue-500" /> Prescription Form
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medicine Details</label>
                  <button 
                    onClick={handleAddMedicine}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add More
                  </button>
                </div>
                
                {formData.prescriptions.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100 animate-in slide-in-from-left duration-200">
                    <div className="md:col-span-7 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Name of the Medicine</label>
                      <input 
                        type="text"
                        value={med.medicine}
                        onChange={(e) => handleMedChange(index, 'medicine', e.target.value)}
                        placeholder="E.g. Paracetamol"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</label>
                      <input 
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                        placeholder="E.g. 500mg, Twice a day"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-center pb-1">
                      <button 
                        onClick={() => handleRemoveMedicine(index)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div>
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-navy transition-colors"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            {step < 3 ? (
              <>
                {step === 2 && (
                  <button 
                    onClick={handleNext}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Skip Tests
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                  Next <ChevronRight size={18} />
                </button>
              </>
            ) : (
              <button 
                onClick={handleSubmit}
                className="px-10 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
              >
                <Save size={18} /> Submit Consultation
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OPConsultationModal;

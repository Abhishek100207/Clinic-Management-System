import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Clipboard, TestTube, ChevronRight, ChevronLeft, Scale, User, Calendar, Droplets, Pill, Plus, Trash2, Loader2, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { searchDrugs } from '../../api/medicalRecords';

const OPConsultationModal = ({ isOpen, onClose, patient, onSave }) => {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMedIndex, setActiveMedIndex] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  const [formData, setFormData] = useState({
    weight: '',
    soap: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    },
    recommendedTests: '',
    prescriptions: [{ medicine: '', use_case: '', dosage_form: '', dosage_value: '', dosage_unit: '', time: { morning: false, afternoon: false, night: false }, food: '' }],
    prescriptionNotes: '',
    followUpDate: '',
    referredDoctorId: '',
    referralNote: ''
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/api/users/doctors/');
        setDoctors(Array.isArray(res.data) ? res.data : (res.data?.results || []));
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  // Load draft when patient/appointment changes or modal opens
  useEffect(() => {
    if (isOpen && patient?.id) {
      isFirstLoad.current = true;
      setSaveStatus('');
      const savedDraft = localStorage.getItem(`op_draft_appt_${patient.id}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.formData) {
            setFormData(draft.formData);
          }
          if (draft.step) {
            setStep(draft.step);
          }
          setSaveStatus('Draft loaded');
        } catch (e) {
          console.error("Failed to parse saved consultation draft", e);
        }
      } else {
        // Reset to default empty state if no draft exists
        setStep(1);
        setFormData({
          weight: '',
          soap: {
            subjective: '',
            objective: '',
            assessment: '',
            plan: ''
          },
          recommendedTests: '',
          prescriptions: [{ medicine: '', use_case: '', dosage_form: '', dosage_value: '', dosage_unit: '', time: { morning: false, afternoon: false, night: false }, food: '' }],
          prescriptionNotes: '',
          followUpDate: '',
          referredDoctorId: '',
          referralNote: ''
        });
      }
      
      const timer = setTimeout(() => {
        isFirstLoad.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, patient?.id]);

  // Save draft on state changes
  useEffect(() => {
    if (isOpen && patient?.id && !isFirstLoad.current) {
      const draft = {
        formData,
        step
      };
      localStorage.setItem(`op_draft_appt_${patient.id}`, JSON.stringify(draft));
      setSaveStatus('Draft autosaved');
    }
  }, [formData, step, isOpen, patient?.id]);

  if (!isOpen) return null;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleAddMedicine = () => {
    setFormData({
      ...formData,
      prescriptions: [...formData.prescriptions, { medicine: '', use_case: '', dosage_form: '', dosage_value: '', dosage_unit: '', time: { morning: false, afternoon: false, night: false }, food: '' }]
    });
  };

  const handleRemoveMedicine = (index) => {
    const newPres = formData.prescriptions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      prescriptions: newPres.length ? newPres : [{ medicine: '', use_case: '', dosage_form: '', dosage_value: '', dosage_unit: '', time: { morning: false, afternoon: false, night: false }, food: '' }]
    });
  };

  const handleMedChange = (index, field, value) => {
    const newPres = [...formData.prescriptions];
    newPres[index][field] = value;
    setFormData({ ...formData, prescriptions: newPres });

    if (field === 'medicine') {
      setActiveMedIndex(index);
      setShowDropdown(true);
      
      if (timeoutId) clearTimeout(timeoutId);
      
      const id = setTimeout(async () => {
        if (!value) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const data = await searchDrugs(value);
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching drugs:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
      
      setTimeoutId(id);
    }
  };


  const handleSubmit = () => {
    const mappedPrescriptions = formData.prescriptions.map(med => {
      const times = [];
      if (med.time?.morning) times.push('Morning');
      if (med.time?.afternoon) times.push('Afternoon');
      if (med.time?.night) times.push('Night');
      
      const dosageStr = med.dosage_value ? `${med.dosage_value} ${med.dosage_unit || ''}`.trim() : '';
      
      return {
        medicine: med.medicine,
        dosage: dosageStr,
        frequency: times.join(', ') || 'As directed',
        instructions: med.food || '',
        side_effects: med.side_effects,
        substitutes: med.substitutes
      };
    });
    
    onSave({ ...formData, prescriptions: mappedPrescriptions });
    onClose();
  };

  const handleSendReferral = async () => {
    if (!formData.referredDoctorId) {
      toast.error("Please select a doctor/specialist first.");
      return;
    }
    const referredDoc = doctors.find(d => d.id.toString() === formData.referredDoctorId.toString());
    if (!referredDoc || !referredDoc.user) {
      toast.error("Selected doctor profile could not be found.");
      return;
    }

    try {
      // Post referral request to Django backend
      const payload = {
        referred_to: referredDoc.id,
        patient: patient.patient, // patient.patient is the integer ID of the patient
        notes: formData.referralNote || 'No notes provided.'
      };
      
      await api.post('/api/appointments/referrals/', payload);

      toast.success(`Referral request sent to Dr. ${referredDoc.user.full_name} successfully!`);
      
      // Dispatch storage event to trigger real-time updates for listeners
      window.dispatchEvent(new Event('storage'));
      
      // Clear referral input
      setFormData(prev => ({ ...prev, referralNote: '', referredDoctorId: '' }));
    } catch (err) {
      console.error("Failed to send referral", err);
      toast.error("Failed to submit referral to the server.");
    }
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

              {/* Specialist Consult & Referral Card */}
              <div className="bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-3xl p-6 transition-all duration-300 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Specialist Consult & Referral</h4>
                    <p className="text-[11px] text-slate-400">Request second opinion or refer the patient to another specialist</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Doctor / Specialist</label>
                    <select
                      value={formData.referredDoctorId || ''}
                      onChange={(e) => setFormData({ ...formData, referredDoctorId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-colors"
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
                      value={formData.referralNote || ''}
                      onChange={(e) => setFormData({ ...formData, referralNote: e.target.value })}
                      placeholder="E.g. Please evaluate for chronic chest pain..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleSendReferral}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all text-xs active:scale-95 whitespace-nowrap"
                    >
                      Send Consult Request
                    </button>
                  </div>
                </div>
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
                    <Plus size={14} /> Add Prescription
                  </button>
                </div>
                
                {formData.prescriptions.map((med, index) => (
                  <div key={index} className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 animate-in slide-in-from-left duration-200">
                    
                    {/* Row 1: Medicine & Dosage */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-7 space-y-2 relative" ref={activeMedIndex === index ? dropdownRef : null}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Name of the Medicine</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={med.medicine}
                            onChange={(e) => handleMedChange(index, 'medicine', e.target.value)}
                            onFocus={() => {
                              setActiveMedIndex(index);
                              setShowDropdown(true);
                            }}
                            placeholder="E.g. Paracetamol"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all pr-10"
                          />
                          {loading && activeMedIndex === index && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 size={16} className="animate-spin text-blue-500" />
                            </div>
                          )}
                        </div>
                        
                        {med.use_case && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Used for: {med.use_case}
                          </div>
                        )}

                        {/* Dropdown */}
                        {showDropdown && activeMedIndex === index && (suggestions.length > 0 || !loading) && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                            {suggestions.length > 0 ? (
                              suggestions.map((drug, i) => (
                                <div 
                                  key={i}
                                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                                  onClick={() => {
                                    const newPres = [...formData.prescriptions];
                                    newPres[index]['medicine'] = drug.drug_name;
                                    newPres[index]['side_effects'] = drug.side_effects;
                                    newPres[index]['substitutes'] = drug.substitutes;
                                    newPres[index]['use_case'] = drug.use_case;
                                    newPres[index]['dosage_form'] = drug.dosage_form;
                                    setFormData({ ...formData, prescriptions: newPres });
                                    setShowDropdown(false);
                                  }}
                                >
                                  <div className="font-bold">{drug.drug_name}</div>
                                  {drug.dosage_form && <div className="text-xs text-slate-400">{drug.dosage_form}</div>}
                                </div>
                              ))
                            ) : (
                              !loading && <div className="px-4 py-2 text-sm text-slate-400">No medicines found</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-5 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={med.dosage_value}
                            onChange={(e) => handleMedChange(index, 'dosage_value', e.target.value)}
                            placeholder="E.g. 5, 500"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                          />
                          <select
                            value={med.dosage_unit}
                            onChange={(e) => handleMedChange(index, 'dosage_unit', e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                          >
                            <option value="">Unit</option>
                            <option value="mg">mg</option>
                            <option value="ml">ml</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Half Tablet">Half Tablet</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Time & Food & Delete */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-6 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Time</label>
                        <div className="flex gap-2">
                          {['morning', 'afternoon', 'night'].map(t => (
                            <button
                              key={t}
                              onClick={() => {
                                const newPres = [...formData.prescriptions];
                                newPres[index]['time'][t] = !newPres[index]['time'][t];
                                setFormData({ ...formData, prescriptions: newPres });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${med.time?.[t] ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Food</label>
                        <select
                          value={med.food}
                          onChange={(e) => handleMedChange(index, 'food', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">Select</option>
                          <option value="Before Food">Before Food</option>
                          <option value="After Food">After Food</option>
                        </select>
                      </div>

                      <div className="md:col-span-1 flex justify-center pt-4">
                        <button 
                          onClick={() => handleRemoveMedicine(index)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Read-only Info Blocks */}
                    {(med.side_effects?.length > 0 || med.substitutes?.length > 0) && (
                      <div className="space-y-1 mt-2">
                        {med.side_effects && med.side_effects.length > 0 && (
                          <div className="p-3 bg-rose-50 rounded-lg text-xs text-rose-700">
                            <strong>Side Effects:</strong> {Array.isArray(med.side_effects) ? med.side_effects.join(', ') : med.side_effects}
                          </div>
                        )}
                        {med.substitutes && med.substitutes.length > 0 && (
                          <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-700">
                            <strong>Substitutes:</strong> {Array.isArray(med.substitutes) ? med.substitutes.join(', ') : med.substitutes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Prescription Notes / Advice & Follow-up Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 mt-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      Prescription Notes / Advice
                    </label>
                    <textarea
                      value={formData.prescriptionNotes || ''}
                      onChange={(e) => setFormData({ ...formData, prescriptionNotes: e.target.value })}
                      placeholder="E.g. Take medications after food. Avoid cold beverages and rest well."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-28 focus:border-blue-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400 inline" /> Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate || ''}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-navy transition-colors"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            {saveStatus && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-pulse bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm shadow-emerald-50/50">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {saveStatus}
              </span>
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

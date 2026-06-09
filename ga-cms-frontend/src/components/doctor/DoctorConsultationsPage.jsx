import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Stethoscope, 
  Clock,
  Calendar,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Droplets
} from 'lucide-react';
import OPConsultationModal from './OPConsultationModal';
import api from '../../api/axios';
import { createConsultationNote, createPrescription, fetchDrugs, checkDrugInteractions } from '../../api/medicalRecords';
import { toast } from 'react-toastify';

const DoctorConsultationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);



  const fetchOPAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/appointments/appointments/');
      
      // Filter for OP (in-person) and confirmed for today using robust timezone-aware match
      const opList = res.data.filter(a => {
        if (!a.date) return false;
        const [year, month, day] = a.date.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const today = new Date();
        const isToday = d.getDate() === today.getDate() &&
                       d.getMonth() === today.getMonth() &&
                       d.getFullYear() === today.getFullYear();
        
        return (a.appointment_type === 'in_person' || a.appointment_type === 'in-person' || a.appointment_type === 'virtual' || a.type === 'OP') &&
               ['confirmed', 'checked_in', 'in_progress'].includes(a.status) &&
               isToday;
      });
      
      setAppointments(opList);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOPAppointments();
  }, []);

  const filteredAppointments = appointments.filter(a => 
    a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id?.toString().includes(searchTerm)
  );

  const handleTakeOP = (appt) => {
    setSelectedPatient(appt);
    setIsModalOpen(true);
  };

  const handleSaveConsultation = async (data) => {
    try {
      const apptId = selectedPatient?.id;
      if (!apptId) {
        alert("Cannot save without an appointment ID.");
        return;
      }
      
      await createConsultationNote({
        appointment: apptId,
        subjective: data.soap.subjective,
        objective: data.soap.objective,
        assessment: data.soap.assessment,
        plan: data.soap.plan,
      });

      if (data.prescriptions && data.prescriptions.length > 0 && data.prescriptions[0].medicine) {
        const meds = await Promise.all(data.prescriptions.filter(p => p.medicine).map(async p => {
          let finalDrugId = p.drug_id;
          if (!finalDrugId) {
            try {
              const res = await api.get(`/api/medical_records/drugs/search/?q=${encodeURIComponent(p.medicine)}&limit=1`);
              if (res.data && res.data.length > 0) {
                finalDrugId = res.data[0].id;
              } else {
                finalDrugId = 1;
              }
            } catch (e) {
              finalDrugId = 1;
            }
          }
          return {
            drug_id: finalDrugId,
            dosage: p.dosage || 'Not specified',
            frequency: p.frequency || 'As directed',
            duration: p.duration || 'As directed',
            instructions: p.instructions || ''
          };
        }));

        if (meds.length > 1) {
          try {
            const drugIds = meds.map(m => m.drug_id);
            const interactionRes = await checkDrugInteractions(drugIds);
            if (interactionRes.interactions && interactionRes.interactions.length > 0) {
              const proceed = window.confirm(`WARNING: Drug Interactions Detected:\n- ${interactionRes.interactions.join('\n- ')}\n\nDo you still want to prescribe these medications?`);
              if (!proceed) return;
            }
          } catch(e) { console.error("Interaction check failed", e); }
        }

        await createPrescription({
          appointment: apptId,
          medications: meds
        });
      }

      if (data.recommendedTests && data.recommendedTests !== 'None') {
        const tests = data.recommendedTests.split(',').map(t => t.trim()).filter(Boolean);
        for (const test of tests) {
          try {
            await api.post('/api/medical_records/scan-orders/', {
              patient: selectedPatient.patient || selectedPatient.id,
              doctor: selectedPatient.doctor || 1,
              scan_type: test,
              status: 'pending'
            });
          } catch (err) {
            console.error(`Failed to create scan order for ${test}:`, err);
          }
        }
        // Update appointment status to completed
        await api.patch(`/api/appointments/appointments/${apptId}/`, { status: 'completed' });
        toast.success(`Consultation finalized. SOAP notes saved to patient profile. ${tests.length} test orders sent to Technician.`);
      } else {
        // Update appointment status to completed
        await api.patch(`/api/appointments/appointments/${apptId}/`, { status: 'completed' });
        toast.success(`Consultation finalized. SOAP notes saved to patient profile.`);
      }
      
      // Clear draft from localStorage on successful save
      localStorage.removeItem(`op_draft_appt_${apptId}`);

      // Remove from list
      setAppointments(prev => prev.filter(a => a.id !== apptId));
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      toast.error(`Failed to save consultation records: ${errorMsg}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Today's Consultations</h1>
          <p className="text-slate-500">Manage outpatient and virtual appointments for today.</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search patient by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Record List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appt) => (
            <div key={appt.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
              
              {/* Patient Details */}
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                  {appt.patient_name?.charAt(0)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                    <p className="font-bold text-navy text-lg leading-tight">{appt.patient_name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">#{appt.id} • {appt.gender || 'M'}, {appt.age || '28'}y</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blood Group</p>
                    <div className="flex items-center gap-2 text-rose-600 font-bold">
                      <Droplets size={16} />
                      {appt.blood_group || 'O+'}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scheduled Time</p>
                    <div className="flex items-center gap-2 text-navy font-bold">
                      <Clock size={16} className="text-blue-500" />
                      {appt.consultation_time || '10:30 AM'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full md:w-auto">
                {localStorage.getItem(`op_draft_appt_${appt.id}`) ? (
                  <button 
                    onClick={() => handleTakeOP(appt)}
                    className="w-full md:w-auto px-10 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Stethoscope size={20} /> Continue OP
                  </button>
                ) : (
                  <button 
                    onClick={() => handleTakeOP(appt)}
                    className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Stethoscope size={20} /> Start Consultation
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">No Appointments Today</h3>
            <p className="text-slate-400 max-w-sm mx-auto">There are no Outpatient appointments scheduled for the current date.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAppointments.length > 0 && (
        <div className="flex justify-between items-center px-4">
          <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-widest">Showing {filteredAppointments.length} Today</p>
          <div className="flex gap-2">
            <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors shadow-sm"><ChevronLeft size={20} /></button>
            <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors shadow-sm"><ChevronRight size={20} /></button>
          </div>
        </div>
      )}

      <OPConsultationModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchOPAppointments();
        }}
        patient={selectedPatient}
        onSave={handleSaveConsultation}
      />

    </div>
  );
};

export default DoctorConsultationsPage;

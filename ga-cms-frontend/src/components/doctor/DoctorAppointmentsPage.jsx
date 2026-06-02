import React, { useEffect, useState } from 'react';

import { useAppointmentStore } from '../../store/appointmentStore';

import AppointmentTable from './AppointmentTable';
import { Calendar, RefreshCw } from 'lucide-react';
import RescheduleModal from '../shared/appointments/RescheduleModal';
import OPConsultationModal from './OPConsultationModal';
import api from '../../api/axios';
import { createConsultationNote, createPrescription, fetchDrugs, checkDrugInteractions } from '../../api/medicalRecords';
import { toast } from 'react-toastify';

const DoctorAppointmentsPage = () => {

  const { appointments, loading, fetchDoctorDashboardData, updateAppointmentStatus } = useAppointmentStore();
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });
  const [activeFilter, setActiveFilter] = useState('All Appointments');

  // ── OP Consultation modal state ────────────────────────────────────────────
  const [consultModal, setConsultModal] = useState({ isOpen: false, appointment: null });

  useEffect(() => {
    fetchDoctorDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = (id, action) => {
    if (action === 'reschedule') {
      const appt = appointments.find(a => a.id === id);
      setRescheduleData({ isOpen: true, appointment: appt });
    } else if (action === 'consult') {
      // Open OP Consultation modal instead of just patching status
      const appt = appointments.find(a => a.id === id);
      setConsultModal({ isOpen: true, appointment: appt });
      // Mark the appointment as in_progress so the queue reflects it
      updateAppointmentStatus(id, 'in_progress');
    } else {
      updateAppointmentStatus(id, action);
    }
  };

  const handleRescheduleSubmit = async (data) => {
    try {
      await api.post(`/api/appointments/appointments/${rescheduleData.appointment.id}/reschedule/`, data);
      setRescheduleData({ isOpen: false, appointment: null });
      fetchDoctorDashboardData();
      alert("Appointment rescheduled successfully.");
    } catch (err) {
      alert("Failed to reschedule: " + (err.response?.data?.error || ""));
    }
  };

  // ── Save consultation (mirrors DoctorConsultationsPage.handleSaveConsultation) ──
  const handleSaveConsultation = async (data) => {
    try {
      const appt = consultModal.appointment;
      const apptId = appt?.id;
      if (!apptId) {
        toast.error("Cannot save: no appointment ID found.");
        return;
      }

      // 1. Save SOAP note
      await createConsultationNote({
        appointment: apptId,
        subjective: data.soap.subjective,
        objective:  data.soap.objective,
        assessment: data.soap.assessment,
        plan:       data.soap.plan,
      });

      // 2. Save prescription + medications
      let availableDrugs = [];
      try {
        availableDrugs = await fetchDrugs();
      } catch(e) { /* no drugs fetched */ }

      if (data.prescriptions && data.prescriptions.length > 0 && data.prescriptions[0].medicine) {
        const meds = data.prescriptions.filter(p => p.medicine).map(p => {
          const matchedDrug = availableDrugs.find(d => d.name.toLowerCase() === p.medicine.toLowerCase());
          return {
            drug_id:   matchedDrug ? matchedDrug.id : (availableDrugs.length > 0 ? availableDrugs[0].id : 1),
            dosage:    p.dosage,
            frequency: p.frequency || 'As directed',
            duration:  'As directed',
          };
        });

        // Drug interaction check for multiple drugs
        if (meds.length > 1) {
          try {
            const drugIds = meds.map(m => m.drug_id);
            const interactionRes = await checkDrugInteractions(drugIds);
            if (interactionRes.interactions && interactionRes.interactions.length > 0) {
              const proceed = window.confirm(
                `WARNING: Drug Interactions Detected:\n- ${interactionRes.interactions.join('\n- ')}\n\nDo you still want to prescribe these medications?`
              );
              if (!proceed) return;
            }
          } catch(e) { console.error("Interaction check failed", e); }
        }

        await createPrescription({
          appointment: apptId,
          notes:          data.prescriptionNotes || '',
          follow_up_date: data.followUpDate || null,
          medications:    meds,
        });
      } else if (data.prescriptionNotes || data.followUpDate) {
        // Save prescription even with no medications if there are notes or a follow-up date
        await createPrescription({
          appointment:    apptId,
          notes:          data.prescriptionNotes || '',
          follow_up_date: data.followUpDate || null,
          medications:    [],
        });
      }

      // 3. Create scan orders for recommended tests
      if (data.recommendedTests && data.recommendedTests !== 'None') {
        const tests = data.recommendedTests.split(',').map(t => t.trim()).filter(Boolean);
        for (const test of tests) {
          try {
            await api.post('/api/medical_records/scan-orders/', {
              patient:   appt.patient || appt.id,
              doctor:    appt.doctor  || 1,
              scan_type: test,
              status:    'pending',
            });
          } catch (err) {
            console.error(`Failed to create scan order for ${test}:`, err);
          }
        }
        await api.patch(`/api/appointments/appointments/${apptId}/`, { status: 'completed' });
        toast.success(`Consultation finalized. SOAP notes saved. ${tests.length} test order(s) sent to technician.`);
      } else {
        await api.patch(`/api/appointments/appointments/${apptId}/`, { status: 'completed' });
        toast.success("Consultation finalized. SOAP notes & prescription saved.");
      }

      // Clear draft from localStorage on successful save
      localStorage.removeItem(`op_draft_appt_${apptId}`);

      // Close modal and refresh
      setConsultModal({ isOpen: false, appointment: null });
      fetchDoctorDashboardData();

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      toast.error(`Failed to save consultation records: ${errorMsg}`);
    }
  };

  // Apply filter logic
  const today = new Date();
  const filteredAppointments = appointments.filter(appt => {
    if (activeFilter === 'All Appointments') return true;
    
    const apptDate = appt.date ? (() => {
      const [y, m, d] = appt.date.split('-').map(Number);
      return new Date(y, m - 1, d);
    })() : null;

    if (activeFilter === 'Today') {
      return apptDate &&
        apptDate.getDate()     === today.getDate() &&
        apptDate.getMonth()    === today.getMonth() &&
        apptDate.getFullYear() === today.getFullYear();
    }
    if (activeFilter === 'Upcoming') {
      return apptDate && apptDate >= today && !['completed', 'cancelled'].includes(appt.status);
    }
    if (activeFilter === 'Pending Approval') {
      return appt.status === 'pending';
    }
    if (activeFilter === 'Completed') {
      return appt.status === 'completed';
    }
    return true;
  });

  const filters = ['All Appointments', 'Today', 'Upcoming', 'Pending Approval', 'Completed'];

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2 flex items-center gap-3">
            <Calendar className="text-blue-600" />
            My Appointments
          </h1>
          <p className="text-slate-500 text-sm">Manage your daily consultation schedule and patient queue.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDoctorDashboardData}
            className="p-2.5 rounded-xl border border-gray-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {filter}
              {filter === 'Pending Approval' && appointments.filter(a => a.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointment Table */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            </div>
          ) : (
            <AppointmentTable 
              appointments={filteredAppointments} 
              onAction={handleAction} 
            />
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={handleRescheduleSubmit}
        appointment={rescheduleData.appointment}
      />

      {/* OP Consultation Modal — opens when Consult button is clicked */}
      <OPConsultationModal
        isOpen={consultModal.isOpen}
        onClose={() => setConsultModal({ isOpen: false, appointment: null })}
        patient={consultModal.appointment}
        onSave={handleSaveConsultation}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;

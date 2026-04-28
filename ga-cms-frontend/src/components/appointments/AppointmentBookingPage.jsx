import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Badge } from '../shared/Badge';

const AppointmentBookingPage = () => {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  
  // State for Booking Form
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentType, setAppointmentType] = useState('in_person');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  // Mock data for dropdowns (in real app, fetched from backend)
  const doctors = [
    { id: '1', name: 'Dr. Sarah Smith', specialty: 'General' },
    { id: '2', name: 'Dr. John Doe', specialty: 'Cardiologist' }
  ];

  // Fetch slots
  useEffect(() => {
    if (doctorId && date && appointmentType) {
      // Mock API call to backend /api/appointments/slots/?doctor_id=X&date=Y&appointment_type=Z
      // Simulating response:
      setAvailableSlots(['09:00:00', '09:20:00', '09:40:00', '10:20:00']);
    } else {
      setAvailableSlots([]);
    }
  }, [doctorId, date, appointmentType]);

  const handleBook = () => {
    console.log("Booking: ", { patientId, doctorId, appointmentType, date, time });
    alert("Appointment successfully booked!");
    setStep(1); // Reset
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 glass">
        <h1 className="text-3xl font-bold tracking-tight text-navy mb-6">Book an Appointment</h1>
        
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Step 1: Patient Information</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID / Name</label>
              <Input 
                value={patientId} 
                onChange={(e) => setPatientId(e.target.value)} 
                placeholder="Enter Patient ID or Search by Name..."
              />
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(2)} disabled={!patientId}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Step 2: Doctor & Type</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
              <select 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">-- Choose a Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="type" 
                    value="in_person" 
                    checked={appointmentType === 'in_person'} 
                    onChange={() => setAppointmentType('in_person')}
                    className="mr-2"
                  />
                  In-Person
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="type" 
                    value="virtual" 
                    checked={appointmentType === 'virtual'} 
                    onChange={() => setAppointmentType('virtual')}
                    className="mr-2"
                  />
                  Virtual (Video Call)
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!doctorId || !appointmentType}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Step 3: Select Date & Time</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Date</label>
              <Input 
                type="date"
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>

            {date && doctorId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots for {appointmentType === 'in_person' ? 'In-Person' : 'Virtual'}</label>
                <div className="grid grid-cols-4 gap-3">
                  {availableSlots.length > 0 ? availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`p-2 border rounded-md text-sm font-medium transition-colors ${time === slot ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                    >
                      {slot.substring(0,5)}
                    </button>
                  )) : (
                    <p className="text-sm text-gray-500 col-span-4">No slots available for this date.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleBook} disabled={!date || !time}>Confirm Booking</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentBookingPage;

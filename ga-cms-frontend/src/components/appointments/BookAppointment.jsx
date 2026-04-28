import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MOCK_PATIENTS, MOCK_DOCTORS, TIME_SLOTS, BOOKED_SLOTS,
  APPOINTMENT_TYPES, MOCK_APPOINTMENTS
} from './appointmentData';

const STEPS = ['Patient', 'Doctor', 'Type & Time', 'Confirm'];

const Avatar = ({ initials, color = '#1d4ed8' }) => (
  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
    style={{ background: `${color}33`, border: `1.5px solid ${color}55` }}>
    {initials}
  </div>
);

const BookAppointment = ({ onBooked }) => {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [apptType, setApptType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const bookedKey = doctor && date ? `${doctor.id}_${date}` : '';
  const bookedTimes = BOOKED_SLOTS[bookedKey] || [];

  const today = new Date().toISOString().split('T')[0];

  const filteredPatients = MOCK_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const filteredDoctors = MOCK_DOCTORS.filter(d => {
    if (apptType === 'in_person') return d.inPerson;
    if (apptType === 'virtual') return d.virtual;
    return true;
  });

  const canNext = [
    !!patient,
    !!doctor,
    !!(apptType && date && time),
    true,
  ];

  const handleBook = () => {
    const newAppt = {
      id: MOCK_APPOINTMENTS.length + 1,
      patientId: patient.id, doctorId: doctor.id,
      date, time, type: apptType, status: 'confirmed', reason,
    };
    MOCK_APPOINTMENTS.push(newAppt);
    setDone(true);
    if (onBooked) onBooked(newAppt);
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>✓</div>
      <div>
        <p className="text-white font-black text-2xl">Appointment Booked!</p>
        <p className="text-white/40 text-sm mt-2">
          {patient.name} with {doctor.name} on {date} at {time}
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={() => { setStep(0); setPatient(null); setDoctor(null); setApptType(''); setDate(''); setTime(''); setReason(''); setDone(false); }}
          className="px-6 py-2.5 rounded-xl text-white font-bold text-sm border border-white/15 hover:bg-white/10 transition-all">
          Book Another
        </button>
        <button onClick={() => navigate('/appointments')}
          className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
          View All Appointments
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Step bar */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${i < step ? 'text-white' : i === step ? 'text-white' : 'text-white/30'
                }`} style={{
                  background: i < step ? '#10b981' : i === step ? 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' : 'rgba(255,255,255,0.08)'
                }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${i === step ? 'text-white' : 'text-white/30'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mb-4" style={{ background: i < step ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0 — Select Patient */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-white font-black text-xl">Select Patient</h2>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
            style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredPatients.map(p => (
              <button key={p.id} onClick={() => setPatient(p)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${patient?.id === p.id ? 'border-blue-500' : 'border-white/8 hover:border-white/20'
                  }`}
                style={{ background: patient?.id === p.id ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.03)' }}>
                <Avatar initials={p.avatar} />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{p.name}</p>
                  <p className="text-white/40 text-xs">{p.phone} · Age {p.age}</p>
                </div>
                {patient?.id === p.id && <span className="text-blue-400 text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Select Doctor */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-white font-black text-xl">Select Doctor</h2>
          <div className="flex flex-col gap-2">
            {MOCK_DOCTORS.map(d => (
              <button key={d.id} onClick={() => setDoctor(d)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${doctor?.id === d.id ? 'border-blue-500' : 'border-white/8 hover:border-white/20'
                  }`}
                style={{ background: doctor?.id === d.id ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.03)' }}>
                <Avatar initials={d.avatar} color="#7c3aed" />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{d.name}</p>
                  <p className="text-white/40 text-xs">{d.specialty}</p>
                </div>
                <div className="flex gap-1">
                  {d.inPerson && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>In-Person</span>}
                  {d.virtual && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Virtual</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Type, Date & Time */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-white font-black text-xl">Choose Type & Time</h2>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Appointment Type</label>
            <div className="grid grid-cols-2 gap-3">
              {APPOINTMENT_TYPES.filter(t =>
                t.value === 'in_person' ? doctor?.inPerson : doctor?.virtual
              ).map(t => (
                <button key={t.value} onClick={() => setApptType(t.value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${apptType === t.value ? 'border-blue-500' : 'border-white/10 hover:border-white/25'
                    }`}
                  style={{ background: apptType === t.value ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.03)' }}>
                  <span className="text-2xl">{t.icon}</span>
                  <p className="text-white font-bold text-sm">{t.label}</p>
                  <p className="text-white/40 text-xs">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Date</label>
            <input type="date" value={date} min={today} onChange={e => { setDate(e.target.value); setTime(''); }}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }} />
          </div>

          {/* Time slots */}
          {date && (
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Available Slots</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(slot => {
                  const booked = bookedTimes.includes(slot);
                  return (
                    <button key={slot} disabled={booked} onClick={() => setTime(slot)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${booked ? 'opacity-30 cursor-not-allowed' :
                          time === slot ? 'text-white' : 'text-white/50 hover:text-white border border-white/10 hover:border-white/30'
                        }`}
                      style={time === slot ? { background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' } :
                        booked ? { background: 'rgba(255,255,255,0.05)' } : { background: 'rgba(255,255,255,0.04)' }}>
                      {slot}
                    </button>
                  );
                })}
              </div>
              <p className="text-white/20 text-xs">Greyed slots are already booked</p>
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Reason (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="e.g. Fever, follow-up, routine checkup…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20 resize-none"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-white font-black text-xl">Confirm Appointment</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[
              ['Patient', patient?.name],
              ['Doctor', doctor?.name],
              ['Specialty', doctor?.specialty],
              ['Type', apptType === 'in_person' ? '🏥 In-Person' : '💻 Virtual'],
              ['Date', date],
              ['Time', time],
              ['Reason', reason || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3 border-b border-white/8 last:border-0">
                <span className="text-white/40 text-sm">{label}</span>
                <span className="text-white font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl px-4 py-3 border border-blue-400/20" style={{ background: 'rgba(29,78,216,0.1)' }}>
            <p className="text-blue-300 text-xs">A confirmation will be sent to the patient's registered contact.</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="px-6 py-2.5 rounded-xl text-white/50 font-bold text-sm border border-white/10 hover:border-white/25 hover:text-white transition-all">
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < 3
          ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
            Next →
          </button>
          : <button onClick={handleBook}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            ✓ Confirm Booking
          </button>
        }
      </div>
    </div>
  );
};

export default BookAppointment;

// Mock data — replace with API calls when backend is ready

export const MOCK_PATIENTS = [
  { id: 1, name: 'Rahul Mehta', age: 34, phone: '+91 98765 43210', avatar: 'RM' },
  { id: 2, name: 'Priya Sharma', age: 28, phone: '+91 91234 56789', avatar: 'PS' },
  { id: 3, name: 'Arjun Nair', age: 45, phone: '+91 87654 32109', avatar: 'AN' },
  { id: 4, name: 'Sneha Patel', age: 22, phone: '+91 76543 21098', avatar: 'SP' },
  { id: 5, name: 'Vikram Singh', age: 55, phone: '+91 65432 10987', avatar: 'VS' },
  { id: 6, name: 'Meera Iyer', age: 31, phone: '+91 54321 09876', avatar: 'MI' },
];

export const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. Aryan Kapoor', specialty: 'General Physician', avatar: 'AK', inPerson: true, virtual: true },
  { id: 2, name: 'Dr. Sunita Rao', specialty: 'Cardiologist', avatar: 'SR', inPerson: true, virtual: false },
  { id: 3, name: 'Dr. Ravi Menon', specialty: 'Orthopedic', avatar: 'RM', inPerson: true, virtual: true },
  { id: 4, name: 'Dr. Kavya Reddy', specialty: 'Dermatologist', avatar: 'KR', inPerson: false, virtual: true },
  { id: 5, name: 'Dr. Anil Sharma', specialty: 'Neurologist', avatar: 'AS', inPerson: true, virtual: true },
];

export const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM',
];

// Slots already booked (doctor_id + date + time)
export const BOOKED_SLOTS = {
  '1_2026-04-28': ['09:00 AM', '10:30 AM', '02:00 PM'],
  '2_2026-04-28': ['09:30 AM', '11:00 AM'],
  '1_2026-04-29': ['09:00 AM', '09:30 AM', '10:00 AM'],
};

export const APPOINTMENT_TYPES = [
  { value: 'in_person', label: 'In-Person', icon: '🏥', desc: 'Visit the clinic' },
  { value: 'virtual', label: 'Virtual', icon: '💻', desc: 'Video consultation' },
];

export const MOCK_APPOINTMENTS = [
  { id: 1, patientId: 1, doctorId: 1, date: '2026-04-28', time: '09:00 AM', type: 'in_person', status: 'confirmed', reason: 'Fever & cold' },
  { id: 2, patientId: 2, doctorId: 2, date: '2026-04-28', time: '09:30 AM', type: 'in_person', status: 'confirmed', reason: 'Chest pain' },
  { id: 3, patientId: 3, doctorId: 1, date: '2026-04-28', time: '10:30 AM', type: 'virtual', status: 'confirmed', reason: 'Follow-up' },
  { id: 4, patientId: 4, doctorId: 3, date: '2026-04-29', time: '11:00 AM', type: 'in_person', status: 'pending', reason: 'Knee pain' },
  { id: 5, patientId: 5, doctorId: 5, date: '2026-04-29', time: '02:00 PM', type: 'virtual', status: 'confirmed', reason: 'Headache' },
  { id: 6, patientId: 6, doctorId: 4, date: '2026-04-30', time: '03:00 PM', type: 'virtual', status: 'pending', reason: 'Skin rash' },
  { id: 7, patientId: 1, doctorId: 2, date: '2026-04-30', time: '10:00 AM', type: 'in_person', status: 'cancelled', reason: 'BP check' },
];

export const statusColor = {
  confirmed: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  pending: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  completed: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#6366f1' },
};

export const getPatient = (id) => MOCK_PATIENTS.find(p => p.id === id);
export const getDoctor = (id) => MOCK_DOCTORS.find(d => d.id === id);

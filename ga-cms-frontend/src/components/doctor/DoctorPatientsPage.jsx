import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Clipboard, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import api from '../../api/axios';

const DoctorPatientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data as fallback
  const mockPatients = [
    { id: '1', full_name: 'Rahul Verma', blood_group: 'O+' },
    { id: '2', full_name: 'Anjali Sharma', blood_group: 'A-' },
    { id: '3', full_name: 'Vikram Singh', blood_group: 'B+' },
    { id: '4', full_name: 'Priya Das', blood_group: 'AB+' },
    { id: '5', full_name: 'Suresh Kumar', blood_group: 'O-' },
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/api/users/patients/');
        if (res.data && res.data.length > 0) {
          setPatients(res.data);
        } else {
          setPatients(mockPatients);
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
        setPatients(mockPatients);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toString().includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6 animate-fade-in">
      
      {/* Header with Search in Top Right */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-navy">My Patients</h1>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search patient..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Patient Records List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
              
              {/* Patient Info */}
              <div className="flex items-center gap-5 flex-1">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {patient.full_name?.charAt(0)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 flex-1">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                    <p className="font-bold text-navy">{patient.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient ID</p>
                    <p className="font-bold text-navy text-sm">#PAT-{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Blood Group</p>
                    <p className="font-bold text-rose-600 text-sm">{patient.blood_group || 'O+'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  <Clipboard size={14} /> Medical History
                </button>
                <button className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  <FileText size={14} /> Medical Reports
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No patients found matching your search.</p>
          </div>
        )}
      </div>

      {/* Pagination Placeholder */}
      {filteredPatients.length > 0 && (
        <div className="flex justify-between items-center px-2 py-4">
          <p className="text-xs text-slate-400 font-medium">Showing {filteredPatients.length} patients</p>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorPatientsPage;

import React, { useState, useEffect } from 'react';
import { Users, Search, Download, UserPlus, Filter } from 'lucide-react';
import api from '../../api/axios';
import { Spinner } from '../shared/Spinner';

const AdminPatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/api/users/patients/');
        setPatients(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.patient_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Patient Records Master</h1>
          <p className="text-slate-500">Comprehensive database of all registered patients in the clinic system.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID or name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <UserPlus size={18} />
            Add Patient
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">No Patients Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              There are no patient records matching your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Patient ID</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Contact</th>
                  <th className="p-4 font-bold">Blood Group</th>
                  <th className="p-4 font-bold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-indigo-600 font-bold">{patient.patient_id}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{patient.full_name}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <div>{patient.mobile_number}</div>
                      <div className="text-xs">{patient.email}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-rose-500">{patient.blood_group || 'N/A'}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(patient.user?.date_joined).toLocaleDateString() || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPatientsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Calendar, ChevronRight, Star, UserPlus } from 'lucide-react';
import api from '../../api/axios';
import { Spinner } from '../shared/Spinner';

const AdminDoctorsPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/api/users/doctors/');
        setDoctors(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(d => 
    d.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Doctor Directory & Scheduling</h1>
          <p className="text-slate-500">Manage doctor profiles, specializations, and their performance metrics.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or specialty..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => navigate('/staff/add', { state: { role: 'doctor' } })}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus size={14} /> Add Doctor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filteredDoctors.length === 0 ? (
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">No Doctors Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            No doctors matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-sm">Dr. {doctor.user?.full_name}</h3>
                    <p className="text-xs text-slate-400 font-medium mb-1">{doctor.specialty}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Active Staff</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reg #</p>
                  <p className="text-xs font-mono font-medium text-slate-700">{doctor.registration_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                  <div className="flex items-center justify-end gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-navy">{parseFloat(doctor.average_rating || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400">({doctor.total_reviews})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDoctorsPage;

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Stethoscope, 
  Microscope, 
  Briefcase, 
  ChevronRight,
  Plus,
  Mail,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { useDebounce } from '../../hooks/useDebounce';

const AdminStaffDirectoryPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // PERF: Debounce search input
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await authApi.listStaff();
        setStaffList(data || []);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setStaffList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter(s => {
    const matchesTab = activeTab === 'all' || s.role === activeTab;
    const matchesSearch = s.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                          s.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  }); // PERF: Use debounced search term

  const roleIcons = {
    doctor: <Stethoscope size={20} />,
    technician: <Microscope size={20} />,
    receptionist: <Briefcase size={20} />,
    admin: <ShieldCheck size={20} />
  };

  const roleColors = {
    doctor: 'text-blue-600 bg-blue-50 border-blue-100',
    technician: 'text-amber-600 bg-amber-50 border-amber-100',
    receptionist: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    admin: 'text-purple-600 bg-purple-50 border-purple-100'
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Staff Directory</h1>
          <p className="text-slate-500">Manage and monitor all clinic personnel including Doctors, Technicians, and Receptionists.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search staff by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
            />
          </div>
          <button className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
        {['all', 'doctor', 'technician', 'receptionist'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white text-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}s
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((staff) => (
            <div key={staff.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group border-b-4 border-b-transparent hover:border-b-blue-500">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border ${roleColors[staff.role] || 'text-slate-600 bg-slate-50'}`}>
                  {roleIcons[staff.role] || <Users size={24} />}
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${roleColors[staff.role] || 'text-slate-600 bg-slate-50'}`}>
                  {staff.role}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-navy text-lg group-hover:text-blue-600 transition-colors">{staff.full_name || 'Staff Member'}</h3>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Mail size={12} /> {staff.email}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Department: {staff.spec || 'General'}</span>
                  <button className="text-blue-500 hover:underline flex items-center gap-1">
                    Manage <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <Users size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-navy">No staff found</h3>
            <p className="text-slate-400 text-sm">No members match your current filter or search criteria.</p>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <button 
        onClick={() => window.location.href = '/staff/add'}
        className="fixed bottom-10 right-10 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

    </div>
  );
};

export default AdminStaffDirectoryPage;

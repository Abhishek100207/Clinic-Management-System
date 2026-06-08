import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Download, Calendar, BarChart3, Search } from 'lucide-react';
import api from '../../api/axios';
import { Spinner } from '../shared/Spinner';

const AdminRevenuePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get('/api/appointments/invoices/');
        setInvoices(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(i => 
    i.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = invoices.filter(i => i.payment_status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const pendingRevenue = invoices.filter(i => i.payment_status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Financial Analytics</h1>
          <p className="text-slate-500">Track clinic revenue, invoices, and financial performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-64 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
            <Download size={18} />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
            {loading ? (
              <div className="p-12 flex justify-center"><Spinner /></div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 size={28} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">No Invoices Found</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  There are no financial records matching your criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold">Invoice #</th>
                      <th className="p-4 font-bold">Patient</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Amount</th>
                      <th className="p-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-sm font-mono text-indigo-600 font-bold">{inv.invoice_number}</td>
                        <td className="p-4 text-sm font-bold text-slate-800">{inv.patient_name}</td>
                        <td className="p-4 text-sm text-slate-500">
                          {new Date(inv.date_issued).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800">₹{inv.total_amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.payment_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="font-bold text-navy text-lg mb-6">Financial Summary</h3>
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-3xl font-black text-navy flex items-center gap-1">
                <IndianRupee size={24} className="text-emerald-500" /> {totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm p-4 bg-amber-50 rounded-2xl">
                <span className="text-amber-700 font-bold">Pending Payments</span>
                <span className="font-bold text-navy">₹{pendingRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-600 font-bold">Total Invoices</span>
                <span className="font-bold text-navy">{invoices.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenuePage;

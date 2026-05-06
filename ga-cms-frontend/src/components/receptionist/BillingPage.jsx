import React from 'react';
import { CreditCard, Receipt, Download, FileText, ArrowUpRight } from 'lucide-react';

const BillingPage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Billing & Invoices</h1>
        <p className="text-slate-500">Manage patient payments, generate invoices, and track daily revenue.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">Invoice Generator</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Automated billing system linked with doctor consultations and scan orders.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Receipt size={120} />
            </div>
            <h3 className="text-xl font-bold mb-4">Daily Settlement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-sm text-slate-400">Cash</span>
                <span className="font-bold">₹8,450</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-sm text-slate-400">Online/Card</span>
                <span className="font-bold">₹14,200</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-emerald-400">₹22,650</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;

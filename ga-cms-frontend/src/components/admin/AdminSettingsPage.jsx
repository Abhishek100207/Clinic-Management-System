import React from 'react';
import { Settings, Shield, Globe, Bell, Database, HardDrive, Lock } from 'lucide-react';

const AdminSettingsPage = () => {
  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Global System Settings</h1>
        <p className="text-slate-500">Configure core clinic parameters, security policies, and system integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Clinic Identity', desc: 'Name, address, contact and logo.', icon: <Globe size={20} /> },
          { title: 'Security & Access', desc: 'MFA, password policies and role permissions.', icon: <Lock size={20} /> },
          { title: 'Data Management', desc: 'Backups, exports and retention policies.', icon: <Database size={20} /> },
          { title: 'Notifications', desc: 'Email, SMS and In-app alert configurations.', icon: <Bell size={20} /> },
          { title: 'API & Integrations', desc: 'Connect with external diagnostic labs.', icon: <Shield size={20} /> },
          { title: 'System Logs', desc: 'Infrastructure and application health logs.', icon: <HardDrive size={20} /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-5 hover:border-indigo-200 transition-all cursor-pointer group">
            <div className="p-3 bg-slate-50 text-slate-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              {item.icon}
            </div>
            <div>
              <h3 className="font-bold text-navy text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettingsPage;

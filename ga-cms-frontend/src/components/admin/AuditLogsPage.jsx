import React from 'react';
import AuditLogViewer from './AuditLogViewer';

const AuditLogsPage = () => {
  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy mb-2">System Audit Logs</h1>
        <p className="text-slate-500">Comprehensive overview of all critical system and security events.</p>
      </div>
      <AuditLogViewer />
    </div>
  );
};

export default AuditLogsPage;

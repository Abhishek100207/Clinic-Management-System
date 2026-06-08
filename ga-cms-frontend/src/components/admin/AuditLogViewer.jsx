import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/api/users/audit-logs/');
        setLogs(response.data.results || response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError('Failed to load audit logs.');
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-slate-500 animate-pulse">Loading audit logs...</div>;
  }

  if (error) {
    return <div className="text-red-500 bg-red-50 p-4 rounded-md border border-red-100">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-offwhite flex justify-between items-center">
        <h3 className="text-lg font-bold text-navy">Security Audit Logs</h3>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
          Read Only
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-slate-500 font-semibold border-b border-gray-100">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">IP Address</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-slate-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 italic">No critical security events found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 font-medium text-navy">
                    {log.user_name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-700 font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                    {log.ip_address || 'N/A'}
                  </td>
                  <td className="px-6 py-3">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogViewer;

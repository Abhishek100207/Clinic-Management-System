import React, { useState, useEffect } from 'react';
import { LineChart, Search, Target, Award, Star, Trophy } from 'lucide-react';
import api from '../../api/axios';
import { Spinner } from '../shared/Spinner';

const AdminStaffPerformancePage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await api.get('/api/users/doctors/');
        setDoctors(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch performance data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const totalReviews = doctors.reduce((sum, d) => sum + (d.total_reviews || 0), 0);
  const avgRating = doctors.length > 0 && totalReviews > 0
    ? (doctors.reduce((sum, d) => sum + parseFloat(d.average_rating || 0) * (d.total_reviews || 0), 0) / totalReviews).toFixed(1)
    : 0;

  const sortedDoctors = [...doctors].sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Staff Performance & KPIs</h1>
        <p className="text-slate-500">Monitor productivity, patient feedback, and efficiency metrics for all clinic staff.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={24} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-navy mb-1">Efficiency Index</h3>
              <p className="text-3xl font-black text-blue-600">92%</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">System-wide average (Simulated)</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={24} className="text-amber-500" />
              </div>
              <h3 className="font-bold text-navy mb-1">Overall Satisfaction</h3>
              <p className="text-3xl font-black text-amber-600">{avgRating}/5</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Based on {totalReviews} patient reviews</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={24} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-navy mb-1">Top Rated Staff</h3>
              <p className="text-3xl font-black text-emerald-600">Dr. {sortedDoctors[0]?.user?.full_name || 'N/A'}</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Highest average rating</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="text-lg font-bold text-navy">Doctor Performance Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Rank</th>
                    <th className="p-4 font-bold">Doctor</th>
                    <th className="p-4 font-bold">Specialty</th>
                    <th className="p-4 font-bold">Average Rating</th>
                    <th className="p-4 font-bold">Total Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDoctors.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="p-4 text-sm font-bold text-slate-800">Dr. {doc.user?.full_name}</td>
                      <td className="p-4 text-sm text-slate-500">{doc.specialty}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="font-bold text-navy">{parseFloat(doc.average_rating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">{doc.total_reviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStaffPerformancePage;

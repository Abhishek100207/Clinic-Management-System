import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Star, FileText, Search, Activity, User, Building, Wrench, Users } from 'lucide-react';
import { Spinner } from '../shared/Spinner';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/api/appointments/reviews/list/');
        setReviews(res.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(r => 
    r.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOverallAverage = (review) => {
    const sum = review.consultation_rating + review.doctor_rating + review.receptionist_rating + review.technician_rating + review.hospital_rating;
    return (sum / 5).toFixed(1);
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-emerald-500 bg-emerald-50';
    if (rating >= 3.5) return 'text-blue-500 bg-blue-50';
    if (rating >= 2.5) return 'text-yellow-500 bg-yellow-50';
    return 'text-rose-500 bg-rose-50';
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Reviews</h1>
          <p className="text-sm text-gray-500">View and analyze consultation feedback</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by doctor or patient..."
            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-900">No reviews found</h3>
            <p className="text-gray-500">Wait for patients to submit post-consultation feedback.</p>
          </div>
        ) : (
          filteredReviews.map(review => {
            const overall = getOverallAverage(review);
            return (
              <div key={review.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Appointment with {review.doctor_name}</h3>
                    <p className="text-sm text-gray-500">Patient: {review.patient_name} • Submitted on {new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${getRatingColor(overall)}`}>
                    <Star size={20} className="fill-current" />
                    <span className="text-xl">{overall}</span>
                    <span className="text-xs opacity-70">/ 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 mb-1"><Activity size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Consultation</span></div>
                    <div className="text-lg font-bold flex items-center gap-1">{review.consultation_rating} <Star size={14} className="text-yellow-500 fill-yellow-500"/></div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-600 mb-1"><User size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Doctor</span></div>
                    <div className="text-lg font-bold flex items-center gap-1">{review.doctor_rating} <Star size={14} className="text-yellow-500 fill-yellow-500"/></div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-600 mb-1"><Users size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Reception</span></div>
                    <div className="text-lg font-bold flex items-center gap-1">{review.receptionist_rating} <Star size={14} className="text-yellow-500 fill-yellow-500"/></div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-600 mb-1"><Wrench size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Technician</span></div>
                    <div className="text-lg font-bold flex items-center gap-1">{review.technician_rating} <Star size={14} className="text-yellow-500 fill-yellow-500"/></div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1"><Building size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Hospital</span></div>
                    <div className="text-lg font-bold flex items-center gap-1">{review.hospital_rating} <Star size={14} className="text-yellow-500 fill-yellow-500"/></div>
                  </div>
                </div>

                {review.general_comments && (
                  <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Patient Comments</h4>
                    <p className="text-sm text-gray-700 italic">"{review.general_comments}"</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default AdminReviewsPage;

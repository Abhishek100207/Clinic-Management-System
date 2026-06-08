import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Star, 
  CheckCircle, 
  MessageSquare, 
  User, 
  Clock, 
  Calendar, 
  Heart, 
  Activity, 
  AlertCircle,
  Building,
  Users,
  Wrench,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const ConsultationReviewForm = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();


  // Form states for each of the required feedback areas
  const [ratings, setRatings] = useState({
    consultation: 0,
    doctor: 0,
    receptionist: 0,
    technician: 0,
    hospital: 0,
  });

  const [hoverRatings, setHoverRatings] = useState({
    consultation: 0,
    doctor: 0,
    receptionist: 0,
    technician: 0,
    hospital: 0,
  });

  const [comments, setComments] = useState({
    consultation: '',
    doctor: '',
    receptionist: '',
    technician: '',
    hospital: '',
    general: ''
  });

  const [showComments, setShowComments] = useState({
    consultation: false,
    doctor: false,
    receptionist: false,
    technician: false,
    hospital: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    const fetchAppt = async () => {
      const cleanId = appointmentId ? appointmentId.replace('APT-', '') : '';
      if (!cleanId) return;
      try {
        const res = await api.get(`/api/appointments/appointments/${cleanId}/`);
        setAppointment(res.data);
      } catch (err) {
        console.error("Failed to fetch appointment details", err);
      }
    };
    fetchAppt();
  }, [appointmentId]);

  const getRatingLabel = (rating) => {
    switch (rating) {
      case 1: return { text: 'Poor', color: 'text-rose-500 bg-rose-50' };
      case 2: return { text: 'Fair', color: 'text-amber-500 bg-amber-50' };
      case 3: return { text: 'Good', color: 'text-yellow-500 bg-yellow-50' };
      case 4: return { text: 'Very Good', color: 'text-blue-500 bg-blue-50' };
      case 5: return { text: 'Excellent', color: 'text-emerald-500 bg-emerald-50' };
      default: return { text: 'Select Rating', color: 'text-slate-400 bg-slate-50' };
    }
  };

  const categories = [
    {
      key: 'consultation',
      title: 'Consultation Experience',
      description: 'How satisfied were you with the quality and depth of the medical consultation itself?',
      icon: <Activity className="text-blue-500" size={20} />
    },
    {
      key: 'doctor',
      title: 'Doctor Behavior & Care',
      description: 'Rate the doctor\'s empathy, explanations, professionalism, and attentiveness to your concerns.',
      icon: <User className="text-indigo-500" size={20} />
    },
    {
      key: 'receptionist',
      title: 'Receptionist Service & Wait Time',
      description: 'Rate the ease of check-in, friendliness of receptionist staff, and efficiency of the queue.',
      icon: <Users className="text-amber-500" size={20} />
    },
    {
      key: 'technician',
      title: 'Technician & Diagnostic Support',
      description: 'Rate your experience with lab technicians, scan room service, and diagnostic assistance.',
      icon: <Wrench className="text-purple-500" size={20} />
    },
    {
      key: 'hospital',
      title: 'Hospital Environment & Hygiene',
      description: 'Rate the cleanliness, facilities, and overall comfort of the clinic environment.',
      icon: <Building className="text-emerald-500" size={20} />
    }
  ];

  const handleRatingChange = (key, val) => {
    setRatings(prev => ({ ...prev, [key]: val }));
    setValidationError('');
  };

  const handleCommentChange = (key, val) => {
    setComments(prev => ({ ...prev, [key]: val }));
  };

  const toggleCommentField = (key) => {
    setShowComments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (ratings.consultation === 0 || ratings.doctor === 0) {
      setValidationError('Please provide ratings for at least the Consultation Experience and Doctor Behavior.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    const payload = {
      appointmentId: appointmentId,
      ratings,
      comments
    };

    try {
      await api.post('/api/appointments/reviews/', payload);
      setIsSubmitted(true);
    } catch (err) {
      setValidationError(err.response?.data?.error || 'An error occurred while submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 text-white rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl space-y-6 my-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
          <CheckCircle size={48} className="text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Thank You!</h2>
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Feedback Submitted Successfully</p>
        </div>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Your feedback is extremely valuable to us. It helps GA Clinic maintain premium medical care standards and improve patient experiences.
        </p>
        <div className="pt-6 border-t border-slate-800/80 max-w-sm mx-auto">
          <p className="text-xs text-slate-500">Appointment ID: <span className="font-mono text-slate-400">{appointmentId}</span></p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl my-8 animate-in fade-in duration-300">
      
      {/* Banner / Header */}
      <div className="relative bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-8 md:p-10 border-b border-slate-800">
        <div className="absolute right-6 top-6 opacity-5 animate-pulse">
          <Heart size={120} className="text-white fill-white" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="animate-pulse" /> Patient Portal
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400 font-medium">Consultation Review</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-3">
          Share Your Experience
        </h1>
        <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
          Please help us evaluate our healthcare delivery. Your response will guide our quality improvement integrations.
        </p>

        {/* Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 mt-8 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Appointment ID</span>
            <span className="text-sm font-mono font-bold text-blue-400">{appointmentId}</span>
          </div>
          {appointment && (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Doctor & Department</span>
                <span className="text-sm font-bold text-white">
                  {appointment.doctor_name || 'Clinic Specialist'} ({appointment.doctor_specialty || 'General'})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Consultation Date</span>
                <span className="text-sm font-bold text-white">
                  {appointment.date} at {appointment.time?.substring(0, 5) || 'N/A'} ({appointment.appointment_type === 'virtual' ? 'Virtual' : 'In-Person'})
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="mx-8 md:mx-10 mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-400 animate-in slide-in-from-top duration-300">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div className="text-xs font-semibold leading-relaxed">
            {validationError}
          </div>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
        
        {/* Rating Categories */}
        <div className="space-y-6">
          {categories.map((cat) => {
            const currentRating = ratings[cat.key];
            const activeHover = hoverRatings[cat.key];
            const displayRating = activeHover || currentRating;
            const ratingLabel = getRatingLabel(displayRating);

            return (
              <div 
                key={cat.key} 
                className="bg-slate-950/40 border border-slate-800/60 p-6 rounded-[2rem] hover:border-slate-800 transition-all space-y-4 group"
              >
                {/* Category Header */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {cat.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      {cat.title} {(cat.key === 'consultation' || cat.key === 'doctor') && <span className="text-rose-500">*</span>}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{cat.description}</p>
                  </div>
                </div>

                {/* Rating Input and Label */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  {/* Stars Row */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(cat.key, star)}
                        onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [cat.key]: star }))}
                        onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [cat.key]: 0 }))}
                        className="p-1.5 rounded-lg hover:bg-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-90"
                      >
                        <Star 
                          size={28} 
                          className={`transition-all duration-150 ${
                            star <= displayRating 
                              ? 'text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_4px_rgba(250,204,21,0.25)] scale-110' 
                              : 'text-slate-700 hover:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Rating Label and Comments Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all duration-200 uppercase tracking-wider ${ratingLabel.color}`}>
                      {ratingLabel.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCommentField(cat.key)}
                      className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                        showComments[cat.key] || comments[cat.key]
                          ? 'text-blue-400 bg-blue-500/5 border-blue-500/20'
                          : 'text-slate-500 bg-transparent border-slate-800 hover:border-slate-700 hover:text-slate-400'
                      }`}
                    >
                      <MessageSquare size={13} />
                      {comments[cat.key] ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                </div>

                {/* Collapsible comment area for specific rating category */}
                {(showComments[cat.key] || comments[cat.key]) && (
                  <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                    <textarea
                      value={comments[cat.key]}
                      onChange={(e) => handleCommentChange(cat.key, e.target.value)}
                      placeholder={`Provide details regarding your ${cat.title.toLowerCase()} (optional)...`}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300 placeholder-slate-600 h-24 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                    />
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* Section 4: General Experience Comment Area */}
        <div className="bg-slate-950/40 border border-slate-800/60 p-6 rounded-[2rem] space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" size={18} />
            <h3 className="font-bold text-white text-sm">Any other suggestions or hospital experience feedback?</h3>
          </div>
          <p className="text-xs text-slate-500">Share any suggestions, ideas, or comments regarding amenities, pharmacy, scheduling, billing, etc.</p>
          <textarea
            value={comments.general}
            onChange={(e) => handleCommentChange('general', e.target.value)}
            placeholder="Share your general experience or recommendations here..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-slate-300 placeholder-slate-600 h-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Fields marked with * are required
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-10 py-4 font-bold rounded-2xl text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
              isSubmitting 
                ? 'bg-blue-600/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/10'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting Feedback...
              </>
            ) : (
              <>
                Submit Review
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
    </div>
  );
};

export default ConsultationReviewForm;

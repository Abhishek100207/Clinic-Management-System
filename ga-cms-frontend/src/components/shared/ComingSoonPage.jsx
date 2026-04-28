import React from 'react';
import { useLocation } from 'react-router-dom';

const ComingSoonPage = () => {
  const location = useLocation();
  
  // Format the path into a readable title
  const pathName = location.pathname
    .replace('/', '')
    .split('/')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center py-20">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">{pathName || 'Section'} - Coming Soon</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          We are actively working on building out this section of the Clinic Management System. Check back later!
        </p>
      </div>
    </div>
  );
};

export default ComingSoonPage;

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { toast } from 'react-toastify';

const PatientRegistrationForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Stub for Week 1
    setTimeout(() => {
      setLoading(false);
      const fakeId = 'PAT-' + Math.floor(Math.random() * 100000);
      toast.success(`Patient registered successfully! ID: ${fakeId}`);
      e.target.reset();
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold tracking-tight text-navy mb-6">Patient Registration</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" name="fullName" required placeholder="John Doe" />
            <Input label="Date of Birth" name="dob" type="date" required />
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-navy" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Mobile Number" name="mobile" required placeholder="+91 9876543210" />
            <Input label="Email Address" type="email" name="email" placeholder="john@example.com" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Medical Baseline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-slate-700">Blood Group</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-navy">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full row-span-2">
              <label className="text-sm font-medium text-slate-700">Known Allergies</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:border-blue-500 h-[104px] text-navy" placeholder="List any known allergies..."></textarea>
            </div>
            <div className="flex flex-col gap-1 w-full row-span-2">
              <label className="text-sm font-medium text-slate-700">Chronic Conditions</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:border-blue-500 h-[104px] text-navy" placeholder="List chronic conditions..."></textarea>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact Name" placeholder="Jane Doe" />
            <Input label="Contact Number" placeholder="+91 9876543211" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Insurance Details (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Provider Name" placeholder="Star Health" />
            <Input label="Policy Number" placeholder="POL12345678" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <Input label="Street Address" placeholder="123 Example Street, Locality" />
            </div>
            <Input label="City" placeholder="Mumbai" />
            <Input label="State" placeholder="Maharashtra" />
            <Input label="Pincode" placeholder="400001" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <div className="w-48">
             <Button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Patient'}
             </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;

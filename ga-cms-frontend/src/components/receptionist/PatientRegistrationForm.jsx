import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { toast } from 'react-toastify';
import apiClient from '../../api/axios';

const PatientRegistrationForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      full_name: formData.get('fullName'),
      date_of_birth: formData.get('dob'),
      gender: formData.get('gender'),
      mobile_number: formData.get('mobile'),
      email: formData.get('email'),
      blood_group: formData.get('bloodGroup'),
      known_allergies: formData.get('allergies'),
      chronic_conditions: formData.get('conditions'),
      emergency_contact_name: formData.get('emergencyName'),
      emergency_contact_number: formData.get('emergencyPhone'),
      insurance_provider: formData.get('insuranceProvider'),
      insurance_policy_number: formData.get('insurancePolicy'),
      street_address: formData.get('street'),
      city: formData.get('city'),
      state: formData.get('state'),
      pincode: formData.get('pincode'),
    };

    try {
      const response = await apiClient.post('/api/users/patients/', data);
      toast.success(`Patient registered successfully! ID: ${response.data.patient_id}`);
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
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
              <select name="gender" className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-navy" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Mobile Number" name="mobile" required placeholder="+91 9876543210" />
            <Input label="Email Address" type="email" name="email" required placeholder="john@example.com" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Medical Baseline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-slate-700">Blood Group</label>
              <select name="bloodGroup" className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-navy">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full row-span-2">
              <label className="text-sm font-medium text-slate-700">Known Allergies</label>
              <textarea name="allergies" className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:border-blue-500 h-[104px] text-navy" placeholder="List any known allergies..."></textarea>
            </div>
            <div className="flex flex-col gap-1 w-full row-span-2">
              <label className="text-sm font-medium text-slate-700">Chronic Conditions</label>
              <textarea name="conditions" className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:border-blue-500 h-[104px] text-navy" placeholder="List chronic conditions..."></textarea>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact Name" name="emergencyName" placeholder="Jane Doe" />
            <Input label="Contact Number" name="emergencyPhone" placeholder="+91 9876543211" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Insurance Details (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Provider Name" name="insuranceProvider" placeholder="Star Health" />
            <Input label="Policy Number" name="insurancePolicy" placeholder="POL12345678" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-navy border-b pb-2 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <Input label="Street Address" name="street" placeholder="123 Example Street, Locality" />
            </div>
            <Input label="City" name="city" placeholder="Mumbai" />
            <Input label="State" name="state" placeholder="Maharashtra" />
            <Input label="Pincode" name="pincode" placeholder="400001" />
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

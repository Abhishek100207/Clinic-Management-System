import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-offwhite p-6">
      <h1 className="text-3xl font-bold text-navy mb-2 tracking-tight">403 - Access Denied</h1>
      <p className="text-slate-600 mb-8 text-center max-w-md">
        You do not have the required permissions to view this secure area. Contact your administrator if you believe this is an error.
      </p>
      <div className="w-48">
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

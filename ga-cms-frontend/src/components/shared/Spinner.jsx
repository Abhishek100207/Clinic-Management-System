import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 16, md: 24, lg: 32, xl: 48 };
  return <Loader2 className={`animate-spin text-blue-600 ${className}`} size={sizes[size] || sizes.md} />;
};

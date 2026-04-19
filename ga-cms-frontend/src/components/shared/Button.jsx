import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "w-full flex justify-center py-2 px-4 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Custom button radius of 6px according to spec
  const radius = "rounded-[6px]";
  
  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 border border-transparent",
    secondary: "text-navy bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border border-transparent"
  };

  return (
    <button className={`${baseStyle} ${radius} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

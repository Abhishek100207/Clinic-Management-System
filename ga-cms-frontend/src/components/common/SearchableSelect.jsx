import React from 'react';
import Select from 'react-select';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  className,
  icon: Icon,
  isClearable = true,
  isLoading = false,
  disabled = false
}) => {
  
  // Custom styles to match the clinic app's sleek aesthetic
  const customStyles = {
    control: (base, state) => ({
      ...base,
      padding: '1px 0',
      paddingLeft: Icon ? '32px' : '0px',
      borderRadius: '0.75rem', // rounded-xl
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb', // blue-500 or gray-200
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' // blue-500 or gray-300
      },
      fontSize: '0.875rem', // text-sm
      fontWeight: '500', // font-medium to match input
      backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
      minHeight: '44px' // similar to py-2.5 standard inputs
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      fontSize: '0.875rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#3b82f6',
        color: 'white'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      zIndex: 50,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      marginTop: '4px'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af', // text-gray-400
      fontWeight: '400'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#374151' // text-gray-700
    }),
    indicatorSeparator: () => ({
      display: 'none'
    })
  };

  // Find the selected option object from value string/number
  const selectedOption = options.find(opt => opt.value === value || opt.value === Number(value) || opt.value === String(value)) || null;

  return (
    <div className={`relative ${className || ''}`}>
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : '')}
        placeholder={placeholder}
        styles={customStyles}
        isClearable={isClearable}
        isSearchable={true}
        isLoading={isLoading}
        isDisabled={disabled}
      />
    </div>
  );
};

export default SearchableSelect;

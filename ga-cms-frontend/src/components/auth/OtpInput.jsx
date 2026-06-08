import React, { useRef } from 'react';

const OtpInput = ({ value, onChange }) => {
  const refs = useRef([]);

  const handleChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = value.split('');
    next[i] = val;
    onChange(next.join(''));
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (e, i) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted.padEnd(6, '')); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(e.target.value, i)}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          className={`w-11 text-center text-lg font-black rounded-xl border-2 outline-none transition-all duration-200 text-white`}
          style={{
            height: '52px',
            background: value[i] ? 'rgba(29,78,216,0.3)' : 'rgba(0,0,0,0.3)',
            borderColor: value[i] ? '#3b82f6' : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
};

export default OtpInput;

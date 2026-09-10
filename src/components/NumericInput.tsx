'use client';

import React, { useState, useEffect } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (val: number) => void;
}

export default function NumericInput({ value, onChange, className, ...props }: NumericInputProps) {
  const [valStr, setValStr] = useState<string>(value === 0 ? '' : value.toString());

  useEffect(() => {
    const parsed = parseFloat(valStr);
    if (isNaN(parsed)) {
      if (value !== 0) {
        setValStr(value.toString());
      }
    } else if (parsed !== value) {
      setValStr(value === 0 ? '' : value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, up to one decimal point, or empty string
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setValStr(raw);
      const parsed = parseFloat(raw);
      onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={valStr}
      onChange={handleChange}
      className={className}
    />
  );
}

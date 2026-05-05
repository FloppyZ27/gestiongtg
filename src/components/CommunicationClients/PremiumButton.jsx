import React from 'react';
import { Plus } from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg, #8B0000, #CC5500)';

const BUTTON_BASE = {
  background: '#1a1a1a',
  color: 'white',
  border: '1px solid rgba(139, 0, 0, 0.5)',
  borderRadius: '0.5rem',
  padding: '0 1.25rem',
  height: '44px',
  fontWeight: 600,
  fontSize: '15px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
};

export default function PremiumButton({ label, onClick }) {
  const buttonRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      buttonRef.current.style.background = GRADIENT;
      buttonRef.current.style.opacity = '1';
      buttonRef.current.style.border = 'none';
      buttonRef.current.style.boxShadow = '0 6px 22px rgba(139, 0, 0, 0.55)';
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      buttonRef.current.style.background = '#1a1a1a';
      buttonRef.current.style.border = '1px solid rgba(139, 0, 0, 0.5)';
      buttonRef.current.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.3)';
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      data-custom-hover
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={BUTTON_BASE}
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
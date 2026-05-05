import React from 'react';
import { Plus } from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg, #8B0000, #CC5500)';

const BUTTON_STYLE = {
  background: GRADIENT,
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  padding: '0 1.25rem',
  height: '44px',
  fontWeight: 600,
  fontSize: '15px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  boxShadow: '0 4px 14px rgba(139, 0, 0, 0.3)',
};

export default function PremiumButton({ label, onClick }) {
  const buttonRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      buttonRef.current.style.boxShadow = '0 8px 24px rgba(139, 0, 0, 0.5)';
      buttonRef.current.style.transform = 'scale(1.02)';
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      buttonRef.current.style.boxShadow = '0 4px 14px rgba(139, 0, 0, 0.3)';
      buttonRef.current.style.transform = 'scale(1)';
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      data-custom-hover
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={BUTTON_STYLE}
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
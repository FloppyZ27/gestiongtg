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
  outline: 'none',
};

const resetToBase = (el) => {
  if (!el) return;
  el.style.setProperty('background', '#1a1a1a', 'important');
  el.style.setProperty('background-color', '#1a1a1a', 'important');
  el.style.setProperty('border', '1px solid rgba(139, 0, 0, 0.5)', 'important');
  el.style.setProperty('box-shadow', '0 4px 14px rgba(0, 0, 0, 0.3)', 'important');
  el.style.setProperty('filter', 'none', 'important');
  el.style.setProperty('opacity', '1', 'important');
};

export default function PremiumButton({ label, onClick }) {
  const buttonRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      buttonRef.current.style.setProperty('background', GRADIENT, 'important');
      buttonRef.current.style.setProperty('background-color', 'transparent', 'important');
      buttonRef.current.style.setProperty('opacity', '1', 'important');
      buttonRef.current.style.setProperty('filter', 'none', 'important');
      buttonRef.current.style.setProperty('border', 'none', 'important');
      buttonRef.current.style.setProperty('box-shadow', '0 6px 22px rgba(139, 0, 0, 0.55)', 'important');
    }
  };

  const handleMouseLeave = () => {
    resetToBase(buttonRef.current);
  };

  const handleMouseUp = () => {
    resetToBase(buttonRef.current);
  };

  const handleBlur = () => {
    resetToBase(buttonRef.current);
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      data-custom-hover
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onBlur={handleBlur}
      style={BUTTON_BASE}
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
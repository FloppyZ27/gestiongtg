import React from 'react';
import { Plus } from 'lucide-react';

const BUTTON_BASE_STYLE = {
  background: '#1a1a1a',
  backgroundImage: 'none',
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
  transition: 'background 0.25s ease, background-image 0.25s ease, box-shadow 0.25s ease, border 0.25s ease',
  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
};

const BUTTON_HOVER_STYLE = {
  background: 'none',
  backgroundImage: 'linear-gradient(135deg, #8B0000, #CC5500)',
  backgroundColor: 'transparent',
  boxShadow: '0 6px 22px rgba(139,0,0,0.55)',
};

export default function PremiumButton({ label, onClick }) {
  const buttonRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      Object.entries(BUTTON_HOVER_STYLE).forEach(([key, value]) => {
        buttonRef.current.style.setProperty(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value, 'important');
      });
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      Object.entries(BUTTON_BASE_STYLE).forEach(([key, value]) => {
        buttonRef.current.style.setProperty(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value, 'important');
      });
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      data-custom-hover
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={BUTTON_BASE_STYLE}
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
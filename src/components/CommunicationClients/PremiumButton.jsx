import React from 'react';
import { Plus } from 'lucide-react';

const isLightMode = () => document.documentElement.classList.contains('light');

const BUTTON_SHARED = {
  borderRadius: '0.5rem',
  padding: '0 1.25rem',
  height: '44px',
  fontWeight: 600,
  fontSize: '15px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
  outline: 'none',
};

const getButtonBase = () => isLightMode()
  ? { ...BUTTON_SHARED, background: 'rgba(200, 45, 45, 0.06)', color: 'hsl(220, 15%, 15%)', border: '1px solid rgba(200, 45, 45, 0.22)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }
  : { ...BUTTON_SHARED, background: '#1a1a1a', color: 'white', border: '1px solid rgba(139, 0, 0, 0.5)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' };

const resetToBase = (el, borderColor = 'rgba(139, 0, 0, 0.5)') => {
  if (!el) return;
  if (isLightMode()) {
    el.style.setProperty('background', 'rgba(200, 45, 45, 0.06)', 'important');
    el.style.setProperty('color', 'hsl(220, 15%, 15%)', 'important');
    el.style.setProperty('border', '1px solid rgba(200, 45, 45, 0.22)', 'important');
    el.style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.07)', 'important');
  } else {
    el.style.setProperty('background', '#1a1a1a', 'important');
    el.style.setProperty('color', 'white', 'important');
    el.style.setProperty('border', `1px solid ${borderColor}`, 'important');
    el.style.setProperty('box-shadow', '0 4px 14px rgba(0,0,0,0.3)', 'important');
  }
  el.style.setProperty('filter', 'none', 'important');
  el.style.setProperty('opacity', '1', 'important');
};

export default function PremiumButton({ label, onClick, icon: Icon = Plus, variant = 'default' }) {
  const buttonRef = React.useRef(null);
  
  const gradients = {
    default: 'linear-gradient(135deg, #8B0000, #CC5500)',
    orange: 'linear-gradient(135deg, #F59E0B, #EA8C00)'
  };
  
  const borderColors = {
    default: 'rgba(139, 0, 0, 0.5)',
    orange: 'rgba(245, 158, 11, 0.5)'
  };
  
  const shadowColors = {
    default: 'rgba(139, 0, 0, 0.55)',
    orange: 'rgba(245, 158, 11, 0.55)'
  };
  
  const currentGradient = gradients[variant] || gradients.default;
  const currentBorderColor = borderColors[variant] || borderColors.default;
  const currentShadowColor = shadowColors[variant] || shadowColors.default;

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      buttonRef.current.style.setProperty('background', currentGradient, 'important');
      buttonRef.current.style.setProperty('background-color', 'transparent', 'important');
      buttonRef.current.style.setProperty('opacity', '1', 'important');
      buttonRef.current.style.setProperty('filter', 'none', 'important');
      buttonRef.current.style.setProperty('border', 'none', 'important');
      buttonRef.current.style.setProperty('box-shadow', `0 6px 22px ${currentShadowColor}`, 'important');
      buttonRef.current.style.setProperty('color', 'white', 'important');
    }
  };

  const handleMouseLeave = () => {
    resetToBase(buttonRef.current, currentBorderColor);
  };

  const handleMouseUp = () => {
    resetToBase(buttonRef.current, currentBorderColor);
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
      style={getButtonBase()}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
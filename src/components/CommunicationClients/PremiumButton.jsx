import React from 'react';
import { Plus } from 'lucide-react';

const getButtonStyles = (variant = 'default') => {
  const baseStyles = {
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
    backgroundImage: 'none',
    color: 'white',
  };

  const variants = {
    default: {
      base: {
        ...baseStyles,
        background: '#2a2a2a',
        border: '1px solid rgba(139, 0, 0, 0.6)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      },
      hover: {
        background: 'none',
        backgroundImage: 'linear-gradient(135deg, #8B0000, #CC5500)',
        backgroundColor: 'transparent',
        boxShadow: '0 6px 22px rgba(139,0,0,0.55)',
      },
    },
    blue: {
      base: {
        ...baseStyles,
        background: '#1f2942',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      },
      hover: {
        background: 'none',
        backgroundImage: 'linear-gradient(135deg, #8B0000, #CC5500)',
        backgroundColor: 'transparent',
        boxShadow: '0 6px 22px rgba(139,0,0,0.55)',
      },
    },
  };

  return variants[variant] || variants.default;
};

export default function PremiumButton({ label, onClick, variant = 'default' }) {
  const buttonRef = React.useRef(null);
  const styles = getButtonStyles(variant);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      Object.entries(styles.hover).forEach(([key, value]) => {
        buttonRef.current.style.setProperty(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value, 'important');
      });
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      Object.entries(styles.base).forEach(([key, value]) => {
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
      style={styles.base}
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
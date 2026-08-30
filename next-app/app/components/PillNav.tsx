import React, { useState } from 'react';
import './PillNav.css';

export interface PillNavItem {
  label: string;
  href: string;
}

export interface PillNavProps {
  logo?: string;
  logoAlt?: string;
  items?: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  theme?: 'light' | 'dark';
  initialLoadAnimation?: boolean;
}

export default function PillNav({
  logo,
  logoAlt = 'Logo',
  items = [
    { label: 'Auditoría Nuclear', href: '/diagnostico' }
  ],
  activeHref = '/',
  className = '',
  baseColor = '#ffffff',
  pillColor = '#c3f400',
  hoveredPillTextColor = '#000000',
  pillTextColor = '#000000',
  theme = 'light'
}: PillNavProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <nav className={`pill-nav-container ${className} ${theme}`}>
      {logo && (
        <a href="/" className="pill-nav-logo">
          <img src={logo} alt={logoAlt} />
        </a>
      )}
      <div className="pill-nav-items">
        {items.map((item, idx) => {
          const isHovered = hoveredIdx === idx;

          return (
            <a
              key={idx}
              href={item.href}
              className="pill-nav-item"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                backgroundColor: isHovered ? pillColor : baseColor,
                color: isHovered ? hoveredPillTextColor : pillTextColor,
                borderColor: isHovered ? pillColor : 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <span className="pill-dot" />
              <span className="pill-label">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

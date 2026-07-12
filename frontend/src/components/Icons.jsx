import React from 'react';

export const Icon = {
  Truck: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1.5" y="7" width="12.5" height="9" rx="1"/>
      <path d="M14 10.5h4.2L21 13.6V16h-3"/>
      <path d="M14 16H1.5"/>
      <circle cx="6" cy="18.2" r="1.8"/>
      <circle cx="17" cy="18.2" r="1.8"/>
    </svg>
  ),
  Check: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M8 12.3l2.6 2.6L16.2 9"/>
    </svg>
  ),
  Wrench: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15.5 5.5a4 4 0 0 0-5.4 4.5L3 17.1V21h3.9l7-7.1a4 4 0 0 0 4.5-5.4l-2.9 2.9-2.6-.6-.6-2.6z"/>
    </svg>
  ),
  Route: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="6" r="2.2"/>
      <circle cx="19" cy="18" r="2.2"/>
      <path d="M5 8.2v3.6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v.2"/>
    </svg>
  ),
  Users: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3.2"/>
      <path d="M2.8 19c.6-3.4 3.1-5.4 6.2-5.4s5.6 2 6.2 5.4"/>
      <circle cx="17.5" cy="7.5" r="2.4"/>
      <path d="M15.2 13.2c2.4.2 4.2 2 4.7 4.7"/>
    </svg>
  ),
  Gauge: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 16a8.5 8.5 0 1 1 17 0"/>
      <path d="M12 16l4-5.4"/>
      <path d="M12 16.2v.1"/>
    </svg>
  ),
  Search: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5"/>
      <path d="M20 20l-4.8-4.8"/>
    </svg>
  ),
  Plus: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  X: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  Chevron: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  Alert: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5L21.5 20h-19L12 3.5z"/>
      <path d="M12 10v4.3M12 17.2v.1"/>
    </svg>
  ),
  Pin: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/>
      <circle cx="12" cy="9.4" r="2.4"/>
    </svg>
  ),
  Dash: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.2"/>
      <rect x="13.5" y="3" width="7.5" height="11.5" rx="1.2"/>
      <rect x="3" y="13" width="7.5" height="8" rx="1.2"/>
      <rect x="13.5" y="17" width="7.5" height="4" rx="1.2"/>
    </svg>
  ),
  IdCard: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="1.6"/>
      <circle cx="8" cy="12" r="2.1"/>
      <path d="M5.3 16.2c.5-1.6 1.6-2.4 2.7-2.4s2.2.8 2.7 2.4"/>
      <path d="M14 9.5h4M14 12.5h4M14 15.5h2.5"/>
    </svg>
  ),
  Shield: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l7 3v5.2c0 4.6-3 7.9-7 9.8-4-1.9-7-5.2-7-9.8V6l7-3z"/>
      <path d="M9 12l2.2 2.2L15.3 10"/>
    </svg>
  ),
  Filter: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 5h17M6.5 12h11M10 19h4"/>
    </svg>
  ),
  Menu: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16"/>
    </svg>
  ),
  Fuel: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/>
      <path d="M3 21h12M9 3v2M15 7l3 3v7a2 2 0 0 1-2 2"/>
      <path d="M15 14h2"/>
    </svg>
  ),
  Rupee: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h12M6 8h12M15 21 9 8"/>
      <path d="M6 13h5a4 4 0 0 0 0-8"/>
    </svg>
  ),
  Receipt: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/>
      <path d="M8 9h8M8 13h6"/>
    </svg>
  ),
};

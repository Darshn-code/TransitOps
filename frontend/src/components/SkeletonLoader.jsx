import React from 'react';

export default function SkeletonLoader({ type = 'table', rows = 5, cols = 5 }) {
  // Styles for the skeleton loading animation
  const animationStyle = {
    animation: 'shimmer 1.5s infinite linear',
    background: 'linear-gradient(to right, #e0d0b8 4%, #f0e4d3 25%, #e0d0b8 36%)',
    backgroundSize: '1000px 100%',
    display: 'inline-block',
    height: '16px',
    borderRadius: '4px',
    width: '100%'
  };

  const tableHeaderStyle = {
    ...animationStyle,
    height: '14px',
    background: 'linear-gradient(to right, #cfbfab 4%, #dfd2bf 25%, #cfbfab 36%)',
    backgroundSize: '1000px 100%',
  };

  if (type === 'table') {
    return (
      <div className="table-wrap" style={{ position: 'relative' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}} />
        <table>
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} style={{ padding: '10px 14px' }}>
                  <div style={{ ...tableHeaderStyle, width: `${Math.random() * 40 + 40}%` }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} style={{ padding: '13px 14px' }}>
                    <div style={{ ...animationStyle, width: `${Math.random() * 50 + 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="stats-grid" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}} />
        {Array.from({ length: rows }).map((_, i) => (
          <div className="stat-card" key={i} style={{ minHeight: '140px' }}>
            <div style={{ ...animationStyle, height: '24px', width: '40px', marginBottom: '16px' }} />
            <div style={{ ...animationStyle, height: '32px', width: '60%', marginBottom: '12px' }} />
            <div style={{ ...animationStyle, height: '14px', width: '80%' }} />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

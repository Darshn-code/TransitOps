import React from 'react';

export default function Avatar({ name }) {
  const initials = name
    ? name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const palette = ["#EE3A2E", "#F0A428", "#1A1A1A"];
  const idx = name ? name.length % palette.length : 0;
  return (
    <span className="avatar" style={{ background: palette[idx] }}>
      {initials}
    </span>
  );
}

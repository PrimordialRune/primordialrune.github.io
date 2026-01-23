"use client";

// Astroid (Four-cusped hypocycloid) sparkle component
export function AstroidSparkle({ 
  size = 8, 
  color = "var(--gold)", 
  opacity = 1 
}: { 
  size?: number; 
  color?: string; 
  opacity?: number;
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      style={{ opacity }}
    >
      <path
        d="M50 0 C50 25, 75 50, 100 50 C75 50, 50 75, 50 100 C50 75, 25 50, 0 50 C25 50, 50 25, 50 0"
        fill={color}
      />
    </svg>
  );
}

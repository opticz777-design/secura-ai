import React from 'react';

interface AnonymousPatientAvatarProps {
  className?: string;
}

export function AnonymousPatientAvatar({ className = '' }: AnonymousPatientAvatarProps) {
  return (
    <div className={`bg-[#E8EDF2] border-[3px] border-[#F4F7F9] rounded-full shrink-0 overflow-hidden flex items-end justify-center ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full text-[#9BAFC3]" 
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="38" r="17" />
        <ellipse cx="50" cy="96" rx="36" ry="36" />
      </svg>
    </div>
  );
}

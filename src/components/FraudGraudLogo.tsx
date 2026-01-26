// FraudGraud Logo Component - FraudNet-inspired design
import { cn } from '@/lib/utils';

interface FraudGraudLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FraudGraudLogo({ className, iconOnly = false, size = 'md' }: FraudGraudLogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', gap: 'gap-2' },
    md: { icon: 'w-10 h-10', text: 'text-xl', gap: 'gap-3' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', gap: 'gap-4' },
  };

  const { icon: iconSize, text: textSize, gap } = sizeClasses[size];

  return (
    <div className={cn('flex items-center', gap, className)}>
      {/* Icon Mark - 9 rounded square tiles forming abstract network grid */}
      <div className={cn('relative', iconSize)}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="fraudgraud-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          {/* Top row */}
          <rect x="2" y="2" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.9" />
          <rect x="15" y="2" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.7" />
          <rect x="28" y="2" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.5" />
          {/* Middle row */}
          <rect x="2" y="15" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.6" />
          <rect x="15" y="15" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="1" />
          <rect x="28" y="15" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.8" />
          {/* Bottom row */}
          <rect x="2" y="28" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.4" />
          <rect x="15" y="28" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.6" />
          <rect x="28" y="28" width="10" height="10" rx="2.5" fill="url(#fraudgraud-gradient)" opacity="0.9" />
          {/* Connection lines */}
          <path d="M12 7 L15 7" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M25 7 L28 7" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M7 12 L7 15" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M20 12 L20 15" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M33 12 L33 15" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M12 20 L15 20" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M25 20 L28 20" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M7 25 L7 28" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M20 25 L20 28" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M33 25 L33 28" stroke="url(#fraudgraud-gradient)" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
      
      {/* Wordmark */}
      {!iconOnly && (
        <span className={cn('font-bold text-white tracking-tight', textSize)}>
          FraudGraud
          <span className="text-cyan-400">.</span>
        </span>
      )}
    </div>
  );
}

export function FraudGraudLogoIcon({ className }: { className?: string }) {
  return <FraudGraudLogo iconOnly size="sm" className={className} />;
}

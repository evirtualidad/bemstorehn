
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex-grow flex items-center justify-center", className)}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

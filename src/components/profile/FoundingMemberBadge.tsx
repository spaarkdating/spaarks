import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FoundingMemberBadgeProps {
  orderNumber?: number;
  className?: string;
  showTooltip?: boolean;
}

export const FoundingMemberBadge = ({ orderNumber, className = '', showTooltip = true }: FoundingMemberBadgeProps) => {
  const badge = (
    <Badge 
      className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      Founding Member {orderNumber ? `#${orderNumber}` : ''}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Founding Member Benefits</p>
          <ul className="text-xs mt-1 space-y-1">
            <li>• 20% bonus on all plan limits</li>
            <li>• Price locked forever</li>
            <li>• Exclusive badge on profile</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

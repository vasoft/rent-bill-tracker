import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconBgClass?: string;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className,
  iconBgClass = "bg-primary/10 text-primary"
}: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-destructive';
    if (trend.value < 0) return 'text-success';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn("utility-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

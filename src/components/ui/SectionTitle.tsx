import { cn } from '@/lib/utils';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionTitle({
  title,
  subtitle,
  align = 'center',
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'space-y-2',
        {
          'text-center': align === 'center',
          'text-left': align === 'left',
        },
        className
      )}
    >
      <h2 className="font-headline text-3xl font-bold tracking-tight text-text-main md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto max-w-2xl text-lg text-text-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}

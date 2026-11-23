interface CompanyLogoProps {
  code: string;
  color: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CompanyLogo({ code, color, name, size = 'md' }: CompanyLogoProps) {
  const sizeClass =
    size === 'sm'
      ? 'h-9 w-9 text-xs rounded-lg'
      : size === 'lg'
        ? 'h-14 w-14 text-base rounded-xl'
        : 'h-11 w-11 text-sm rounded-xl';

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center font-display font-bold tracking-tight text-white shadow-xs`}
      style={{ backgroundColor: color || '#0F172A' }}
      aria-label={`Logo ${name}`}
    >
      {code.slice(0, 2).toUpperCase()}
    </div>
  );
}

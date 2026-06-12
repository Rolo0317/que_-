interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <img
      src="/logo-que-plus.svg"
      alt="QUE+"
      className={`h-auto w-32 select-none ${className}`}
      draggable={false}
    />
  );
}

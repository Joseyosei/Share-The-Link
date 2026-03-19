import logoSvg from "@/assets/logo.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
  showBeta?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-12 h-12",
};

export const Logo = ({ 
  className = "", 
  size = "md", 
  showText = true,
  textClassName = "",
  showBeta = true
}: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSvg} 
        alt="Share The Link Logo" 
        className={sizeClasses[size]}
      />
      {showText && (
        <span className={`text-lg font-bold ${textClassName}`}>
          Share The Link
        </span>
      )}
      {showBeta && (
        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground rounded-full border border-border">
          Beta
        </span>
      )}
    </div>
  );
};

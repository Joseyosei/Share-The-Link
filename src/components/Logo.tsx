import { forwardRef } from "react";
import logoSvg from "@/assets/logo.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-12 h-12",
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({ 
  className = "", 
  size = "md", 
  showText = true,
  textClassName = ""
}, ref) => {
  return (
    <div ref={ref} className={`flex items-center gap-2 ${className}`}>
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
    </div>
  );
});

Logo.displayName = "Logo";

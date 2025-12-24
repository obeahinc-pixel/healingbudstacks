import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CannabisLeafMotifProps {
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
  delay?: number;
}

// Individual cannabis leaf SVG
export const CannabisLeaf = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 100 120" 
    className={className}
    style={style}
    fill="none"
    stroke="currentColor"
    strokeWidth="0.5"
  >
    {/* Central stem */}
    <path d="M50 120 L50 60" />
    {/* Central leaf */}
    <path d="M50 60 Q50 30 50 10 Q45 25 40 40 Q42 50 50 60 Q58 50 60 40 Q55 25 50 10" />
    {/* Left leaves */}
    <path d="M50 70 Q35 60 20 45 Q30 55 40 65 Q45 68 50 70" />
    <path d="M50 80 Q30 75 10 65 Q25 72 40 78 Q45 80 50 80" />
    <path d="M50 55 Q40 45 25 35 Q35 42 45 52 Q48 54 50 55" />
    {/* Right leaves */}
    <path d="M50 70 Q65 60 80 45 Q70 55 60 65 Q55 68 50 70" />
    <path d="M50 80 Q70 75 90 65 Q75 72 60 78 Q55 80 50 80" />
    <path d="M50 55 Q60 45 75 35 Q65 42 55 52 Q52 54 50 55" />
  </svg>
);

// Animated wrapper for single leaf
export const AnimatedLeaf = ({ 
  className, 
  style, 
  delay = 0 
}: CannabisLeafMotifProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1.2, delay }}
  >
    <CannabisLeaf className={className} style={style} />
  </motion.div>
);

// Preset scattered layout for sections
interface ScatteredMotifProps {
  variant?: 'default' | 'sparse' | 'dense';
  colorClass?: string;
}

export const ScatteredCannabisMotifs = ({ 
  variant = 'default',
  colorClass = 'text-primary-foreground/[0.06] dark:text-foreground/[0.05]'
}: ScatteredMotifProps) => {
  const opacityMap = {
    sparse: { main: '[0.04]', secondary: '[0.03]' },
    default: { main: '[0.06]', secondary: '[0.04]' },
    dense: { main: '[0.08]', secondary: '[0.06]' },
  };

  const opacity = opacityMap[variant];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Top left large leaf */}
      <motion.div
        className="absolute -top-8 -left-8"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <CannabisLeaf 
          className={cn("w-48 h-56 rotate-[-25deg]", colorClass.replace('[0.06]', opacity.main))} 
        />
      </motion.div>
      
      {/* Bottom left medium leaf */}
      <motion.div
        className="absolute bottom-16 left-12 sm:left-24"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        <CannabisLeaf 
          className={cn("w-32 h-40 rotate-[15deg]", colorClass.replace('[0.06]', opacity.secondary))} 
        />
      </motion.div>
      
      {/* Center background large leaf */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.1 }}
      >
        <CannabisLeaf 
          className={cn("w-64 h-72 rotate-[5deg]", colorClass.replace('[0.06]', '[0.03]'))} 
        />
      </motion.div>
      
      {/* Right side medium leaf */}
      <motion.div
        className="absolute top-20 right-8 sm:right-16"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <CannabisLeaf 
          className={cn("w-36 h-44 rotate-[35deg]", colorClass.replace('[0.06]', opacity.main))} 
        />
      </motion.div>
      
      {/* Bottom right leaf */}
      <motion.div
        className="absolute -bottom-4 right-4 sm:right-20"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        <CannabisLeaf 
          className={cn("w-40 h-48 rotate-[-10deg]", colorClass.replace('[0.06]', opacity.secondary))} 
        />
      </motion.div>
    </div>
  );
};

export default CannabisLeaf;

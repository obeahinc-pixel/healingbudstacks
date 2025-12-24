import { Sprout, Users, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  {
    icon: Sprout,
    title: "Superior Quality",
    description: "Every stage from cultivation through extraction to final production is meticulously managed with unwavering attention to detail. Our EU GMP-certified products meet the highest international standards, earning trust across borders.",
  },
  {
    icon: Users,
    title: "Expanding Access",
    description: "Our mission is to ensure medical cannabis reaches those who need it most. Through evidence-based advocacy and education, we are reducing barriers, challenging misconceptions, and creating pathways to safe, legal access.",
  },
  {
    icon: FlaskConical,
    title: "Research-Driven Innovation",
    description: "Collaborating with world-class research institutions including Imperial College London and University of Pennsylvania, we advance scientific knowledge of cannabis therapeutics. Research excellence is the foundation of everything we pursue.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
};

// Cannabis leaf SVG path for decorative motifs
const CannabisLeafMotif = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
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

const ValueProps = () => {
  return (
    <div className="px-2">
      <motion.section 
        className="py-16 sm:py-20 md:py-24 rounded-2xl sm:rounded-3xl relative overflow-hidden bg-primary dark:bg-secondary"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        {/* Scattered cannabis leaf motifs - matching reference design */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Top left large leaf */}
          <motion.div
            className="absolute -top-8 -left-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            <CannabisLeafMotif 
              className="w-48 h-56 text-primary-foreground/[0.08] dark:text-foreground/[0.06] rotate-[-25deg]" 
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
            <CannabisLeafMotif 
              className="w-32 h-40 text-primary-foreground/[0.06] dark:text-foreground/[0.05] rotate-[15deg]" 
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
            <CannabisLeafMotif 
              className="w-64 h-72 text-primary-foreground/[0.04] dark:text-foreground/[0.03] rotate-[5deg]" 
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
            <CannabisLeafMotif 
              className="w-36 h-44 text-primary-foreground/[0.07] dark:text-foreground/[0.05] rotate-[35deg]" 
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
            <CannabisLeafMotif 
              className="w-40 h-48 text-primary-foreground/[0.06] dark:text-foreground/[0.04] rotate-[-10deg]" 
            />
          </motion.div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="text-center mb-14 sm:mb-18" variants={headerVariants}>
            <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-semibold text-primary-foreground mb-4 px-4" style={{ letterSpacing: '-0.02em', lineHeight: '1.2' }}>
              Growing more than medicine
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12 md:gap-16">
            {values.map((value, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                variants={cardVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <motion.div 
                  className="flex justify-center mb-7"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-primary-foreground/10 dark:bg-foreground/10 group-hover:bg-primary-foreground/15 dark:group-hover:bg-foreground/15 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-foreground/10">
                    <value.icon className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
                  </div>
                </motion.div>
                <h3 className="font-jakarta text-xl sm:text-2xl font-semibold text-primary-foreground mb-4 tracking-tight">
                  {value.title}
                </h3>
                <p className="font-jakarta text-primary-foreground/75 leading-relaxed text-sm sm:text-base">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default ValueProps;

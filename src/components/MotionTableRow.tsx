import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function MotionTableRow({
  index = 0,
  className,
  ...props
}: React.ComponentProps<typeof motion.tr> & { index?: number }) {
  return (
    <motion.tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/60 data-[state=selected]:bg-muted",
        className,
      )}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
      {...props}
    />
  );
}

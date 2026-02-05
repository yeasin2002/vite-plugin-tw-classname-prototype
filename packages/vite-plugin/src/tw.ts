/**
 * Tailwind CSS responsive breakpoints
 */
export type ResponsiveBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Responsive classes object mapping breakpoints to class strings
 */
export type ResponsiveClasses = Partial<Record<ResponsiveBreakpoint, string>>;

/**
 * Transform responsive Tailwind CSS utilities into cleaner, breakpoint-grouped syntax.
 *
 * This function is compiled away at build time by the Vite plugin, resulting in zero runtime overhead.
 *
 * @param baseClasses - Base CSS classes applied at all breakpoints
 * @param responsiveClasses - Optional object mapping breakpoints to responsive classes
 * @returns Compiled class string (at build time)
 *
 * @example
 * ```typescript
 * // Basic responsive classes
 * tw("text-base", { md: "text-lg", lg: "text-xl" })
 * // Compiles to: "text-base md:text-lg lg:text-xl"
 *
 * // Multiple classes per breakpoint
 * tw("flex items-center", {
 *   md: "justify-between gap-4",
 *   lg: "gap-6 p-8"
 * })
 * // Compiles to: "flex items-center md:justify-between md:gap-4 lg:gap-6 lg:p-8"
 *
 * // Only base classes
 * tw("bg-blue-500 text-white")
 * // Compiles to: "bg-blue-500 text-white"
 * ```
 */
export function tw(
  baseClasses: string,
  responsiveClasses?: ResponsiveClasses,
): string {
  // This function is replaced at build time by the Vite plugin
  // If you see this error, make sure the Vite plugin is properly configured

  // Use parameters to avoid unused variable warnings
  const _ = { baseClasses, responsiveClasses };
  void _;

  throw new Error(
    "tw() must be transformed by @repo/vite-plugin. " +
      "Please ensure the plugin is added to your vite.config.ts",
  );
}

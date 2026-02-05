/**
 * Plugin configuration options
 */
export interface TwClassnameOptions {
  /**
   * Include patterns for files to transform
   * @default /\.[jt]sx?$/
   */
  include?: string | RegExp | (string | RegExp)[];

  /**
   * Exclude patterns for files to skip
   * @default /node_modules/
   */
  exclude?: string | RegExp | (string | RegExp)[];

  /**
   * Custom breakpoints to support
   * @default ['sm', 'md', 'lg', 'xl', '2xl']
   */
  breakpoints?: string[];

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Default Tailwind CSS breakpoints
 */
export const DEFAULT_BREAKPOINTS = ["sm", "md", "lg", "xl", "2xl"] as const;

/**
 * Responsive classes object type
 */
export type ResponsiveClasses = Record<string, string>;

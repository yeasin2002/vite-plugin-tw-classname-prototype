/**
 * Extract string value from a string literal or template literal node
 */
export function extractStringLiteral(node: any): string | null {
  if (!node) return null;

  // Handle StringLiteral
  if (node.type === "StringLiteral") {
    return node.value;
  }

  // Handle TemplateLiteral (only if no expressions)
  if (node.type === "TemplateLiteral") {
    if (node.expressions.length === 0 && node.quasis.length === 1) {
      return node.quasis[0].value.raw;
    }
  }

  return null;
}

/**
 * Extract object properties from an ObjectExpression node
 */
export function extractObjectExpression(node: any): Record<string, string> {
  const result: Record<string, string> = {};

  if (!node || node.type !== "ObjectExpression") {
    return result;
  }

  for (const prop of node.properties) {
    // Only handle ObjectProperty (not SpreadElement)
    if (prop.type !== "ObjectProperty") continue;

    // Key must be an Identifier
    if (prop.key.type !== "Identifier") continue;

    // Value must be a StringLiteral
    const value = extractStringLiteral(prop.value);
    if (value !== null) {
      result[prop.key.name] = value;
    }
  }

  return result;
}

/**
 * Build the final class string from base classes and responsive object
 */
export function buildClassString(
  baseClasses: string,
  responsiveObj: Record<string, string>,
  breakpoints: string[],
): string {
  const parts: string[] = [baseClasses.trim()];

  // Add responsive classes with breakpoint prefixes
  for (const [breakpoint, classes] of Object.entries(responsiveObj)) {
    // Validate breakpoint
    if (!breakpoints.includes(breakpoint)) {
      console.warn(
        `[tw-classname] Unknown breakpoint '${breakpoint}'. Valid breakpoints: ${breakpoints.join(", ")}`,
      );
      continue;
    }

    // Skip empty class strings
    if (!classes.trim()) {
      continue;
    }

    // Prefix each class with the breakpoint
    const prefixed = classes
      .trim()
      .split(/\s+/)
      .map((cls) => `${breakpoint}:${cls}`)
      .join(" ");

    parts.push(prefixed);
  }

  return parts.join(" ");
}

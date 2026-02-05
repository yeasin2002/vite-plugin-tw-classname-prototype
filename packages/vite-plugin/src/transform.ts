import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import MagicString from "magic-string";
import {
  buildClassString,
  extractObjectExpression,
  extractStringLiteral,
} from "./parser";

/**
 * Transform result type
 */
export interface TransformResult {
  code: string;
  map: any;
}

/**
 * Plugin context interface for error/warning reporting
 */
interface PluginContextLike {
  error: (error: {
    message: string;
    cause?: Error;
    pluginCode?: string;
  }) => void;
  warn: (warning: {
    message: string;
    id?: string;
    pluginCode?: string;
  }) => void;
}

/**
 * Transform code containing tw() calls
 */
export function transformCode(
  code: string,
  id: string,
  breakpoints: string[],
  debug: boolean,
  context: PluginContextLike,
): TransformResult | null {
  // Parse AST
  let ast;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"],
    });
  } catch (error) {
    context.error({
      message: `Failed to parse ${id}: ${error instanceof Error ? error.message : String(error)}`,
      cause: error instanceof Error ? error : undefined,
      pluginCode: "PARSE_ERROR",
    });
    return null;
  }

  const s = new MagicString(code);
  let hasTransforms = false;

  // Traverse AST to find tw() calls
  traverse(ast, {
    CallExpression(path) {
      // Check if it's a tw() call
      if (
        path.node.callee.type === "Identifier" &&
        path.node.callee.name === "tw"
      ) {
        const args = path.node.arguments;

        // Must have at least one argument
        if (args.length === 0) {
          context.warn({
            message: `tw() called without arguments at ${id}`,
            id,
            pluginCode: "MISSING_ARGUMENTS",
          });
          return;
        }

        // Extract base classes (first argument)
        const baseClasses = extractStringLiteral(args[0]);

        if (baseClasses === null) {
          context.warn({
            message: `tw() first argument must be a string literal at ${id}`,
            id,
            pluginCode: "INVALID_BASE_CLASSES",
          });
          return;
        }

        // Extract responsive object (second argument, optional)
        const responsiveObj =
          args.length > 1 ? extractObjectExpression(args[1]) : {};

        // Build transformed class string
        const transformed = buildClassString(
          baseClasses,
          responsiveObj,
          breakpoints,
        );

        // Replace in code
        const { start, end } = path.node;
        if (
          start !== null &&
          end !== null &&
          start !== undefined &&
          end !== undefined
        ) {
          s.overwrite(start, end, `"${transformed}"`);
          hasTransforms = true;

          if (debug) {
            console.log(`[tw-classname] Transformed in ${id}:`, {
              input: code.slice(start, end),
              output: `"${transformed}"`,
            });
          }
        }
      }
    },
  });

  if (!hasTransforms) return null;

  return {
    code: s.toString(),
    map: s.generateMap({
      hires: true,
      source: id,
      file: id,
      includeContent: true,
    }),
  };
}

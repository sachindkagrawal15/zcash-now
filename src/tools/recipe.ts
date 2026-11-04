import type { CallToolResult } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { renderRecipeMarkdown } from '../llms.js';
import { loadRecipes } from '../recipes.js';
import { textResult } from '../result.js';

export interface RecipeArgs {
  task: string;
  stack?: string;
}

// The task list comes from the recipes on disk, so a new recipe file shows up in the schema.
export function recipeInput() {
  const tasks = [...new Set(loadRecipes().map((recipe) => recipe.task))] as [string, ...string[]];
  return z.object({
    task: z.enum(tasks).describe('What the agent is trying to do.'),
    stack: z.string().optional().describe('Preferred stack, for example cli, node or react.'),
  });
}

export async function zcashRecipe(args: RecipeArgs): Promise<CallToolResult> {
  const forTask = loadRecipes().filter((recipe) => recipe.task === args.task);
  const matching = args.stack ? forTask.filter((recipe) => recipe.stack === args.stack) : forTask;
  if (matching.length === 0) {
    const stacks = forTask.map((recipe) => recipe.stack).join(', ');
    return textResult(`There is no ${args.task} recipe for the ${args.stack} stack. Available: ${stacks}.`);
  }
  return textResult(...matching.map(renderRecipeMarkdown));
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Compiled modules run from dist/src, dist/scripts or dist/test, so the package
// root (where data/, recipes/ and proto/ live) is two levels up.
export const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

export function fromRoot(...parts: string[]): string {
  return path.join(packageRoot, ...parts);
}

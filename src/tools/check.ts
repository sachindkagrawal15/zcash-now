import type { CallToolResult } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { jsonBlock, textResult } from '../result.js';
import { RULES, check } from '../rules.js';

export const checkInput = z.object({
  code: z.string().min(1).max(200_000).describe('Source code, config or shell commands to check.'),
  filename: z.string().optional().describe('File name, used only to label the findings.'),
});

export async function zcashCheck(args: z.infer<typeof checkInput>): Promise<CallToolResult> {
  const findings = check(args.code);
  const label = args.filename ? `${args.filename}: ` : '';
  if (findings.length === 0) {
    return textResult(
      `${label}none of the ${RULES.length} rules found an outdated Zcash pattern or a privacy leak. Pattern rules can miss things, so still run the code on testnet.`,
    );
  }
  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const lines = [`${label}${findings.length} findings: ${errors} errors, ${findings.length - errors} warnings.`, ''];
  for (const finding of findings) {
    const source = finding.source ? ` Source: ${finding.source}` : '';
    lines.push(`- Line ${finding.line}, ${finding.severity} ${finding.rule}: ${finding.message} Fix: ${finding.fix}${source}`);
  }
  return textResult(lines.join('\n'), jsonBlock(findings));
}

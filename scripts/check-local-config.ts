import { validateLocalConfig } from './local-config.ts';

const issues = validateLocalConfig(process.env);
if (issues.length) {
  for (const issue of issues) console.error(`${issue.variable}: ${issue.message}`);
  process.exitCode = 1;
} else {
  console.log('Local configuration validated. Service connectivity has not been checked.');
}

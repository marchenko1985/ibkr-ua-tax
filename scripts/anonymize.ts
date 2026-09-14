// Anonymizes an IBKR activity statement so it can be committed as a test fixture.
//
//   npm run anonymize -- <input.htm> <output.htm>
//
// Replaces account id, name, alias and address (taken from the Account Information section)
// everywhere in the file, including element ids and the page title, then fails if any of
// the original values is still present. Trades and amounts are kept as is.

import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const ACCOUNT_ID = "U0000000";

/** Account ids like U1234567 or DU1234567 (paper), also inside element ids: tblTransactions_U1234567Body */
const ACCOUNT_ID_PATTERN = /(?<![A-Za-z0-9])D?U\d{5,9}(?!\d)/g;

const PLACEHOLDERS: Record<string, string> = {
  Name: "Full Name",
  "Account Alias": "alias",
  "Address of Account Holder(s)": "address",
  Account: ACCOUNT_ID,
};

const [input, output] = process.argv.slice(2);
if (!(input && output)) {
  throw new Error("usage: npm run anonymize -- <input.htm> <output.htm>");
}

const original = readFileSync(input, "utf-8");
const secrets = findSecrets(original);
let anonymized = original;
for (const [secret, placeholder] of secrets) {
  anonymized = anonymized.replaceAll(secret, placeholder);
}

const leftovers = [...secrets.keys()].filter((secret) => anonymized.includes(secret));
leftovers.push(...[...anonymized.matchAll(ACCOUNT_ID_PATTERN)].map(([id]) => id).filter((id) => id !== ACCOUNT_ID));
if (leftovers.length > 0) {
  throw new Error(`${input}: ${leftovers.length} original values are still present`);
}

writeFileSync(output, anonymized);
console.log(`${input} → ${output}: replaced ${secrets.size} values`);

/** Original value → placeholder, longest values first so a value containing another one is replaced whole */
function findSecrets(html: string) {
  const found = new Map<string, string>();
  for (const [, key, value] of html.matchAll(/<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>/g)) {
    const placeholder = key ? PLACEHOLDERS[key] : undefined;
    if (placeholder && value && value.trim() !== "" && value !== placeholder) {
      found.set(value, placeholder);
    }
  }
  for (const [id] of html.matchAll(ACCOUNT_ID_PATTERN)) {
    found.set(id, ACCOUNT_ID);
  }
  return new Map([...found].sort(([a], [b]) => b.length - a.length));
}

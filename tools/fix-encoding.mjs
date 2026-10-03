/**
 * Repair double-encoded UTF-8 in source files.
 *
 * Cause: reading a UTF-8 file through a single-byte (ANSI) codepage and writing
 * it back as UTF-8. On Windows this happens with tools that default to the ANSI
 * codepage, e.g. `Get-Content` + `Set-Content -Encoding UTF8` in PowerShell 5.1.
 * One em dash becomes four unwanted characters, the integral sign becomes three,
 * and the corruption can nest if the file is round-tripped more than once.
 *
 * **Prefer the editor's own file tools for text edits; this script exists to
 * repair damage that already happened, not as part of the normal workflow.**
 *
 * It writes with Node's UTF-8 writer only, so it cannot re-encode through a
 * codepage. The mojibake sequences are constructed from code points, so this
 * file stays free of the characters it hunts.
 *
 * Usage:  node tools/fix-encoding.mjs <file...>
 */
import fs from "node:fs";

const cp = (...points) => String.fromCodePoint(...points);

/**
 * Mojibake → intended character.
 *
 * Ordered longest-first: the third character of a mis-decoded three-byte
 * sequence depends on how far the damage went, so the specific variants are
 * listed before the bare-lead fallbacks.
 */
const REPAIRS = [
  // Em dash — the intended character in nearly every case below.
  [cp(0xe2, 0x20ac, 0x9d), cp(0x2014)],
  [cp(0xe2, 0x20ac, 0x153), cp(0x2014)],
  [cp(0xe2, 0x20ac, 0x201c), cp(0x2014)],
  [cp(0xe2, 0x20ac, 0x201d), cp(0x2014)],
  [cp(0xe2, 0x20ac, 0x22), cp(0x2014)],
  // Curly quotes
  [cp(0xe2, 0x20ac, 0x9c), cp(0x201c)],
  [cp(0xe2, 0x20ac, 0x2019), cp(0x2019)],
  // Ellipsis
  [cp(0xe2, 0x20ac, 0xa6), cp(0x2026)],
  // Integral sign
  [cp(0xe2, 0x2020, 0xab), cp(0x222b)],
  [cp(0xe2, 0x2c6, 0xab), cp(0x222b)],
  // Middle dot and other Latin-1 accents
  [cp(0xc3, 0x82, 0xb7), cp(0xb7)],
  [cp(0xc3, 0x83, 0xa9), cp(0xe9)],
  [cp(0xc3, 0x83, 0xa8), cp(0xe8)],
  [cp(0xc3, 0x83, 0xbc), cp(0xfc)],
  [cp(0xc3, 0x83, 0xb6), cp(0xf6)],
  [cp(0xc3, 0x83, 0xa4), cp(0xe4)],
];

/**
 * Last-resort fallbacks, applied only after the specific patterns above so that
 * an ellipsis is not silently turned into an em dash.
 */
const FALLBACKS = [
  [cp(0xe2, 0x20ac), cp(0x2014)],
  [cp(0xc3, 0x82, 0xb7), cp(0xb7)],
];

/** Anything left matching these after repair needs a human. */
const SUSPECTS = [
  cp(0xe2, 0x20ac), // U+00E2 U+20AC
  cp(0xe2, 0x201a), // U+00E2 U+201A
  cp(0xc3, 0x83), // U+00C3 U+0083
  cp(0xc3, 0x82), // U+00C3 U+0082
];

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node tools/fix-encoding.mjs <file...>");
  process.exit(1);
}

let applied = 0;
let unresolved = 0;

for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (err) {
    console.error(`cannot read ${file}: ${err.message}`);
    continue;
  }

  const before = text;
  text = text.replace(/^\uFEFF/, ""); // drop a BOM if one was added
  const done = [];

  for (const [bad, good] of [...REPAIRS, ...FALLBACKS]) {
    if (!text.includes(bad)) continue;
    const n = text.split(bad).length - 1;
    text = text.split(bad).join(good);
    done.push(`${String(good)} x${n}`);
  }

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8"); // Node writes UTF-8, no BOM
    applied += done.length;
    console.log(`repaired ${file}`);
    for (const d of done) console.log(`    restored ${d}`);
  } else {
    console.log(`no change ${file}`);
  }

  const left = SUSPECTS.filter((s) => text.includes(s));
  if (left.length > 0) {
    unresolved += left.length;
    console.log(`    [needs review] still contains: ${left.map((s) => JSON.stringify(s)).join(", ")}`);
  }
}

console.log(`\n${applied} replacement(s) applied, ${unresolved} sequence(s) need review`);
process.exitCode = unresolved > 0 ? 1 : 0;

#!/usr/bin/env node

/**
 * AIP-PIR Changelog Generator
 * ──────────────────────────────────────────────
 * Interactive CLI tool to create new version entries in version.js.
 *
 * Usage:
 *   npm run changelog
 *   # or directly:
 *   node scripts/changelog.mjs
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERSION_FILE = path.resolve(__dirname, '../src/version.js');

const CHANGE_TYPES = [
  { key: '1', type: 'feature',     emoji: '✨', label: 'Feature — New capability or module' },
  { key: '2', type: 'fix',         emoji: '🐛', label: 'Bug Fix — Bug fix' },
  { key: '3', type: 'improvement', emoji: '⚡', label: 'Improvement — Enhancement to existing functionality' },
  { key: '4', type: 'breaking',    emoji: '💥', label: 'Breaking Change — Alters existing behavior' },
  { key: '5', type: 'docs',        emoji: '📄', label: 'Documentation — Documentation update' },
  { key: '6', type: 'security',    emoji: '🔒', label: 'Security — Security-related patch' },
];

// ─── Helpers ──────────────────────────────────

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function bumpVersion(current) {
  // Auto-suggest the next patch version
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)(.*)/);
  if (!match) return current;
  const [, major, minor, patch, suffix] = match;
  return `${major}.${minor}.${parseInt(patch) + 1}${suffix}`;
}

// ─── Main ─────────────────────────────────────

async function main() {
  const rl = createRL();

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   📋  AIP-PIR Changelog Generator      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Read current version from file
  const fileContent = fs.readFileSync(VERSION_FILE, 'utf-8');
  const currentMatch = fileContent.match(/CURRENT_VERSION\s*=\s*'([^']+)'/);
  const currentVersion = currentMatch ? currentMatch[1] : '1.0.0-beta';
  const suggestedVersion = bumpVersion(currentVersion);

  console.log(`  Current version: ${currentVersion}\n`);

  // 1. Version
  const newVersion = await ask(rl, '📌 New version', suggestedVersion);

  // 2. Title
  const title = await ask(rl, '📝 Release title (e.g. "March Bug Fixes")');

  // 3. Description
  const description = await ask(rl, '📄 Short description of this release');

  // 4. Changes
  console.log('\n  ── Add Changes ──────────────────────────');
  console.log('  Select a type for each change. Type "done" when finished.\n');
  CHANGE_TYPES.forEach((t) => console.log(`    ${t.key}) ${t.emoji}  ${t.label}`));
  console.log('');

  const changes = [];

  while (true) {
    const typeKey = await ask(rl, 'Change type (1-6) or "done"');
    if (typeKey.toLowerCase() === 'done') {
      if (changes.length === 0) {
        console.log('  ⚠️  You need at least one change. Try again.');
        continue;
      }
      break;
    }

    const typeEntry = CHANGE_TYPES.find((t) => t.key === typeKey);
    if (!typeEntry) {
      console.log('  ⚠️  Invalid type. Enter 1-6 or "done".');
      continue;
    }

    const text = await ask(rl, `  ${typeEntry.emoji} Change description`);
    if (!text) {
      console.log('  ⚠️  Description cannot be empty.');
      continue;
    }

    changes.push({ type: typeEntry.type, text });
    console.log(`  ✅ Added ${typeEntry.emoji} ${typeEntry.type}: "${text}"\n`);
  }

  rl.close();

  // ─── Build the new entry ──────────────────

  const newEntry = {
    version: newVersion,
    date: today(),
    title: title || `v${newVersion}`,
    description: description || '',
    changes,
  };

  // ─── Format and inject into version.js ────

  const changesStr = changes
    .map((c) => `      { type: '${c.type}', text: '${c.text.replace(/'/g, "\\'")}' },`)
    .join('\n');

  const entryBlock = `  {
    version: '${newEntry.version}',
    date: '${newEntry.date}',
    title: '${newEntry.title.replace(/'/g, "\\'")}',
    description:
      '${newEntry.description.replace(/'/g, "\\'")}',
    changes: [
${changesStr}
    ],
  },`;

  // Insert the new entry at the top of the CHANGELOG array
  let updatedContent = fileContent.replace(
    /CURRENT_VERSION\s*=\s*'[^']+'/,
    `CURRENT_VERSION = '${newVersion}'`
  );

  // Find the opening of the CHANGELOG array and insert after it
  const arrayOpenRegex = /export const CHANGELOG\s*=\s*\[\s*\n/;
  if (arrayOpenRegex.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      arrayOpenRegex,
      `export const CHANGELOG = [\n${entryBlock}\n`
    );
  } else {
    console.error('  ❌ Could not find CHANGELOG array in version.js');
    process.exit(1);
  }

  fs.writeFileSync(VERSION_FILE, updatedContent, 'utf-8');

  // ─── Summary ──────────────────────────────

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ✅  Changelog Updated Successfully!    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n  Version:  ${currentVersion} → ${newVersion}`);
  console.log(`  Title:    ${newEntry.title}`);
  console.log(`  Changes:  ${changes.length} item(s)`);
  changes.forEach((c) => {
    const t = CHANGE_TYPES.find((ct) => ct.type === c.type);
    console.log(`    ${t?.emoji || '•'} [${c.type}] ${c.text}`);
  });
  console.log(`\n  File:     ${VERSION_FILE}`);
  console.log('  View at:  http://localhost:5173/changelog\n');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

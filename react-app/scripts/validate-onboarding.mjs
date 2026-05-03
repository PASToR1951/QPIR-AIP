import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(appRoot, 'src');

const configRoots = [
  path.join(srcRoot, 'lib', 'onboarding', 'roles'),
  path.join(srcRoot, 'lib', 'portalHelpConfig.js'),
];

function walk(entry) {
  const stat = fs.statSync(entry);
  if (stat.isFile()) return [entry];

  return fs.readdirSync(entry).flatMap((name) => walk(path.join(entry, name)));
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function jsSourceFiles(root) {
  return walk(root).filter((file) => /\.(jsx?|tsx?)$/.test(file));
}

function extractQuotedValues(source) {
  return [...source.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function collectConfiguredTargets(files) {
  const targets = new Map();
  const targetPattern = /\b(?:target|prerequisiteTarget):\s*(\[[\s\S]*?\]|['"][^'"]+['"])/g;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(targetPattern)) {
      for (const target of extractQuotedValues(match[1])) {
        if (!targets.has(target)) targets.set(target, []);
        targets.get(target).push(path.relative(appRoot, file));
      }
    }
  }

  return targets;
}

function collectActualTourTargets(files) {
  const targets = new Set();
  const dataTourPattern = /data-tour\s*=\s*['"]([^'"]+)['"]/g;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(dataTourPattern)) {
      targets.add(match[1]);
    }
  }

  return targets;
}

function collectConfiguredSignals(files) {
  const signals = new Map();
  const completeOnPattern = /\bcompleteOn:\s*\[([\s\S]*?)\]/g;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(completeOnPattern)) {
      for (const signal of extractQuotedValues(match[1])) {
        if (!signals.has(signal)) signals.set(signal, []);
        signals.get(signal).push(path.relative(appRoot, file));
      }
    }
  }

  return signals;
}

function collectEmittedSignals(files) {
  const signals = new Set();
  const emitPattern = /emitOnboardingSignal\(\s*['"]([^'"]+)['"]/g;
  const routeSignalPattern = /return\s+['"]([a-z]+(?:\.[a-z_]+)+)['"]/g;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(emitPattern)) signals.add(match[1]);
    for (const match of source.matchAll(routeSignalPattern)) signals.add(match[1]);
  }

  return signals;
}

function printFailures(title, failures) {
  if (failures.length === 0) return;

  console.error(`\n${title}`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
}

const configFiles = configRoots.flatMap((entry) => walk(entry)).filter((file) => /\.jsx?$/.test(file));
const sourceFiles = jsSourceFiles(srcRoot);

const configuredTargets = collectConfiguredTargets(configFiles);
const actualTargets = collectActualTourTargets(sourceFiles);
const missingTargets = [...configuredTargets.keys()]
  .filter((target) => !actualTargets.has(target))
  .sort()
  .map((target) => `${target} (${configuredTargets.get(target).join(', ')})`);

const configuredSignals = collectConfiguredSignals(configFiles);
const emittedSignals = collectEmittedSignals(sourceFiles);
const missingSignals = [...configuredSignals.keys()]
  .filter((signal) => !signal.startsWith('practice.') && !emittedSignals.has(signal))
  .sort()
  .map((signal) => `${signal} (${configuredSignals.get(signal).join(', ')})`);

printFailures('Missing data-tour targets referenced by onboarding/help config:', missingTargets);
printFailures('Missing emitted route/action signals referenced by onboarding config:', missingSignals);

if (missingTargets.length > 0 || missingSignals.length > 0) {
  process.exitCode = 1;
} else {
  console.log('Onboarding validation passed.');
}

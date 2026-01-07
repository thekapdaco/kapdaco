#!/usr/bin/env node

/**
 * Token Compliance Checker
 * 
 * Scans the codebase for hardcoded values that should use design tokens:
 * - Hex color values (#RRGGBB, #RGB)
 * - Hardcoded spacing values (common pixel values)
 * - Hardcoded animation durations
 * 
 * Usage: node scripts/check-tokens.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SCAN_DIRS = ['src'];
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /check-tokens\.js$/, // Exclude this file
  /design-system\.md$/, // Exclude docs
];

const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'];

// Known hex colors that are acceptable (in token definitions)
const ACCEPTABLE_HEX_PATTERNS = [
  /--kc-[^:]+:\s*#[0-9A-Fa-f]{3,6}/, // CSS variable definitions
  /--brand-[^:]+:\s*#[0-9A-Fa-f]{3,6}/, // Brand color definitions
  /url\(/, // URLs may contain hex
  /data:image/, // Data URIs
];

// Common spacing values that should use tokens
const SPACING_VIOLATIONS = [
  /(\d+)px/g, // Any pixel value (we'll filter common ones)
];

// Common spacing values to flag
const COMMON_SPACING_VALUES = [
  4, 8, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128
];

// Animation duration violations
const DURATION_VIOLATIONS = [
  /duration:\s*(\d+)/g,
  /transition.*(\d+)ms/g,
  /transition.*(\d+)s/g,
  /animation.*(\d+)ms/g,
  /animation.*(\d+)s/g,
];

// Results storage
const violations = {
  hexColors: [],
  spacing: [],
  durations: [],
};

/**
 * Check if a file should be scanned
 */
function shouldScanFile(filePath) {
  // Check extension
  const ext = path.extname(filePath);
  if (!FILE_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if hex color is in an acceptable context
 */
function isAcceptableHex(line, match) {
  const lineBefore = line.substring(0, match.index);
  
  // Check if it's in a CSS variable definition
  for (const pattern of ACCEPTABLE_HEX_PATTERNS) {
    if (pattern.test(line)) {
      return true;
    }
  }

  // Check if it's in a comment
  if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
    return true;
  }

  // Check if it's in a string that's clearly a URL or data URI
  if (line.includes('url(') || line.includes('data:')) {
    return true;
  }

  return false;
}

/**
 * Check if spacing value should use a token
 */
function isSpacingViolation(value, context) {
  const numValue = parseInt(value, 10);
  
  // Only flag common spacing values
  if (!COMMON_SPACING_VALUES.includes(numValue)) {
    return false;
  }

  // Check context - spacing-related properties
  const spacingProps = [
    'padding', 'margin', 'gap', 'top', 'bottom', 'left', 'right',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'
  ];

  const lowerContext = context.toLowerCase();
  return spacingProps.some(prop => lowerContext.includes(prop));
}

/**
 * Check if duration should use a token
 */
function isDurationViolation(value, context) {
  const numValue = parseFloat(value);
  
  // Common duration values that should use tokens
  const commonDurations = [200, 250, 300, 350, 400, 420, 500, 600, 700, 800, 1000];
  
  // Convert seconds to milliseconds if needed
  const msValue = context.includes('s') && !context.includes('ms') 
    ? numValue * 1000 
    : numValue;

  return commonDurations.includes(msValue);
}

/**
 * Scan a file for violations
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineNum) => {
      // Check for hex colors
      const hexPattern = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;
      let hexMatch;
      while ((hexMatch = hexPattern.exec(line)) !== null) {
        if (!isAcceptableHex(line, hexMatch)) {
          violations.hexColors.push({
            file: filePath,
            line: lineNum + 1,
            value: hexMatch[0],
            context: line.trim(),
          });
        }
      }

      // Check for spacing violations
      const spacingPattern = /(\d+)px/g;
      let spacingMatch;
      while ((spacingMatch = spacingPattern.exec(line)) !== null) {
        if (isSpacingViolation(spacingMatch[1], line)) {
          violations.spacing.push({
            file: filePath,
            line: lineNum + 1,
            value: spacingMatch[0],
            context: line.trim(),
          });
        }
      }

      // Check for duration violations
      for (const pattern of DURATION_VIOLATIONS) {
        let durationMatch;
        while ((durationMatch = pattern.exec(line)) !== null) {
          if (isDurationViolation(durationMatch[1], line)) {
            violations.durations.push({
              file: filePath,
              line: lineNum + 1,
              value: durationMatch[0],
              context: line.trim(),
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Check if directory should be excluded
      let shouldExclude = false;
      for (const pattern of EXCLUDE_PATTERNS) {
        if (pattern.test(fullPath)) {
          shouldExclude = true;
          break;
        }
      }
      if (!shouldExclude) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      scanFile(fullPath);
    }
  }
}

/**
 * Get token suggestion for a violation
 */
function getTokenSuggestion(violation) {
  if (violation.value.startsWith('#')) {
    // Color suggestion - would need color matching logic
    return 'Use var(--kc-*-*) token';
  }
  
  if (violation.value.includes('px')) {
    const value = parseInt(violation.value, 10);
    const spacingMap = {
      4: '--kc-spacing-xs',
      8: '--kc-gap-xs or --kc-spacing-sm',
      16: '--kc-gap-sm',
      24: '--kc-gap-md',
      32: '--kc-gap-lg',
      48: '--kc-gap-xl',
    };
    return spacingMap[value] || `Use var(--kc-spacing-*) or var(--kc-gap-*)`;
  }
  
  if (violation.value.includes('ms') || violation.value.includes('s')) {
    return 'Use var(--kc-duration-*) or ANIMATION_DURATIONS.*';
  }
  
  return 'Use appropriate design token';
}

/**
 * Print results
 */
function printResults() {
  console.log('\n🔍 Token Compliance Check Results\n');
  console.log('=' .repeat(60));

  let totalViolations = 0;

  // Hex color violations
  if (violations.hexColors.length > 0) {
    console.log(`\n❌ Hex Color Violations: ${violations.hexColors.length}`);
    console.log('-'.repeat(60));
    
    const fileGroups = {};
    violations.hexColors.forEach(v => {
      if (!fileGroups[v.file]) fileGroups[v.file] = [];
      fileGroups[v.file].push(v);
    });

    Object.entries(fileGroups).forEach(([file, items]) => {
      console.log(`\n📄 ${file}`);
      items.slice(0, 5).forEach(v => {
        console.log(`   Line ${v.line}: ${v.value} - ${v.context.substring(0, 60)}...`);
        console.log(`   💡 Suggestion: ${getTokenSuggestion(v)}`);
      });
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more in this file`);
      }
    });
    
    totalViolations += violations.hexColors.length;
  } else {
    console.log('\n✅ No hex color violations found');
  }

  // Spacing violations
  if (violations.spacing.length > 0) {
    console.log(`\n❌ Spacing Violations: ${violations.spacing.length}`);
    console.log('-'.repeat(60));
    
    const fileGroups = {};
    violations.spacing.forEach(v => {
      if (!fileGroups[v.file]) fileGroups[v.file] = [];
      fileGroups[v.file].push(v);
    });

    Object.entries(fileGroups).forEach(([file, items]) => {
      console.log(`\n📄 ${file}`);
      items.slice(0, 5).forEach(v => {
        console.log(`   Line ${v.line}: ${v.value} - ${v.context.substring(0, 60)}...`);
        console.log(`   💡 Suggestion: ${getTokenSuggestion(v)}`);
      });
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more in this file`);
      }
    });
    
    totalViolations += violations.spacing.length;
  } else {
    console.log('\n✅ No spacing violations found');
  }

  // Duration violations
  if (violations.durations.length > 0) {
    console.log(`\n❌ Animation Duration Violations: ${violations.durations.length}`);
    console.log('-'.repeat(60));
    
    const fileGroups = {};
    violations.durations.forEach(v => {
      if (!fileGroups[v.file]) fileGroups[v.file] = [];
      fileGroups[v.file].push(v);
    });

    Object.entries(fileGroups).forEach(([file, items]) => {
      console.log(`\n📄 ${file}`);
      items.slice(0, 5).forEach(v => {
        console.log(`   Line ${v.line}: ${v.value} - ${v.context.substring(0, 60)}...`);
        console.log(`   💡 Suggestion: ${getTokenSuggestion(v)}`);
      });
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more in this file`);
      }
    });
    
    totalViolations += violations.durations.length;
  } else {
    console.log('\n✅ No animation duration violations found');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (totalViolations === 0) {
    console.log('\n✅ All checks passed! No violations found.');
    console.log('\n💡 Remember to run this check before submitting PRs.');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Total Violations: ${totalViolations}`);
    console.log('\n📚 See docs/design-system.md for token reference');
    console.log('💡 Fix violations before submitting your PR');
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning codebase for token compliance...\n');

  // Scan all configured directories
  SCAN_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    } else {
      console.warn(`⚠️  Directory not found: ${dir}`);
    }
  });

  // Print results
  printResults();
}

// Run the check
main();


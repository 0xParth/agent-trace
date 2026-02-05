/**
 * File walker with gitignore support and extension filtering
 */

import { readFile } from 'fs/promises';
import { resolve, relative, extname } from 'path';
import fg from 'fast-glob';
import ignoreModule from 'ignore';
const ignore = ignoreModule.default || ignoreModule;
import type { FileInfo } from '../types/index.js';

// Extensions to scan by language
const EXTENSION_MAP: Record<string, string[]> = {
  json: ['.json'],
  python: ['.py'],
  typescript: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  go: ['.go'],
};

// All supported extensions
const ALL_EXTENSIONS = Object.values(EXTENSION_MAP).flat();

// Default ignore patterns
const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/__pycache__/**',
  '**/.venv/**',
  '**/venv/**',
  '**/.env/**',
  '**/env/**',
  '**/*.min.js',
  '**/*.bundle.js',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/vendor/**',
];

/**
 * Options for the file walker
 */
export interface WalkerOptions {
  /** Extensions to include (defaults to all supported) */
  extensions?: string[];
  
  /** Additional ignore patterns */
  ignorePatterns?: string[];
  
  /** Whether to respect .gitignore files */
  respectGitignore?: boolean;
}

/**
 * Walk a directory and yield files matching the criteria
 */
export async function walkDirectory(
  rootPath: string,
  options: WalkerOptions = {}
): Promise<FileInfo[]> {
  const {
    extensions = ALL_EXTENSIONS,
    ignorePatterns = [],
    respectGitignore = true,
  } = options;

  const absoluteRoot = resolve(rootPath);
  
  // Build glob pattern for extensions
  const extensionPatterns = extensions.map(ext => 
    ext.startsWith('.') ? `**/*${ext}` : `**/*.${ext}`
  );

  // Combine ignore patterns
  const allIgnorePatterns = [...DEFAULT_IGNORE, ...ignorePatterns];

  // Create ignore instance for gitignore support
  const ig = ignore();
  
  if (respectGitignore) {
    try {
      const gitignorePath = resolve(absoluteRoot, '.gitignore');
      const gitignoreContent = await readFile(gitignorePath, 'utf-8');
      ig.add(gitignoreContent);
    } catch {
      // No .gitignore file, continue without it
    }
  }

  // Find all matching files
  const files = await fg(extensionPatterns, {
    cwd: absoluteRoot,
    absolute: true,
    ignore: allIgnorePatterns,
    dot: false,
    onlyFiles: true,
    followSymbolicLinks: false,
  });

  // Filter by gitignore and read content
  const fileInfos: FileInfo[] = [];
  
  for (const filePath of files) {
    const relativePath = relative(absoluteRoot, filePath);
    
    // Check against gitignore
    if (respectGitignore && ig.ignores(relativePath)) {
      continue;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      
      fileInfos.push({
        path: filePath,
        relativePath,
        extension: extname(filePath),
        content,
      });
    } catch {
      // Skip files that can't be read
      continue;
    }
  }

  return fileInfos;
}

/**
 * Get files for a specific language/detector
 */
export function filterByLanguage(
  files: FileInfo[],
  language: keyof typeof EXTENSION_MAP
): FileInfo[] {
  const extensions = EXTENSION_MAP[language] || [];
  return files.filter(f => extensions.includes(f.extension));
}

/**
 * Get all supported extensions
 */
export function getSupportedExtensions(): string[] {
  return ALL_EXTENSIONS;
}

/**
 * Get extensions for a specific language
 */
export function getExtensionsForLanguage(language: string): string[] {
  return EXTENSION_MAP[language] || [];
}

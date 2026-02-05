/**
 * Permission and Risk Inference Engine
 * 
 * Infers permission levels and risk from tool names and descriptions
 * using keyword matching and heuristics.
 */

import type { Permission, RiskLevel } from '../types/index.js';

// Keywords that indicate READ permission (low risk)
const READ_KEYWORDS = [
  'get', 'read', 'fetch', 'list', 'search', 'query', 'find', 'lookup',
  'retrieve', 'show', 'display', 'view', 'describe', 'check', 'inspect',
  'count', 'exists', 'has', 'is', 'can', 'load', 'parse', 'extract',
  'select', 'filter', 'sort', 'browse', 'scan', 'analyze', 'validate',
];

// Keywords that indicate WRITE permission (medium risk)
const WRITE_KEYWORDS = [
  'create', 'add', 'insert', 'write', 'update', 'set', 'put', 'post',
  'save', 'store', 'upload', 'push', 'modify', 'edit', 'change', 'patch',
  'append', 'register', 'submit', 'send', 'publish', 'configure', 'enable',
  'disable', 'toggle', 'assign', 'allocate', 'grant', 'revoke',
];

// Keywords that indicate DELETE permission (high risk)
const DELETE_KEYWORDS = [
  'delete', 'remove', 'drop', 'destroy', 'truncate', 'clear', 'purge',
  'wipe', 'erase', 'uninstall', 'terminate', 'kill', 'stop', 'abort',
  'cancel', 'revoke', 'reset', 'clean', 'flush', 'invalidate',
];

// Keywords that indicate EXECUTE permission (high risk)
const EXECUTE_KEYWORDS = [
  'execute', 'run', 'eval', 'shell', 'exec', 'spawn', 'invoke', 'call',
  'trigger', 'start', 'launch', 'deploy', 'install', 'migrate', 'apply',
  'process', 'perform', 'do', 'action', 'command', 'script', 'code',
];

// Keywords that indicate OUTPUT permission (low risk)
const OUTPUT_KEYWORDS = [
  'display', 'show', 'render', 'output', 'print', 'format', 'present',
  'visualize', 'chart', 'graph', 'report', 'export', 'download',
];

// Permission to risk mapping
const PERMISSION_RISK_MAP: Record<Permission, RiskLevel> = {
  'READ': 'LOW',
  'OUTPUT': 'LOW',
  'WRITE': 'MEDIUM',
  'DELETE': 'HIGH',
  'EXECUTE': 'HIGH',
  'UNKNOWN': 'MEDIUM',
};

/**
 * Convert a name to lowercase words for matching
 */
function tokenize(text: string): string[] {
  // Split by camelCase, snake_case, kebab-case, and spaces
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
    .replace(/[_-]/g, ' ')               // snake_case, kebab-case
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Check if any keyword matches the tokens
 */
function matchesKeywords(tokens: string[], keywords: string[]): boolean {
  return tokens.some(token => 
    keywords.some(keyword => 
      token === keyword || token.startsWith(keyword) || token.endsWith(keyword)
    )
  );
}

/**
 * Infer permission level from tool name and optional description
 */
export function inferPermission(name: string, description?: string): Permission {
  const nameTokens = tokenize(name);
  const descTokens = description ? tokenize(description) : [];
  const allTokens = [...nameTokens, ...descTokens];

  // Check in order of severity (most dangerous first)
  if (matchesKeywords(allTokens, DELETE_KEYWORDS)) {
    return 'DELETE';
  }
  
  if (matchesKeywords(allTokens, EXECUTE_KEYWORDS)) {
    return 'EXECUTE';
  }
  
  if (matchesKeywords(allTokens, WRITE_KEYWORDS)) {
    return 'WRITE';
  }
  
  if (matchesKeywords(allTokens, OUTPUT_KEYWORDS)) {
    return 'OUTPUT';
  }
  
  if (matchesKeywords(allTokens, READ_KEYWORDS)) {
    return 'READ';
  }

  return 'UNKNOWN';
}

/**
 * Get risk level from permission
 */
export function inferRisk(permission: Permission): RiskLevel {
  return PERMISSION_RISK_MAP[permission];
}

/**
 * Infer both permission and risk from tool name and description
 */
export function inferPermissionAndRisk(
  name: string, 
  description?: string
): { permission: Permission; risk: RiskLevel } {
  const permission = inferPermission(name, description);
  const risk = inferRisk(permission);
  return { permission, risk };
}

/**
 * Check if a tool is high risk
 */
export function isHighRisk(permission: Permission): boolean {
  return permission === 'DELETE' || permission === 'EXECUTE';
}

/**
 * Get all keywords for a permission level
 */
export function getKeywordsForPermission(permission: Permission): string[] {
  switch (permission) {
    case 'READ': return READ_KEYWORDS;
    case 'WRITE': return WRITE_KEYWORDS;
    case 'DELETE': return DELETE_KEYWORDS;
    case 'EXECUTE': return EXECUTE_KEYWORDS;
    case 'OUTPUT': return OUTPUT_KEYWORDS;
    default: return [];
  }
}

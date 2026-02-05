/**
 * Extension router - routes files to appropriate detectors
 */

import type { FileInfo, DetectorResult } from '../types/index.js';
import type { Detector } from '../detectors/base.js';

/**
 * Router that dispatches files to appropriate detectors based on extension
 */
export class ExtensionRouter {
  private detectors: Map<string, Detector[]> = new Map();
  private globalDetectors: Detector[] = [];

  /**
   * Register a detector for specific extensions
   */
  register(detector: Detector, extensions: string[]): void {
    for (const ext of extensions) {
      const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
      const existing = this.detectors.get(normalizedExt) || [];
      existing.push(detector);
      this.detectors.set(normalizedExt, existing);
    }
  }

  /**
   * Register a detector that runs on all files
   */
  registerGlobal(detector: Detector): void {
    this.globalDetectors.push(detector);
  }

  /**
   * Get detectors for a specific file
   */
  getDetectorsForFile(file: FileInfo): Detector[] {
    const extensionDetectors = this.detectors.get(file.extension) || [];
    return [...this.globalDetectors, ...extensionDetectors];
  }

  /**
   * Process a file through all applicable detectors
   */
  async processFile(file: FileInfo): Promise<DetectorResult> {
    const detectors = this.getDetectorsForFile(file);
    
    const result: DetectorResult = {
      tools: [],
      agents: [],
      mcpServers: [],
    };

    for (const detector of detectors) {
      try {
        const detectorResult = await detector.detect(file);
        result.tools.push(...detectorResult.tools);
        result.agents.push(...detectorResult.agents);
        result.mcpServers.push(...detectorResult.mcpServers);
      } catch (error) {
        // Log error but continue with other detectors
        console.error(`Error in detector ${detector.name} for ${file.relativePath}:`, error);
      }
    }

    return result;
  }

  /**
   * Process multiple files
   */
  async processFiles(files: FileInfo[]): Promise<DetectorResult> {
    const result: DetectorResult = {
      tools: [],
      agents: [],
      mcpServers: [],
    };

    for (const file of files) {
      const fileResult = await this.processFile(file);
      result.tools.push(...fileResult.tools);
      result.agents.push(...fileResult.agents);
      result.mcpServers.push(...fileResult.mcpServers);
    }

    return result;
  }
}

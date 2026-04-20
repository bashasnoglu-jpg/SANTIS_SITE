/**
 * SANTIS Sovereign OS - Intelligence IPC Bridge
 * Path: server/core/python-bridge.ts
 */

import { execFile } from 'child_process';
import { ConstitutionalGuard } from './adapter.ts';
import { SovereignEnvelope } from './telemetry.ts';

export class PythonBridge {
  static execute(scriptPath: string, args: string[]): Promise<SovereignEnvelope | null> {
    return new Promise((resolve) => {
      // Python betiğini çalıştır
      execFile('python', [scriptPath, ...args], (error, stdout, stderr) => {
        
        // 1. Sistem Hatası Denetimi (Fatal Error)
        if (error || stderr) {
          console.error(`[PYTHON_BRIDGE_ERROR]: Critical failure in ${scriptPath}`, stderr || error);
          return resolve(null);
        }

        // 2. Anayasal Süzgeç (Constitutional Guard)
        // Python'dan gelen stdout, doğrudan gümrük kapısına gönderilir.
        const sanitized = ConstitutionalGuard.sanitize(stdout.trim());

        if (!sanitized) {
          console.warn(`[CONSTITUTIONAL_VIOLATION]: Python script ${scriptPath} produced illegal output.`);
          return resolve(null);
        }

        // 3. Geçerli Veri
        resolve(sanitized);
      });
    });
  }
}

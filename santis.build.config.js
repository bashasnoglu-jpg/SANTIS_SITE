// santis.build.config.js - Sovereign Compiler
// This file orchestrates the Vite build process for the Santis Quantum OS.
// It handles Tree-Shaking, Bundle generation, and Military-Grade Obfuscation.

import { defineConfig } from 'vite';
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

export default defineConfig({
    build: {
        outDir: 'dist',
        lib: {
            entry: './assets/js/santis-bootloader.js', // The bootloader resolves all dependencies
            name: 'SantisOS',
            fileName: (format) => `santis-quantum-core.${format}.js`
        },
        rollupOptions: {
            plugins: [
                javascriptObfuscator({
                    // Askeri Sınıf Şifreleme (Obfuscation)
                    compact: true,
                    controlFlowFlattening: true, // Akışı karmaşıklaştırma
                    controlFlowFlatteningThreshold: 1,
                    deadCodeInjection: true,     // Sahte "Dead Code" enjeksiyonuyla analizi imkansız kılma
                    deadCodeInjectionThreshold: 0.4,
                    stringArray: true,           // Tüm stringleri tek arayeye toplar
                    stringArrayEncoding: ['base64', 'rc4'],
                    stringArrayThreshold: 0.75,
                    rotateStringArray: true,
                    disableConsoleOutput: true,  // Kullanıcının console.log'ları görmesini engeller
                    selfDefending: true          // Kodun formatlanıp okunmaya çalışmasını engeller
                })
            ]
        },
        minify: 'terser', // En agresif minify motoru
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    }
});

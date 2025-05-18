const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Format waktu sekarang: output_20250516_1534
function getOutputFolderName() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `⏹️ Hasil/⚙️ output_${pad(now.getDate())}_${now.toLocaleDateString('id-ID', { month: 'long' })}_${pad(now.getHours())}.${pad(now.getMinutes())}`;
}

// Baca semua file HTML di direktori saat ini
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
if (files.length === 0) {
  console.log('❌ Tidak ada file .html ditemukan.');
  process.exit(1);
}

const outputFolder = getOutputFolderName();
fs.mkdirSync(outputFolder, { recursive: true });

(async () => {
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');

    // Step 1: Ambil semua <script> dan obfuscate JS
    let scripts = [];
    let htmlWithPlaceholders = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, jsCode) => {
      scripts.push(jsCode);
      return `__OBFUSCATED_SCRIPT_${scripts.length - 1}__`;
    });

    // Obfuscate JS
    scripts = scripts.map(code =>
      `<script>${JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
      }).getObfuscatedCode()}</script>`
    );

    // Replace kembali
    let finalHtml = htmlWithPlaceholders.replace(/__OBFUSCATED_SCRIPT_(\d+)__/g, (_, idx) => scripts[parseInt(idx)]);

    // Minify HTML (termasuk inline CSS)
    const minified = await minify(finalHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: false, // Sudah diobfuscate
    });

    const outputPath = path.join(outputFolder, file);
    fs.writeFileSync(outputPath, minified);
    console.log(`✅ ${file} -> ${outputPath}`);
  }

  console.log(`🎉 Semua file disimpan di folder: ${outputFolder}`);
})();

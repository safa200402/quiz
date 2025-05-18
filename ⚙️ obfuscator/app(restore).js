const fs = require('fs');
const path = require('path');
const { format } = require('prettier');

// Baca semua file HTML di direktori saat ini
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
if (files.length === 0) {
  console.log('❌ Tidak ada file .html ditemukan.');
  process.exit(1);
}

// Output folder
const outputFolder = '🔄 Hasil_Restore';
fs.mkdirSync(outputFolder, { recursive: true });

(async () => {
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');

    // Memformat HTML menggunakan Prettier (Async)
    const restoredHtml = await format(html, { parser: 'html', tabWidth: 2 });

    const outputPath = path.join(outputFolder, file);
    fs.writeFileSync(outputPath, restoredHtml);
    console.log(`✅ ${file} -> ${outputPath}`);
  }

  console.log(`🎉 Semua file dikembalikan dan disimpan di folder: ${outputFolder}`);
})();

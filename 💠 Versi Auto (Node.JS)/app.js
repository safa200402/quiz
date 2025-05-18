const http = require('http');
const fs = require('fs');
const url = require('url');
const { exec } = require('child_process');

const { minify } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const port = 3000;

const getFormPage = () => `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Input Data</title>
<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="container mt-5">
  <h1 class="mb-4">Masukkan Data</h1>
  <form method="POST" action="/generate">
    <div class="mb-3">
      <label for="namaFile" class="form-label">Nama File</label>
      <input type="text" class="form-control" id="namaFile" name="namaFile" placeholder="Nama File (contoh: index.html)" value="index.html" required />
    </div>
    <div class="mb-3">
      <label for="soal" class="form-label">Input Data Soal</label>
      <textarea class="form-control" id="soal" name="soal" rows="5">▪️▪️▪️▪️▪️\n➡️Buah yang kaya akan vitamin C adalah...?\nPisang\nSemangka\nJeruk ✅\nApel</textarea>
    </div>
    <div class="mb-3">
      <label for="chatId" class="form-label">Chat ID Telegram</label>
      <input type="text" class="form-control" id="chatId" name="chatId" value="5432124045" />
    </div>
    <div class="mb-3">
      <label for="tokenTele" class="form-label">Token Telegram</label>
      <input type="text" class="form-control" id="tokenTele" name="tokenTele" value="5990360046:AAH6-VOZsWG39YRtmMuIx9YvJVN5T18ZpZE" />
    </div>
    <div class="mb-3">
      <label for="linkGrup" class="form-label">Link Grup Telegram</label>
      <input type="text" class="form-control" id="linkGrup" name="linkGrup" value="https://t.me/+qmnvnJxqXC1mZDc9" />
    </div>
    <div class="mb-3">
      <label for="domData" class="form-label">Data DOM untuk HTML</label>
      <textarea class="form-control" id="domData" name="domData" rows="3"><h1>Quiz Interaktif</h1>Jawablah setiap pertanyaan dengan benar.</textarea>
    </div>
    <div class="mb-3">
      <label for="creditStatement" class="form-label">Credit Statement</label>
      <textarea class="form-control" id="creditStatement" name="creditStatement" rows="2">This quiz was created by Abu Ardlin Salman.</textarea>
    </div>
    <button type="submit" class="btn btn-primary w-100">Generate File</button>
  </form>

  <!-- Bootstrap JS Bundle with Popper -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;
async function processHtmlString(htmlContent, obfuscateOptions = {}, minifyOptions = {}) {
  // Step 1: Ambil semua <script> dan obfuscate JS
  let scripts = [];
  let htmlWithPlaceholders = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, jsCode) => {
    scripts.push(jsCode);
    return `__OBFUSCATED_SCRIPT_${scripts.length - 1}__`;
  });

  // Obfuscate JS
  scripts = scripts.map(code =>
    `<script>${JavaScriptObfuscator.obfuscate(code, obfuscateOptions).getObfuscatedCode()}</script>`
  );

  // Replace kembali
  let finalHtml = htmlWithPlaceholders.replace(/__OBFUSCATED_SCRIPT_(\d+)__/g, (_, idx) => scripts[parseInt(idx)]);

  // Minify HTML
  const minified = await minify(finalHtml, minifyOptions);

  return minified; // Mengembalikan hasil sebagai string
}

function convertToJSON(inputText) {
  const lines = inputText.trim().split('\n');
  const result = [];

  let currentQuestion = '';
  let options = [];
  let answer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') continue;

    if (line.startsWith('➡️')) {
      if (currentQuestion) {
        result.push({ question: currentQuestion, options, answer });
      }

      currentQuestion = line.replace(/^➡️\s*/, '');
      options = [];
      answer = '';

    } else {
      if (!line.includes('▪️')) {
        if (line.includes('✅')) {
          answer = line.replace('✅', '').trim();
          options.push(answer);
        } else {
          options.push(line);
        }
      }
    }
  }

  // Push the last question after loop ends
  if (currentQuestion) {
    result.push({ question: currentQuestion, options, answer });
  }

  // Kembalikan hasil sebagai string JSON
  return JSON.stringify(result, null, 2);
}


  
  const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getFormPage());
  } 
  else if (req.method === 'POST' && parsedUrl.pathname === '/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      var namaFile = params.get('namaFile') || 'index.html';
      var soal = params.get('soal') || '';
      soal = convertToJSON(soal);
      const chatId = params.get('chatId') || '';
      const tokenTele = params.get('tokenTele') || '';
      const linkGrup = params.get('linkGrup') || '';
      const domData = params.get('domData') || '';
      const creditStatement = params.get('creditStatement') || '';
      console.log(creditStatement);

      fs.readFile('📃 template1_quiz_V2.html', 'utf-8', async (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Gagal membaca file template.html</h1>');
          return;
        }

        //apabila namaFile tidak diakhiri dengan .html meka ditambahkan
        namaFile = (params.get('namaFile') || 'index.html').endsWith('.html') 
        ? params.get('namaFile') 
        : (params.get('namaFile') + '.html');

        var htmlContent = data;

        function replaceLines(htmlData, keyword, replacement) {
            return htmlData
                .split('\n') // Memisahkan data menjadi array per baris
                .map(line => {
                    line = line.trim();
                    // console.log(`Sebelum: ${line}`);
                    const replacedLine = line.startsWith(keyword) ? line = replacement : line;
                    // console.log(`Sesudah: ${replacedLine}`);
                    return replacedLine;
                })
                .join('\n'); // Menggabungkan kembali menjadi teks HTML
        }

        htmlContent = replaceLines(htmlContent, "let questions = [", "let questions = " + soal + ";")
        htmlContent = replaceLines(htmlContent, "const chatId = '", "const chatId = \"" + chatId + "\";")
        htmlContent = replaceLines(htmlContent, "href=\"https://t.me/", "href=" + "\""+linkGrup + "\"" )
        htmlContent = replaceLines(htmlContent, '<div id="description"><h1>', "<div id=\"description\">" + domData + "</div>")
        htmlContent = replaceLines(htmlContent,
          '<p style=" font-size: 0.5em; ">',
          '<p style=" font-size: 0.5em; ">' + creditStatement + '</p>'
        );

        function encodeBase64(input) {
            return Buffer.from(input, 'utf-8').toString('base64');
        }
        htmlContent = replaceLines(htmlContent, 'const bbbbbbb = ', "const bbbbbbb = \"" + encodeBase64(tokenTele) + "\";")


        htmlContent = await processHtmlString(
          htmlContent,
          { compact: true, controlFlowFlattening: true },
          { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: false }
        );


        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${namaFile}"`,
        });
        res.end(htmlContent);

      });
    });
  } 
});

server.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  exec(`start http://localhost:${port}`); // Untuk Windows

});

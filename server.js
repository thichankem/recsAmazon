const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
    // 1. API Chạy Bot
    if (req.method === 'POST' && req.url === '/api/run-bot') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            let config = {};
            try { config = JSON.parse(body); } catch (e) {}

            console.log(`[API] Yêu cầu chạy bot: ${config.type} - BotID: ${config.id}`);
            
            let command = '';
            let targetUrlEnv = '';
            
            if (config.type === 'CF') {
                command = `npx playwright test test/amazon_collab_bot.spec.ts --headed --project=chromium`;
            } else if (config.type === 'CB' && config.id === 'url') {
                const testUrl = config.url || 'https://www.apple.com/iphone-15-pro/';
                // Dùng cross-env cách cơ bản nhất: SET TEST_URL=... && npx...
                command = `set TEST_URL=${testUrl}&& npx playwright test test/amazon_url_bot.spec.ts --headed`;
            } else {
                command = `npx playwright test test/amazon_ai_bot.spec.ts --headed`;
            }

            console.log(`[EXEC] ${command}`);
            
            // Chạy không đồng bộ, trả về ngay cho frontend
            exec(command, (error, stdout, stderr) => {
                if (error) console.error(`[EXEC ERROR]: ${error}`);
                console.log(`[EXEC XONG]`);
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'started', message: 'Bot đang chạy ngầm, hãy kiểm tra terminal / cửa sổ Playwright!' }));
        });
        return;
    }

    // 2. Phục vụ file tĩnh (Static File Server)
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './dashboard.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 AI RECOMMENDATION DASHBOARD SERVER`);
    console.log(`👉 Bấm vào đây để mở: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { spawn } = require('child_process');

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
    // CORS: cho phép dashboard mở từ file:// hoặc bất kỳ origin nào gọi API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

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
            
            // Chạy không đồng bộ, trả về ngay cho frontend và stream log ra terminal
            console.log(`[EXEC] Đang chạy bot, vui lòng theo dõi log bên dưới...`);
            const child = exec(command);

            child.stdout.on('data', (data) => {
                process.stdout.write(data);
            });

            child.stderr.on('data', (data) => {
                process.stderr.write(data);
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error(`[EXEC ERROR] Bot kết thúc với mã lỗi: ${code}`);
                } else {
                    console.log(`[EXEC XONG] Bot đã hoàn thành thành công.`);
                }
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'started', message: 'Bot đang chạy ngầm, hãy kiểm tra terminal / cửa sổ Playwright!' }));
        });
        return;
    }

    // 2. API gợi ý sản phẩm
    if (req.method === 'POST' && req.url === '/api/recommendations/collaborative') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            let payload = {};
            try { payload = JSON.parse(body); } catch (e) {}
            const viewedTitles = Array.isArray(payload.viewed_titles) ? payload.viewed_titles : [];
            const topK = Number(payload.top_k || 30);

            const child = spawn(process.platform === 'win32' ? 'python' : 'python3', ['predict_collaboration.py'], {
                cwd: path.join(__dirname),
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });

            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => { stdout += data.toString(); });
            child.stderr.on('data', (data) => { stderr += data.toString(); });
            child.on('close', (code) => {
                try {
                    const result = JSON.parse(stdout.trim() || '[]');
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ titles: Array.isArray(result) ? result : [] }));
                } catch (error) {
                    console.error('[COLLAB-ERR]', stderr);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Collab model failed', details: stderr }));
                }
            });

            child.stdin.write(JSON.stringify({ viewed_titles: viewedTitles, top_k: topK, method: 'item_cf' }));
            child.stdin.end();
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/api/recommendations/content') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            let payload = {};
            try { payload = JSON.parse(body); } catch (e) {}
            const title = String(payload.title || '');
            const description = String(payload.description || '');
            const topK = Number(payload.top_k || 8);

            const child = spawn(process.platform === 'win32' ? 'python' : 'python3', ['predict.py'], {
                cwd: path.join(__dirname),
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });

            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => { stdout += data.toString(); });
            child.stderr.on('data', (data) => { stderr += data.toString(); });
            child.on('close', (code) => {
                try {
                    const result = JSON.parse(stdout.trim() || '[]');
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ titles: Array.isArray(result) ? result : [] }));
                } catch (error) {
                    console.error('[CONTENT-ERR]', stderr);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Content model failed', details: stderr }));
                }
            });

            child.stdin.write(JSON.stringify({ title, description }));
            child.stdin.end();
        });
        return;
    }

    // 3. Phục vụ file tĩnh (Static File Server)
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
    console.log(`👉 Dashboard: http://localhost:${PORT}`);
    console.log(`======================================================\n`);

    // Tự động mở trình duyệt khi server khởi động
    const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${openCmd} http://localhost:${PORT}`);
});

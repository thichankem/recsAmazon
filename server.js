const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT || 3000);

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
};

// ������������������������������������������������������������������������������������������������������������������
// Trạng thái Bot (�Ồ dashboard theo dõi realtime)
// ������������������������������������������������������������������������������������������������������������������
const botStatus = {
    CB: { running: false, startTime: null, logs: [], exitCode: null },
    CF: { running: false, startTime: null, logs: [], exitCode: null },
    URL: { running: false, startTime: null, logs: [], exitCode: null },
};

const sendJson = (res, statusCode, payload) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
};

const toProduct = (item) => {
    const features = Array.isArray(item.features) ? item.features : [];
    const description = Array.isArray(item.description) ? item.description : [];
    return {
        parent_asin: item.parent_asin || item.asin || '',
        title: item.title || 'Unnamed product',
        main_category: item.main_category || 'Unknown',
        average_rating: Number(item.average_rating) || 0,
        rating_number: Number(item.rating_number) || 0,
        price: Number(item.price) || 0,
        store: item.store || item.main_category || 'Unknown store',
        categories: [item.main_category, ...(Array.isArray(item.categories) ? item.categories : [])].filter(Boolean),
        features,
        description,
        details: {
            Category: item.main_category || 'Unknown',
            Price: item.price != null ? String(item.price) : 'N/A',
            Source: 'data/meta_Cell_Phones_and_Accessories.jsonl'
        },
        bought_together: []
    };
};

const readProducts = ({ limit = 120, query = '' } = {}) => new Promise((resolve, reject) => {
    const dataPath = path.join(__dirname, 'data', 'meta_Cell_Phones_and_Accessories.jsonl');
    const products = [];
    const normalizedQuery = String(query || '').toLowerCase().trim();
    const stream = fs.createReadStream(dataPath, { encoding: 'utf8' });
    let buffer = '';

    const matchesQuery = (product) => {
        if (!normalizedQuery) return true;
        return [
            product.title,
            product.parent_asin,
            product.main_category,
            product.store,
            ...(Array.isArray(product.categories) ? product.categories : [])
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    };

    stream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const product = toProduct(JSON.parse(line));
                if (matchesQuery(product)) {
                    products.push(product);
                }
                if (products.length >= limit) {
                    stream.destroy();
                    break;
                }
            } catch (error) {
                continue;
            }
        }
    });

    stream.on('error', reject);
    stream.on('close', () => resolve(products));
    stream.on('end', () => resolve(products));
});

const server = http.createServer((req, res) => {
    // CORS: cho phép dashboard m�x từ file:// hoặc bất kỳ origin nào gọi API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // API: Chạy Bot
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'POST' && req.url === '/api/run-bot') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            let config = {};
            try { config = JSON.parse(body); } catch (e) {}

            console.log(`[API] Yêu cầu chạy bot: ${config.type} - BotID: ${config.id}`);
            
            let command = '';
            const statusKey = config.type === 'CF' ? 'CF' : (config.id === 'url' ? 'URL' : 'CB');
            
            if (config.type === 'CF') {
                // Dùng project chromium (Chrome thật) thay vì firefox
                command = `npx playwright test test/amazon_collab_bot.spec.ts --headed --project=chromium`;
            } else if (config.type === 'CB' && config.id === 'url') {
                const testUrl = config.url || 'https://www.apple.com/iphone-15-pro/';
                command = `set TEST_URL=${testUrl}&& npx playwright test test/amazon_url_bot.spec.ts --headed --project=chromium`;
            } else {
                command = `npx playwright test test/amazon_ai_bot.spec.ts --headed --project=chromium`;
            }

            console.log(`[EXEC] ${command}`);
            
            // Reset trạng thái
            botStatus[statusKey] = {
                running: true,
                startTime: new Date().toISOString(),
                logs: [`[${new Date().toLocaleTimeString()}] Đang kh�xi ��"ng...`],
                exitCode: null,
            };

            // Chạy không ��ng b�", stream log ra terminal và lưu vào status
            const child = exec(command);

            child.stdout.on('data', (data) => {
                process.stdout.write(data);
                botStatus[statusKey].logs.push(data.toString().trim());
                // Giữ t�i �a 100 dòng log
                if (botStatus[statusKey].logs.length > 100) {
                    botStatus[statusKey].logs = botStatus[statusKey].logs.slice(-80);
                }
            });

            child.stderr.on('data', (data) => {
                process.stderr.write(data);
                botStatus[statusKey].logs.push(`[ERR] ${data.toString().trim()}`);
            });

            child.on('close', (code) => {
                botStatus[statusKey].running = false;
                botStatus[statusKey].exitCode = code;
                if (code !== 0) {
                    console.error(`[EXEC ERROR] Bot kết thúc v�:i mã l�i: ${code}`);
                    botStatus[statusKey].logs.push(`�R Kết thúc v�:i l�i (code: ${code})`);
                } else {
                    console.log(`[EXEC XONG] Bot �ã hoàn thành thành công.`);
                    botStatus[statusKey].logs.push(`�S& Hoàn thành thành công!`);
                }
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'started', 
                message: 'Bot �ang chạy trên Chrome thật (không cần KhoiDongChromeBot.bat)!' 
            }));
        });
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // API: Trạng thái Bot (cho dashboard auto-refresh)
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'GET' && req.url === '/api/bot-status') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(botStatus));
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // API: Danh sách output files (cho dashboard biết bot nào �ã xong)
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'GET' && req.url === '/api/bot-results') {
        const outDir = path.join(__dirname, 'output');
        try {
            const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json'));
            const results = files.map(f => {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf-8'));
                    return { file: f, timestamp: data.timestamp || null, botName: data.botName || f };
                } catch { return { file: f, timestamp: null, botName: f }; }
            });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results));
        } catch {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        }
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // API: SEARCH
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'GET' && req.url.startsWith('/api/search')) {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const query = urlObj.searchParams.get('q') || '';
        const limit = Number(urlObj.searchParams.get('limit') || 50);
        let finished = false;

        const finishWithLocalSearch = async () => {
            if (finished) return;
            finished = true;
            try {
                sendJson(res, 200, await readProducts({ limit, query }));
            } catch (error) {
                sendJson(res, 500, { error: 'Could not read local products', details: error.message });
            }
        };

        const proxyUrl = `http://127.0.0.1:5000/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        const reqProxy = http.get(proxyUrl, (resProxy) => {
            let data = '';
            resProxy.on('data', chunk => data += chunk);
            resProxy.on('end', () => {
                if (finished) return;
                if (resProxy.statusCode && resProxy.statusCode >= 400) {
                    finishWithLocalSearch();
                    return;
                }
                finished = true;
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            });
        });
        reqProxy.setTimeout(3000, () => {
            reqProxy.destroy();
            finishWithLocalSearch();
        });
        reqProxy.on('error', finishWithLocalSearch);
        return;
    }

    // API: Products data
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'GET' && req.url === '/api/data/products') {
        const dataPath = path.join(__dirname, 'data', 'meta_Cell_Phones_and_Accessories.jsonl');
        const limit = 120; // Lowered back to 120 because frontend will search via /api/search
        const products = [];
        const stream = fs.createReadStream(dataPath, { encoding: 'utf8' });
        let buffer = '';

        stream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const item = JSON.parse(line);
                    const features = Array.isArray(item.features) ? item.features : [];
                    const description = Array.isArray(item.description) ? item.description : [];
                    products.push({
                        parent_asin: item.parent_asin || item.asin || '',
                        title: item.title || 'Unnamed product',
                        main_category: item.main_category || 'Unknown',
                        average_rating: Number(item.average_rating) || 0,
                        rating_number: Number(item.rating_number) || 0,
                        price: Number(item.price) || 0,
                        store: item.store || item.main_category || 'Unknown store',
                        categories: [item.main_category, ...(Array.isArray(item.categories) ? item.categories : [])].filter(Boolean),
                        features,
                        description,
                        details: {
                            Category: item.main_category || 'Unknown',
                            Price: item.price != null ? String(item.price) : 'N/A',
                            Source: 'data/meta_Cell_Phones_and_Accessories.jsonl'
                        },
                        bought_together: []
                    });
                    if (products.length >= limit) {
                        stream.destroy();
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            if (products.length >= limit) {
                stream.destroy();
            }
        });

        stream.on('error', (error) => {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Không �ọc �ược data/products', details: error.message }));
        });

        stream.on('close', () => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(products));
        });
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // API: Collaborative recommendations
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'POST' && req.url === '/api/recommendations/collaborative') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            let payload = {};
            try { payload = JSON.parse(body); } catch (e) {}
            const viewedTitles = Array.isArray(payload.viewed_titles) ? payload.viewed_titles : [];
            const topK = Number(payload.top_k || 30);

            const reqProxy = http.request({
                hostname: '127.0.0.1',
                port: 5000,
                path: '/api/recommendations/collaborative',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (resProxy) => {
                let data = '';
                resProxy.on('data', chunk => data += chunk);
                resProxy.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ titles: Array.isArray(result) ? result : [] }));
                    } catch(e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Parse error', details: e.message }));
                    }
                });
            });
            reqProxy.setTimeout(5000, () => reqProxy.destroy());
            reqProxy.on('error', () => {
                sendJson(res, 200, { titles: [] });
            });
            reqProxy.write(JSON.stringify({ viewed_titles: viewedTitles, top_k: topK, method: 'item_cf' }));
            reqProxy.end();
        });
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // API: Content-based recommendations
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    if (req.method === 'POST' && req.url === '/api/recommendations/content') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            let payload = {};
            try { payload = JSON.parse(body); } catch (e) {}
            const title = String(payload.title || '');
            const description = String(payload.description || '');
            const topK = Number(payload.top_k || 8);

            const reqProxy = http.request({
                hostname: '127.0.0.1',
                port: 5000,
                path: '/api/recommendations/content',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (resProxy) => {
                let data = '';
                resProxy.on('data', chunk => data += chunk);
                resProxy.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ titles: Array.isArray(result) ? result : [] }));
                    } catch(e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Parse error', details: e.message }));
                    }
                });
            });
            reqProxy.setTimeout(5000, () => reqProxy.destroy());
            reqProxy.on('error', () => {
                sendJson(res, 200, { titles: [] });
            });
            reqProxy.write(JSON.stringify({ title, description, top_k: topK }));
            reqProxy.end();
        });
        return;
    }

    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // Phục vụ file tĩnh (Static File Server)
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
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
            // NgĒn trình duy�!t cache file tĩnh �Ồ luôn load code m�:i nhất
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use.`);
        console.error('Run with another port, for example: $env:PORT=3001; node server.js');
        console.error(`Or stop the process currently using port ${PORT}.`);
        process.exit(1);
    }
    throw error;
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`AI RECOMMENDATION DASHBOARD SERVER`);
    console.log(`Dashboard: http://localhost:${PORT}`);
    console.log(`Khong can chay KhoiDongChromeBot.bat nua!`);
    console.log(`Bot se tu khoi tao Chrome that voi anti-detection.`);
    console.log(`======================================================\n`);

    // Auto-open browser only when allowed. If this fails, keep the API server alive.
    if (process.env.AUTO_OPEN_BROWSER !== 'false') {
        const openCmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        const openArgs = process.platform === 'win32'
            ? `/c start "" "http://localhost:${PORT}"`
            : `http://localhost:${PORT}`;
        try {
            exec(`${openCmd} ${openArgs}`, (error) => {
                if (error) {
                    console.warn(`[WARN] Could not auto-open browser: ${error.message}`);
                }
            });
        } catch (error) {
            console.warn(`[WARN] Could not auto-open browser: ${error.message}`);
        }
    }

    // Start the AI Server (Flask) in the background.
    console.log(`[AI] Starting AI Server on port 5000...`);
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const aiProcess = spawn(pythonCmd, ['ai_server.py'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
    
    // Stop the AI server when Node.js exits.
    process.on('exit', () => {
        aiProcess.kill();
    });
    process.on('SIGINT', () => {
        aiProcess.kill();
        process.exit();
    });
});


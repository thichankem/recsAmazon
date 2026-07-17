const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ time: Date.now() - start, body }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log("🚀 Bắt đầu chạy test Kịch bản 4 (Frontend Flow) 10 lần...");
    const collabData = JSON.stringify({ viewed_titles: ["iPhone 15 Pro Max", "Apple AirPods Pro"], top_k: 5 });
    const contentData = JSON.stringify({ title: "Apple iPhone 15 Pro", description: "Mô tả sản phẩm", top_k: 5 });
    
    let totalCollabTime = 0;
    let totalContentTime = 0;

    for (let i = 1; i <= 10; i++) {
        console.log(`\n--- Lần ${i} ---`);
        
        // Giả lập click vào sản phẩm (Content-Based)
        process.stdout.write("1. Tải gợi ý Chi tiết SP (Content-Based)... ");
        const contentRes = await postRequest('/api/recommendations/content', contentData);
        console.log(`${contentRes.time}ms`);
        totalContentTime += contentRes.time;
        
        // Giả lập quay về trang chủ (Collaborative)
        process.stdout.write("2. Cập nhật Trang chủ (Collaborative Filtering)... ");
        const collabRes = await postRequest('/api/recommendations/collaborative', collabData);
        console.log(`${collabRes.time}ms`);
        totalCollabTime += collabRes.time;
    }
    
    console.log(`\n=================================================`);
    console.log(`KẾT QUẢ TRUNG BÌNH SAU 10 LẦN CHẠY (top_k = 5):`);
    console.log(`- API Chi tiết SP (Content-Based): ${Math.round(totalContentTime/10)} ms`);
    console.log(`- API Trang chủ (Collaborative):   ${Math.round(totalCollabTime/10)} ms`);
    console.log(`=================================================`);
}

runTests();

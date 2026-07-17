const fs = require('fs');
const html = fs.readFileSync('dashboard.html', 'utf8');
const isMatchFuncStr = html.substring(html.indexOf('function extractKeywords'), html.indexOf('function calcOverlap'));
eval(isMatchFuncStr);
const s1 = 'ESR Case Compatible for iPhone 6/6s, Pattern Design Slim Clear Case with Soft TPU Bumper+Hard PC Back Cover for 4.7" iPhone 6 / iPhone 6s_Mint Mandala';
const s2 = 'xinwld Adaptive Hybrid Active Noise Canceling 2026 Wireless Earbuds, 6 Mics ENC Clear Call Ear Buds, Hi-Res Audio Deep Bass Bluetooth 5.4 Headphones, 40H, LED, for Sports Running Gym Workout, Black';
console.log('Result:', isMatch(s1, s2));

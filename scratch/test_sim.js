function getTrigrams(str) {
    const s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const trigrams = new Set();
    for (let i = 0; i < s.length - 2; i++) {
        trigrams.add(s.substring(i, i + 3));
    }
    return trigrams;
}
function calcSim(s1, s2) {
    const set1 = getTrigrams(s1);
    const set2 = getTrigrams(s2);
    let intersection = 0;
    for (let t of set1) if (set2.has(t)) intersection++;
    return intersection / (set1.size + set2.size - intersection);
}
const s1 = 'Magnetic Wireless Charger - Magnet Charging Pad Compatible with iPhone 14/14 pro/14 plus/14 pro max/ 13/13 pro/13 pro max/12 pro max - Mag-Safe Charger for AirPods 3/2/Pro with USB-C 20W PD Adapter';
const s2 = 'Biyoso 5.4 Earbuds Bluetooth Earphone, Dul-Channel with USB-C Charging Case HiFi Stereo, Sound in-Ear Earphones, Touch Control Ear Auto Pairing Headphones for Apple AirPods';
console.log('Sim 1-2:', calcSim(s1, s2));
const s3 = 'ESR Case Compatible for iPhone 6/6s, Pattern Design Slim Clear Case with Soft TPU Bumper+Hard PC Back Cover for 4.7" iPhone 6 / iPhone 6s_Mint Mandala';
const s4 = 'xinwld Adaptive Hybrid Active Noise Canceling 2026 Wireless Earbuds, 6 Mics ENC Clear Call Ear Buds, Hi-Res Audio Deep Bass Bluetooth 5.4 Headphones, 40H, LED, for Sports Running Gym Workout, Black';
console.log('Sim 3-4:', calcSim(s3, s4));
const s5 = 'Apple iPhone 15 Pro Max, 256GB, Titanium';
const s6 = 'iPhone 15 Pro Max Case with MagSafe, Clear';
console.log('Sim 5-6 (Related, but not exact):', calcSim(s5, s6));
const s7 = 'Apple iPhone 15 Pro Max, 256GB, Titanium';
const s8 = 'Apple iPhone 15 Pro Max 256 GB Unlocked Titanium';
console.log('Sim 7-8 (Exact match):', calcSim(s7, s8));

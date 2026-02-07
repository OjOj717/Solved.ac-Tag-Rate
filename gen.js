const fs = require('fs');
const path = require('path');

// 1. 설정: 실제 티어별 점수 구간에 어울리는 가상 데이터 세팅
const tiers = [
    { name: 'BRONZE', tier: 3, rating: 120, color: "#ad5600" },
    { name: 'SILVER', tier: 8, rating: 450, color: "#435f7a" },
    { name: 'GOLD', tier: 13, rating: 1150, color: "#ec9a00" },
    { name: 'PLATINUM', tier: 18, rating: 1950, color: "#27e2a4" },
    { name: 'DIAMOND', tier: 23, rating: 2450, color: "#00b4fc" },
    { name: 'RUBY', tier: 28, rating: 2880, color: "#f63e81" }, // ruby 색상 수정
    { name: 'MASTER', tier: 31, rating: 3100, color: "#b300e0" }  // master 색상 수정
];

const targetKeys = ['math', 'implementation', 'greedy', 'string', 'data_structures', 'graphs', 'dp', 'geometry'];

// 2. 가상 태그 데이터 생성 (실제 API 응답 구조 모방)
const getMockStats = (baseRating) => {
    return targetKeys.map(key => ({
        name: key.slice(0).replace('_', ' '),
        rating: Math.max(baseRating + (Math.random() * 400 - 200), 50)
    }));
};

// 3. radar.js와 동일한 좌표 계산 함수
function getCoordinates(index, total, value, maxValue, centerX, centerY, radius) {
    const angle = (Math.PI * 2 / total) * index - (Math.PI / 2);
    const ratio = Math.max(value / maxValue, 0.05);
    const r = ratio * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
}

// 4. Radar SVG 생성 함수 (radar.js 로직 그대로)
function generateRadarSVG(tierInfo) {
    const stats = getMockStats(tierInfo.rating);
    const theme = 'light';
    const sel = { cardBg: "#f7f8f9", line: "#afb8c2", text: "#333333" };
    
    const width = 500, height = 500, centerX = 250, centerY = 270, radius = 150;
    const maxRating = Math.max(...stats.map(s => s.rating), 1); 
    const rawMax = maxRating * 1.2;

    let step = 100;
    if (rawMax <= 300) step = 50;
    else if (rawMax <= 800) step = 100;
    else if (rawMax <= 2000) step = 200;
    else step = 500;
    
    const maxValue = Math.max(300, Math.ceil(rawMax / step) * step);
    const ticks = [];
    for (let s = step; s <= maxValue; s += step) { ticks.push(s); }

    const points = stats.map((s, i) => {
        const coords = getCoordinates(i, stats.length, s.rating, maxValue, centerX, centerY, radius);
        return `${coords.x},${coords.y}`;
    }).join(' ');

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.15"/>
            </filter>
        </defs>
        <rect width="480" height="480" x="10" y="15" fill="${sel.cardBg}" rx="20" filter="url(#shadow)"/>
        <text x="250" y="55" text-anchor="middle" fill="${tierInfo.color}" font-family="sans-serif" font-size="22" font-weight="bold">${tierInfo.name}'s Rating</text>
        ${ticks.map((score, index) => {
            const r = (score / maxValue) * radius;
            if (index === ticks.length - 1) return '';
            return `
                <circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${sel.line}" stroke-width="1" stroke-dasharray="5,5" opacity="0.4" />
                <text x="${centerX}" y="${centerY - r + 4}" text-anchor="middle" fill="${sel.line}" font-family="sans-serif" font-size="9" font-weight="bold">${score}</text>
                <text x="${centerX}" y="${centerY + r + 4}" text-anchor="middle" fill="${sel.line}" font-family="sans-serif" font-size="9" font-weight="bold">${score}</text>
            `;
        }).join('')}
        <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" fill="${sel.line}" font-family="sans-serif" font-size="10" font-weight="bold">0</text>
        ${stats.map((_, i) => {
            const coords = getCoordinates(i, stats.length, maxValue, maxValue, centerX, centerY, radius);
            return `<line x1="${centerX}" y1="${centerY}" x2="${coords.x}" y2="${coords.y}" stroke="${sel.line}" stroke-width="1" opacity="0.4" />`;
        }).join('')}
        <polygon points="${points}" fill="${tierInfo.color}1A" stroke="${tierInfo.color}" stroke-width="2.5" stroke-linejoin="round" />
        ${stats.map((s, i) => {
            const labelRadius = radius + 20;
            const angle = (Math.PI * 2 / stats.length) * i - (Math.PI / 2);
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            let anchor = (x < centerX - 30) ? "end" : (x > centerX + 30) ? "start" : "middle";
            return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${sel.text}" font-family="sans-serif" font-size="12" font-weight="800">${s.name}</text>`;
        }).join('')}
    </svg>`;
}

// 5. 실행 및 저장
const previewDir = path.join(__dirname, 'preview');
if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir);

tiers.forEach(tier => {
    const svg = generateRadarSVG(tier);
    fs.writeFileSync(path.join(previewDir, `${tier.name.toLowerCase()}.svg`), svg);
    console.log(`✅ Generated: radar-${tier.name.toLowerCase()}.svg`);
});
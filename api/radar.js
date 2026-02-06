const axios = require('axios');

//레이더 차트의 꼭짓점 좌표 계산 함수
function getCoordinates(index, total, value, maxValue, centerX, centerY, radius) {
    const angle = (Math.PI * 2 / total) * index - (Math.PI / 2);
    const ratio = Math.max(value / maxValue, 0.05); // 값이 너무 작아도 최소한의 형태 유지
    const r = ratio * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
}

module.exports = async (req, res) => {
    // 1. 쿼리 파라미터 추출
    const { handle, lang = 'en', theme = 'light' } = req.query;

    if (!handle) {
        return res.status(400).send('Handle is required.');
    }

    try {
        // 2. 유저 정보 및 태그별 레이팅 데이터 병렬 호출
        const [userRes, tagRes] = await Promise.all([
            axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`),
            axios.get(`https://solved.ac/api/v3/user/tag_ratings?handle=${handle}`)
        ]);

        const tier = userRes.data.tier;
        const allTags = tagRes.data;
        // 차트에 표시할 핵심 8개 알고리즘 키워드
        const targetKeys = ['math', 'implementation', 'greedy', 'string', 'data_structures', 'graphs', 'dp', 'geometry'];

        // 3. 현재 유저 티어에 따른 포인트 컬러 설정
        let tierColor = "#333"; 
        if (tier >= 1 && tier <= 5) tierColor = "#ad5600"; // Bronze
        else if (tier >= 6 && tier <= 10) tierColor = "#435f7a"; // Silver
        else if (tier >= 11 && tier <= 15) tierColor = "#ec9a00"; // Gold
        else if (tier >= 16 && tier <= 20) tierColor = "#27e2a4"; // Platinum
        else if (tier >= 21 && tier <= 25) tierColor = "#00b4fc"; // Diamond
        else if (tier >= 26 && tier <= 30) tierColor = "#f63e81"; // Ruby
        else if (tier >= 31) tierColor = "#b300e0"; // Master

        // 4. 테마별 UI 색상 정의
        const themes = {
            light: {
                cardBg: "#f7f8f9",
                line: "#afb8c2",
                text: "#333333",
                shadow: "rgba(0,0,0,0.15)"
            },
            dark: {
                cardBg: "#24283b",
                line: "#444b6a",
                tick: "#787c99",
                text: "#a9b1d6",
                shadow: "rgba(0,0,0,0.5)"
            },
            paper: {
                cardBg: "#fdf6e3",
                line: "#93a1a1",
                tick: "#93a1a1",
                text: "#586e75",
                shadow: "rgba(0,0,0,0.25)"
            }
        };

        const sel = themes[theme] || themes.light;

        // 5. 표시할 알고리즘 이름 및 레이팅 데이터 매핑
        const stats = targetKeys.map(key => {
            const found = allTags.find(t => t.tag.key === key);
            const displayNameObj = found?.tag?.displayNames?.find(d => d.language === lang);
            
            let name = displayNameObj ? displayNameObj.name : key;
            const rating = found ? found.rating : 0;

            if (lang === 'en' && key === 'dp') {
                name = 'dp'; // DP 예외 처리
            }

            return { name, rating };
        });

        // 6. 차트 스케일 및 가이드 라인(Ticks) 계산
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
        for (let s = step; s <= maxValue; s += step) {
            ticks.push(s);
        }

        // 7. 레이더 다각형(Polygon) 좌표 문자열 생성
        const points = stats.map((s, i) => {
            const coords = getCoordinates(i, stats.length, s.rating, maxValue, centerX, centerY, radius);
            return `${coords.x},${coords.y}`;
        }).join(' ');

        // 8. 최종 SVG 조립
        const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="${theme === 'light' ? '0.15' : '0.4'}"/>
                </filter>
            </defs>

            <rect width="480" height="480" x="10" y="15" fill="${sel.cardBg}" rx="20" filter="url(#shadow)"/>
            
            <text x="250" y="55" text-anchor="middle" fill="${tierColor}" font-family="sans-serif" font-size="22" font-weight="bold">${handle}'s Rating</text>
            
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

            <polygon points="${points}" fill="${tierColor}${theme === 'light' ? '1A' : '33'}" stroke="${tierColor}" stroke-width="2.5" stroke-linejoin="round" />

            ${stats.map((s, i) => {
                const labelRadius = radius + 20;
                const angle = (Math.PI * 2 / stats.length) * i - (Math.PI / 2);
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                let anchor = (x < centerX - 30) ? "end" : (x > centerX + 30) ? "start" : "middle";

                const words = (lang === 'ko') ? s.name.split(' ') : [s.name];
                return `
                    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="${sel.text}" font-family="sans-serif" font-size="12" font-weight="800">
                        ${words.map((word, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : '1.2em'}">${word}</tspan>`).join('')}
                    </text>
                `;
            }).join('')}
        </svg>`;

        // 9. 응답 헤더 설정 및 전송
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send(svg);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error');
    }
};
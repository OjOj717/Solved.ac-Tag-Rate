const axios = require('axios');

function getCoordinates(index, total, value, maxValue, centerX, centerY, radius) {
    // 8개로 나누어 각도를 계산 (시작점 보정을 위해 -90도(PI/2) 처리)
    const angle = (Math.PI * 2 / total) * index - (Math.PI / 2);
    // 최대값 대비 현재 점수의 비율 (최소 5%는 보이도록 설정하여 가독성 확보)
    const ratio = Math.max(value / maxValue, 0.05);
    const r = ratio * radius;
    
    // 삼각함수(cos, sin)를 이용하여 원형 궤도의 x, y 좌표 변환
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
}

module.exports = async (req, res) => {
    // [0] URL 파라미터에서 유저 아이디(handle) 추출
    const { handle, lang = 'en' } = req.query;

    if (!handle) {
        return res.status(400).send('Handle is required. Usage: ?handle=USER_ID');
    }

    try {
        // [1] 유저 정보와 태그 레이팅 정보를 가져옴
        const [userRes, tagRes] = await Promise.all([
            axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`),
            axios.get(`https://solved.ac/api/v3/user/tag_ratings?handle=${handle}`)
        ]);
        const tier = userRes.data.tier;
        const allTags = tagRes.data;

        // [2] 차트에 표시할 8개 핵심 알고리즘 태그, 티어별 색상 정의
        const targetKeys = ['math', 'implementation', 'greedy', 'string', 'data_structures', 'graphs', 'dp', 'geometry'];

        let tierColor = "#333"; // 기본값
        if (tier >= 1 && tier <= 5) tierColor = "#ad5600";      // Bronze
        else if (tier >= 6 && tier <= 10) tierColor = "#435f7a";   // Silver
        else if (tier >= 11 && tier <= 15) tierColor = "#ec9a00";  // Gold
        else if (tier >= 16 && tier <= 20) tierColor = "#27e2a4";  // Platinum
        else if (tier >= 21 && tier <= 25) tierColor = "#00b4fc";  // Diamond
        else if (tier >= 26 && tier <= 30) tierColor = "#ff0062";  // Ruby
        else if (tier >= 31) tierColor = "#b491ff";                // Master

        // [3] API 데이터에서 targetTags에 해당하는 점수만 매칭
        const stats = targetKeys.map(key => {
            const found = allTags.find(t => t.tag.key === key);
            
            // API의 displayNames에서 사용자가 요청한 언어(lang)와 일치하는 이름을 찾음
            const displayNameObj = found?.tag.displayNames.find(d => d.language === lang);
            
            // 해당 언어 설정이 없으면 기본 key값 출력
            const name = displayNameObj ? displayNameObj.name : key;
            const rating = found ? found.rating : 0;

            return { name, rating };
        });

        // [4] SVG 레이아웃 및 스케일 설정
        const width = 500, height = 500, centerX = 250, centerY = 270, radius = 150;
        const maxRating = Math.max(...stats.map(s => s.rating));

        // 가장 높은 점수의 1.2배를 기준으로 최적의 눈금 간격(step) 결정
        const rawMax = maxRating * 1.2;
        let step = 100; // 기본값

        if (rawMax <= 300) step = 50;
        else if (rawMax <= 800) step = 100;
        else if (rawMax <= 2000) step = 200;
        else step = 500;
        
        const maxValue = Math.max(300, Math.ceil(rawMax / step) * step);

        const ticks = [];
        for (let s = step; s <= maxValue; s += step) {
            ticks.push(s);
        }

        // [5] 유저 점수 데이터 폴리곤(다각형) 좌표 생성
        const points = stats.map((s, i) => {
            const { x, y } = getCoordinates(i, stats.length, s.rating, maxValue, centerX, centerY, radius);
            return `${x},${y}`;
        }).join(' ');

        // [6] 최종 SVG 이미지 생성
        const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f7f8f9" rx="20"/>
            <text x="250" y="45" text-anchor="middle" fill="${tierColor}" font-family="sans-serif" font-size="20" font-weight="bold" opacity="0.9">${handle.toUpperCase()}'S RATING</text>
            
            
            ${stats.map((_, i) => {
                const { x, y } = getCoordinates(i, stats.length, maxValue, maxValue, centerX, centerY, radius);
                return `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#afb8c2" stroke-width="1" opacity="0.3" />`;
            }).join('')}

            <polygon points="${points}" fill="${tierColor}1A" stroke="${tierColor}" stroke-width="2.5" stroke-linejoin="round" />

            ${stats.map((s, i) => {
                const labelRadius = radius + 15;
                const angle = (Math.PI * 2 / stats.length) * i - (Math.PI / 2);
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                
                let anchor = "middle";
                if (x < centerX - 30) anchor = "end";
                else if (x > centerX + 30) anchor = "start";

                // 띄어쓰기 기준으로 단어 분리 (엔터 효과)
                const words = (lang === 'ko') ? s.name.split(' ') : [s.name];
                
                return `
                    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="#333" font-family="sans-serif" font-size="12" font-weight="500">
                        ${words.map((word, index) => 
                            `<tspan x="${x}" dy="${index === 0 ? 0 : '1.2em'}">${word}</tspan>`
                        ).join('')}
                    </text>
                `;
            }).join('')}
        </svg>`;

        // [10] 응답 헤더 설정 및 SVG 데이터 전송
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send(svg);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating radar chart');
    }
};
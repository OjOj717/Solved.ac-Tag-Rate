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
    const { handle } = req.query;

    if (!handle) {
        return res.status(400).send('Handle is required. Usage: ?handle=USER_ID');
    }

    try {
        // [1] solved.ac 공식 API에서 유저의 태그별 레이팅 정보를 직접 가져옴
        const response = await axios.get(`https://solved.ac/api/v3/user/tag_ratings?handle=${handle}`);
        const allTags = response.data;

        // [2] 차트에 표시할 8개 핵심 알고리즘 태그 정의
        const targetTags = [
            { key: 'math', name: '수학' },
            { key: 'implementation', name: '구현' },
            { key: 'greedy', name: '그리디' },
            { key: 'string', name: '문자열' },
            { key: 'data_structures', name: '자료 구조' },
            { key: 'graphs', name: '그래프' },
            { key: 'dp', name: 'DP' },
            { key: 'geometry', name: '기하학' }
        ];

        // [3] API 데이터에서 targetTags에 해당하는 점수만 매칭
        const stats = targetTags.map(tagInfo => {
            const found = allTags.find(t => t.tag.key === tagInfo.key);
            return { name: tagInfo.name, rating: (found && found.rating)};
        });

        // [4] SVG 레이아웃 및 스케일 설정
        const width = 500, height = 500, centerX = 250, centerY = 250, radius = 150;
        const maxRating = Math.max(...stats.map(s => s.rating));
        
        // 가장 높은 점수의 1.2배를 최대치로 설정 (최소 100점)
        const maxValue = Math.max(100, maxRating * 1.2);

        // [5] 유저 점수 데이터 폴리곤(다각형) 좌표 생성
        const points = stats.map((s, i) => {
            const { x, y } = getCoordinates(i, stats.length, s.rating, maxValue, centerX, centerY, radius);
            return `${x},${y}`;
        }).join(' ');

        // [6] 최종 SVG 이미지 생성
        const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#0d1117" rx="20"/>
            <text x="250" y="40" text-anchor="middle" fill="#58a6ff" font-family="sans-serif" font-size="22" font-weight="bold">${handle.toUpperCase()}'S RATING</text>
            
            ${[0.2, 0.4, 0.6, 0.8, 1].map(f => {
                const gp = stats.map((_, i) => {
                    const { x, y } = getCoordinates(i, stats.length, maxValue * f, maxValue, centerX, centerY, radius);
                    return `${x},${y}`;
                }).join(' ');
                return `<polygon points="${gp}" fill="none" stroke="#30363d" stroke-width="1" />`;
            }).join('')}

            <polygon points="${points}" fill="rgba(88, 166, 255, 0.3)" stroke="#58a6ff" stroke-width="3" stroke-linejoin="round" />

            ${stats.map((s, i) => {
                // 라벨은 점수 비율과 상관없이 차트 바깥(radius + 45)에 고정 배치하여 가독성 증대
                const labelRadius = radius + 45;
                const angle = (Math.PI * 2 / stats.length) * i - (Math.PI / 2);
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                
                // 텍스트 x 좌표에 따라 좌측/우측/중앙 정렬(anchor) 동적 처리
                let anchor = "middle";
                if (x < centerX - 30) anchor = "end";      // 좌측 라벨
                else if (x > centerX + 30) anchor = "start"; // 우측 라벨

                return `
                    <text x="${x}" y="${y - 5}" text-anchor="${anchor}" fill="#c9d1d9" font-family="sans-serif" font-size="13" font-weight="bold">${s.name}</text>
                    <text x="${x}" y="${y + 10}" text-anchor="${anchor}" fill="#58a6ff" font-family="sans-serif" font-size="11">${s.rating === 3 ? '-' : s.rating}</text>
                `;
            }).join('')}
        </svg>`;

        // [10] 응답 헤더 설정 및 SVG 데이터 전송
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 1시간 캐싱
        res.status(200).send(svg);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating radar chart');
    }
};
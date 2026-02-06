const axios = require('axios');

function getCoordinates(index, total, value, maxValue, centerX, centerY, radius) {
    const angle = (Math.PI * 2 / total) * index - (Math.PI / 2);
    const ratio = Math.max(value / maxValue, 0.05);
    const r = ratio * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
}

module.exports = async (req, res) => {
    const { handle, lang = 'en', theme = 'light' } = req.query;

    if (!handle) {
        return res.status(400).send('Handle is required.');
    }

    try {
        const [userRes, tagRes] = await Promise.all([
            axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`),
            axios.get(`https://solved.ac/api/v3/user/tag_ratings?handle=${handle}`)
        ]);

        const tier = userRes.data.tier;
        const allTags = tagRes.data;
        const targetKeys = ['math', 'implementation', 'greedy', 'string', 'data_structures', 'graphs', 'dp', 'geometry'];

        let tierColor = "#333"; 
        if (tier >= 1 && tier <= 5) tierColor = "#ad5600";
        else if (tier >= 6 && tier <= 10) tierColor = "#435f7a";
        else if (tier >= 11 && tier <= 15) tierColor = "#ec9a00";
        else if (tier >= 16 && tier <= 20) tierColor = "#27e2a4";
        else if (tier >= 21 && tier <= 25) tierColor = "#00b4fc";
        else if (tier >= 26 && tier <= 30) tierColor = "#f63e81";
        else if (tier >= 31) tierColor = "#b300e0";

        const themes = {
            light: {
                bg: "#f7f8f9",
                cardBg: "#ffffff",
                line: "#afb8c2",
                tick: "#adb5bd",
                text: "#333333",
                shadow: "rgba(0,0,0,0.15)"
            },
            dark: {
                bg: "#1a1b27",
                cardBg: "#24283b",
                line: "#444b6a",
                tick: "#787c99",
                text: "#a9b1d6",
                shadow: "rgba(0,0,0,0.5)"
            },
            midnight: {
                bg: "#0d1117",
                cardBg: "#161b22",
                line: "#30363d",
                tick: "#8b949e",
                text: "#c9d1d9",
                shadow: "rgba(0,0,0,0.6)"
            }
        };

        const sel = themes[theme] || themes.light;

        const stats = targetKeys.map(key => {
            const found = allTags.find(t => t.tag.key === key);
            const displayNameObj = found?.tag?.displayNames?.find(d => d.language === lang);
            
            let name = displayNameObj ? displayNameObj.name : key;
            const rating = found ? found.rating : 0;

            if (lang === 'en' && key === 'dp') {
                name = 'dp';
            }

            return { name, rating };
        });

        const width = 500, height = 500, centerX = 250, centerY = 270, radius = 150;
        const maxRating = Math.max(...stats.map(s => s.rating), 1); // 0 나누기 방지
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

        const points = stats.map((s, i) => {
            const coords = getCoordinates(i, stats.length, s.rating, maxValue, centerX, centerY, radius);
            return `${coords.x},${coords.y}`;
        }).join(' ');

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
                    <circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${sel.tick}" stroke-width="1" stroke-dasharray="5,5" opacity="0.4" />
                    <text x="${centerX}" y="${centerY - r + 4}" text-anchor="middle" fill="${sel.tick}" font-family="sans-serif" font-size="9" font-weight="bold">${score}</text>
                    <text x="${centerX}" y="${centerY + r + 4}" text-anchor="middle" fill="${sel.tick}" font-family="sans-serif" font-size="9" font-weight="bold">${score}</text>
                `;
            }).join('')}
            
            <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" fill="${sel.tick}" font-family="sans-serif" font-size="10" font-weight="bold">0</text>

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

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send(svg);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error');
    }
};
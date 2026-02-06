const axios = require('axios');

function getTierInfo(rating) {
    if (rating >= 3000) return { color: "#b491ff", id: 31 }; // Master
    if (rating >= 2950) return { color: "#ff0062", id: 30 }; // Ruby
    if (rating >= 2900) return { color: "#ff0062", id: 29 };
    if (rating >= 2850) return { color: "#ff0062", id: 28 };
    if (rating >= 2800) return { color: "#ff0062", id: 27 };
    if (rating >= 2700) return { color: "#ff0062", id: 26 };
    if (rating >= 2600) return { color: "#00b4fc", id: 25 }; // Diamond
    if (rating >= 2500) return { color: "#00b4fc", id: 24 };
    if (rating >= 2400) return { color: "#00b4fc", id: 23 };
    if (rating >= 2300) return { color: "#00b4fc", id: 22 };
    if (rating >= 2200) return { color: "#00b4fc", id: 21 };
    if (rating >= 2100) return { color: "#27e2a4", id: 20 }; // Platinum
    if (rating >= 2000) return { color: "#27e2a4", id: 19 };
    if (rating >= 1900) return { color: "#27e2a4", id: 18 };
    if (rating >= 1750) return { color: "#27e2a4", id: 17 };
    if (rating >= 1600) return { color: "#27e2a4", id: 16 };
    if (rating >= 1400) return { color: "#ec9a00", id: 15 }; // Gold
    if (rating >= 1250) return { color: "#ec9a00", id: 14 };
    if (rating >= 1100) return { color: "#ec9a00", id: 13 };
    if (rating >= 950) return { color: "#ec9a00", id: 12 };
    if (rating >= 800) return { color: "#ec9a00", id: 11 };
    if (rating >= 650) return { color: "#435f7a", id: 10 }; // Silver
    if (rating >= 500) return { color: "#435f7a", id: 9 };
    if (rating >= 400) return { color: "#435f7a", id: 8 };
    if (rating >= 300) return { color: "#435f7a", id: 7 };
    if (rating >= 200) return { color: "#435f7a", id: 6 };
    if (rating >= 150) return { color: "#ad5600", id: 5 }; // Bronze
    if (rating >= 120) return { color: "#ad5600", id: 4 };
    if (rating >= 90) return { color: "#ad5600", id: 3 };
    if (rating >= 60) return { color: "#ad5600", id: 2 };
    if (rating >= 30) return { color: "#ad5600", id: 1 };
    return { color: "#333", id: 0 }; // Unrated
}
module.exports = async (req, res) => {
    const { handle, lang = 'en', theme = 'light' } = req.query;
    if (!handle) return res.status(400).send('Handle is required.');

    try {
        const [tagRes, userRes] = await Promise.all([
            axios.get(`https://solved.ac/api/v3/user/tag_ratings?handle=${handle}`),
            axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`)
        ]);

        const allTags = tagRes.data || [];
        const userSolvedCount = userRes.data?.solvedCount || 1;

        if (allTags.length === 0) return res.status(404).send('No tag data found.');

        const topTags = allTags.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

        const headerLabels = {
            ko: { tag: "태그", solved: "문제", rating: "레이팅" },
            en: { tag: "Tag", solved: "Solved", rating: "Rating" }
        };
        const labels = headerLabels[lang] || headerLabels.en;

        const themes = {
            light: { cardBg: "#f7f8f9", line: "#afb8c2", text: "#333333", subText: "#666666", shadow: "rgba(0,0,0,0.15)" },
            dark: { cardBg: "#24283b", line: "#444b6a", text: "#a9b1d6", subText: "#787c99", shadow: "rgba(0,0,0,0.5)" },
            paper: { cardBg: "#fdf6e3", line: "#93a1a1", text: "#586e75", subText: "#839496", shadow: "rgba(0,0,0,0.25)" }
        };
        const sel = themes[theme] || themes.light;

        const width = 450;
        const itemHeight = 50;
        const padding = 25;
        const headerHeight = 65;
        const height = headerHeight + (topTags.length * itemHeight) + padding;

        const col1X = padding + 50;
        const col2X = width - 145;
        const col3X = width - 55;

        const listItems = topTags.map((t, i) => {
            const y = headerHeight + (i * itemHeight);
            const displayNameObj = t.tag?.displayNames?.find(d => d.language === lang) || t.tag?.displayNames?.find(d => d.language === 'en');
            const name = displayNameObj ? displayNameObj.name : (t.tag?.key || 'Unknown');
            const tier = getTierInfo(t.rating || 0);
            
            const solvedCount = t.solvedCount || 0;
            const percentage = ((solvedCount / userSolvedCount) * 100).toFixed(1);

            return `
                <g transform="translate(0, ${y})">
                    <text x="${padding}" y="25" fill="${sel.text}" font-family="sans-serif" font-size="13" font-weight="bold"># ${name}</text>
                    <text x="${col2X - 15}" y="25" fill="${sel.text}" font-family="sans-serif" font-size="13" text-anchor="end">${solvedCount}</text>
                    <text x="${col2X + 5}" y="25" fill="${sel.subText}" font-family="sans-serif" font-size="12" text-anchor="start" opacity="0.8">${percentage}%</text>

                    <image href="https://static.solved.ac/tier_small/${tier.id}.svg" x="${width - 100}" y="8" width="20" height="20" />
                    
                    <text x="${width - padding}" y="25" fill="${tier.color}" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="end">${t.rating || 0}</text>
                    <line x1="${padding}" y1="45" x2="${width - padding}" y2="45" stroke="${sel.line}" stroke-width="1" opacity="0.3" />
                </g>
            `;
        }).join('');

        const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.1"/></filter></defs>
            <rect width="${width - 10}" height="${height - 10}" x="5" y="5" fill="${sel.cardBg}" rx="15" filter="url(#shadow)"/>
            <text x="${col1X}" y="40" fill="${sel.subText}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${labels.tag}</text>
            <text x="${col2X}" y="40" fill="${sel.subText}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${labels.solved}</text>
            <text x="${col3X}" y="40" fill="${sel.subText}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${labels.rating}</text>
            <line x1="${padding}" y1="52" x2="${width - padding}" y2="52" stroke="${sel.text}" stroke-width="2" opacity="0.5" />
            ${listItems}
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send(svg);
    } catch (e) {
        res.status(500).send('Function Invocation Failed');
    }
};
const axios = require('axios');

function getTierInfo(rating) {
    if (rating >= 3000) return { name: "Master", color: "#b491ff", level: "M" };
    
    // Ruby (2700 ~ 2950)
    if (rating >= 2950) return { name: "Ruby I", color: "#ff0062", level: "1" };
    if (rating >= 2900) return { name: "Ruby II", color: "#ff0062", level: "2" };
    if (rating >= 2850) return { name: "Ruby III", color: "#ff0062", level: "3" };
    if (rating >= 2800) return { name: "Ruby IV", color: "#ff0062", level: "4" };
    if (rating >= 2700) return { name: "Ruby V", color: "#ff0062", level: "5" };
    
    // Diamond (2200 ~ 2600)
    if (rating >= 2600) return { name: "Diamond I", color: "#00b4fc", level: "1" };
    if (rating >= 2500) return { name: "Diamond II", color: "#00b4fc", level: "2" };
    if (rating >= 2400) return { name: "Diamond III", color: "#00b4fc", level: "3" };
    if (rating >= 2300) return { name: "Diamond IV", color: "#00b4fc", level: "4" };
    if (rating >= 2200) return { name: "Diamond V", color: "#00b4fc", level: "5" };
    
    // Platinum (1600 ~ 2100)
    if (rating >= 2100) return { name: "Platinum I", color: "#27e2a4", level: "1" };
    if (rating >= 2000) return { name: "Platinum II", color: "#27e2a4", level: "2" };
    if (rating >= 1900) return { name: "Platinum III", color: "#27e2a4", level: "3" };
    if (rating >= 1750) return { name: "Platinum IV", color: "#27e2a4", level: "4" };
    if (rating >= 1600) return { name: "Platinum V", color: "#27e2a4", level: "5" };
    
    // Gold (800 ~ 1400)
    if (rating >= 1400) return { name: "Gold I", color: "#ec9a00", level: "1" };
    if (rating >= 1250) return { name: "Gold II", color: "#ec9a00", level: "2" };
    if (rating >= 1100) return { name: "Gold III", color: "#ec9a00", level: "3" };
    if (rating >= 950) return { name: "Gold IV", color: "#ec9a00", level: "4" };
    if (rating >= 800) return { name: "Gold V", color: "#ec9a00", level: "5" };
    
    // Silver (200 ~ 650)
    if (rating >= 650) return { name: "Silver I", color: "#435f7a", level: "1" };
    if (rating >= 500) return { name: "Silver II", color: "#435f7a", level: "2" };
    if (rating >= 400) return { name: "Silver III", color: "#435f7a", level: "3" };
    if (rating >= 300) return { name: "Silver IV", color: "#435f7a", level: "4" };
    if (rating >= 200) return { name: "Silver V", color: "#435f7a", level: "5" };
    
    // Bronze (30 ~ 150)
    if (rating >= 150) return { name: "Bronze I", color: "#ad5600", level: "1" };
    if (rating >= 120) return { name: "Bronze II", color: "#ad5600", level: "2" };
    if (rating >= 90) return { name: "Bronze III", color: "#ad5600", level: "3" };
    if (rating >= 60) return { name: "Bronze IV", color: "#ad5600", level: "4" };
    if (rating >= 30) return { name: "Bronze V", color: "#ad5600", level: "5" };
    
    return { name: "Unrated", color: "#333", level: "?" };
}

module.exports = async (req, res) => {
    const { handle, lang = 'ko', theme = 'light' } = req.query;

    if (!handle) return res.status(400).send('Handle is required.');

    try {
        const response = await axios.get(`https://solved.ac/api/v3/user/tag_ratings?handle=${handle}`);
        const allTags = response.data || [];

        if (allTags.length === 0) {
            return res.status(404).send('No tag data found for this user.');
        }

        const topTags = allTags
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 10);

        // 헤더 다국어 설정
        const headerLabels = {
            ko: { tag: "태그", solved: "문제", rating: "레이팅" },
            en: { tag: "Tag", solved: "Solved", rating: "Rating" },
            ja: { tag: "タグ", solved: "問題", rating: "レーティング" }
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

            return `
                <g transform="translate(0, ${y})">
                    <text x="${padding}" y="25" fill="${sel.text}" font-family="sans-serif" font-size="13" font-weight="bold"># ${name}</text>
                    <text x="${col2X}" y="25" fill="${sel.subText}" font-family="sans-serif" font-size="13" text-anchor="middle">${t.solvedCount || 0}</text>
                    <rect x="${width - 92}" y="10" width="14" height="18" fill="${tier.color}" rx="2"/>
                    <text x="${width - 85}" y="23" fill="#fff" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${tier.level}</text>
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
        console.error(e);
        res.status(500).send('Function Invocation Failed');
    }
};
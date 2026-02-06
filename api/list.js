const axios = require('axios');

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

        const themes = {
            light: {
                cardBg: "#f7f8f9",
                line: "#afb8c2",
                text: "#333333",
                subText: "#666666",
                shadow: "rgba(0,0,0,0.15)"
            },
            dark: {
                cardBg: "#24283b",
                line: "#444b6a",
                text: "#a9b1d6",
                subText: "#787c99",
                shadow: "rgba(0,0,0,0.5)"
            },
            paper: {
                cardBg: "#fdf6e3",
                line: "#93a1a1",
                text: "#586e75",
                subText: "#839496",
                shadow: "rgba(0,0,0,0.25)"
            }
        };
        const sel = themes[theme] || themes.light;

        const width = 450;
        const itemHeight = 50;
        const padding = 20;
        const headerHeight = 60;
        const height = headerHeight + (topTags.length * itemHeight) + padding;

        const listItems = topTags.map((t, i) => {
            const y = headerHeight + (i * itemHeight);
            const displayNameObj = t.tag?.displayNames?.find(d => d.language === lang) 
                                 || t.tag?.displayNames?.find(d => d.language === 'en');
            const name = displayNameObj ? displayNameObj.name : (t.tag?.key || 'Unknown');

            const rating = t.rating || 0;
            const solvedCount = t.solvedCount || 0;

            let tagColor = "#333"; 
            if (rating < 800) tagColor = "#ad5600";
            else if (rating < 1200) tagColor = "#435f7a";
            else if (rating < 1600) tagColor = "#ec9a00";
            else if (rating < 2000) tagColor = "#27e2a4";
            else if (rating < 2400) tagColor = "#00b4fc";
            else if (rating < 2700) tagColor = "#f63e81";
            else tagColor = "#b300e0";

            return `
                <g transform="translate(0, ${y})">
                    <text x="${padding}" y="25" fill="${sel.text}" font-family="sans-serif" font-size="14" font-weight="bold"># ${name}</text>
                    <text x="${width - 130}" y="25" fill="${sel.subText}" font-family="sans-serif" font-size="13" text-anchor="end">${solvedCount}</text>
                    <rect x="${width - 95}" y="10" width="12" height="18" fill="${tagColor}" rx="2"/>
                    <text x="${width - padding}" y="25" fill="${tagColor}" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="end">${rating}</text>
                    <line x1="${padding}" y1="45" x2="${width - padding}" y2="45" stroke="${sel.line}" stroke-width="1" opacity="0.5" />
                </g>
            `;
        }).join('');

        const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.1"/>
                </filter>
            </defs>
            <rect width="${width - 10}" height="${height - 10}" x="5" y="5" fill="${sel.cardBg}" rx="15" filter="url(#shadow)"/>
            
            <text x="${padding}" y="35" fill="${sel.subText}" font-family="sans-serif" font-size="12" font-weight="bold">태그</text>
            <text x="${width - 130}" y="35" fill="${sel.subText}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">문제</text>
            <text x="${width - padding}" y="35" fill="${sel.subText}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">레이팅</text>
            <line x1="${padding}" y1="48" x2="${width - padding}" y2="48" stroke="${sel.text}" stroke-width="2" opacity="0.8" />

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
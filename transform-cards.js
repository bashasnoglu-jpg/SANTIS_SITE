const fs = require('fs');

const path = 'C:/Users/tourg/Desktop/SANTIS_SITE/masaj.html';
const html = fs.readFileSync(path, 'utf8');

const transformRail = (content) => {
    return content.replace(/<article class="santis-premium-card" onclick="window\.location\.href='(.*?)'" onmouseenter="(.*?)">\s*<img src="(.*?)" alt=".*?" style="(.*?)" loading="lazy">\s*<div class="santis-card-overlay"><\/div>\s*<div class="santis-card-content">\s*<div class="santis-card-meta">\s*<span class="santis-card-pill" data-lang="tr">⏱ (.*?)<\/span><span class="santis-card-pill" data-lang="en" style="display:none;">⏱ (.*?)<\/span>\s*<span class="santis-card-pill">💎 (.*?)<\/span>\s*<\/div>\s*<h3 class="santis-card-title" data-lang="tr">(.*?)<\/h3><h3 class="santis-card-title" data-lang="en" style="display:none;">(.*?)<\/h3>\s*<\/div>\s*<\/article>/g,
    (match, link, onenter, img, style, trTime, enTime, price, trTitle, enTitle) => {
        // extract filter if present, usually 'filter: grayscale(10%);' -> 'grayscale(10%)'
        let filterMatch = style.match(/filter:\s*(.*?);/);
        let fx = filterMatch ? filterMatch[1] : '';

        return `<div class="santis-stack-card santis-signature-card" style="--card-img: url(${img}); --card-fx: ${fx};" onclick="window.location.href='${link}'" onmouseenter="${onenter}">
            <h3 data-morph="title" data-lang="tr">${trTitle}</h3>
            <h3 data-morph="title" data-lang="en" style="display:none;">${enTitle}</h3>
            <span class="santis-stack-meta" data-lang="tr">${price}</span>
            <span class="santis-stack-meta" data-lang="en" style="display:none;">${price}</span>
        
            <div class="santis-reveal-data">
                <h2 class="santis-ghost-heading" data-lang="tr">${trTitle}</h2>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff; display:none;" data-lang="en">${enTitle}</h2>
                <p class="santis-ghost-text" data-lang="tr">Sovereign Club ayrıcalıklarıyla donatılmış premium masaj deneyimi. Bedeninizi dinleyin, sessizliği biz sunuyoruz.</p>
                <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5); display:none;" data-lang="en">A premium massage experience empowered by Sovereign Club privileges. Listen to your body, we provide the silence.</p>
                <div class="santis-ghost-meta-container">
                    <div class="santis-ghost-meta-box">
                        <span class="santis-ghost-meta-label" data-lang="tr">SÜRE</span>
                        <span style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px; display:none;" data-lang="en">DURATION</span>
                        <strong class="santis-ghost-meta-value" data-lang="tr">${trTime}</strong>
                        <strong style="font-size: 1.3rem; display:none;" data-lang="en">${enTime}</strong>
                    </div>
                    <div class="santis-ghost-meta-box">
                        <span class="santis-ghost-meta-label" data-lang="tr">FİYAT</span>
                        <span style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px; display:none;" data-lang="en">PRICE</span>
                        <strong class="santis-ghost-meta-value" data-lang="tr">${price}</strong>
                        <strong style="font-size: 1.3rem; display:none;" data-lang="en">${price}</strong>
                    </div>
                </div>
                <!-- Action link is on the card itself via onclick, but we can keep these visual buttons -->
                <a href="${link}" class="santis-btn santis-btn-primary santis-magnetic" style="padding: 16px 40px; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212,175,55,0.2);" data-lang="tr" onclick="event.stopPropagation();">
                    HEMEN REZERVASYON
                </a>
                <a href="${link}" class="santis-btn santis-btn-primary santis-magnetic" style="padding: 16px 40px; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212,175,55,0.2); display:none;" data-lang="en" onclick="event.stopPropagation();">
                    RESERVE NOW
                </a>
            </div>
        </div>`;
    });
};

let output = html.replace(/<div class="santis-premium-rail"(.*?)>([\s\S]*?)<\/div>\s*<\/section>/g, (match, attrs, content) => {
    let replacedContent = transformRail(content);
    // Replace the rail container with the stage container
    return `<div class="santis-carousel-stage custom-cover-flow"${attrs} style="height: 60dvh; min-height: 400px; width: 100%; position: relative; contain: strict;">\n${replacedContent}\n</div>\n        </section>`;
});

fs.writeFileSync(path, output);
console.log("Transformation Complete!");

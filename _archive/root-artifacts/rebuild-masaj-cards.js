const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'masaj.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(/<article class="santis-premium-card"[\s\S]*?<\/article>/g, (match) => {
    let serviceIdMatch = match.match(/data-service-id="([^"]+)"/);
    let categoryMatch = match.match(/data-category="([^"]+)"/);
    // If not found, try to extract from onclick
    let clickMatch = match.match(/service=([^'"]+)/);
    let serviceId = serviceIdMatch ? serviceIdMatch[1] : (clickMatch ? clickMatch[1] : '');
    
    let category = categoryMatch ? categoryMatch[1] : '';
    let imgSrcMatch = match.match(/<img src="([^"]+)"/);
    let filterMatch = match.match(/style="filter:\s*(.*?);"/);
    let timeMatch = match.match(/<span class="santis-card-pill" data-lang="tr">([^<]+)<\/span>/);
    let priceMatch = match.match(/<span class="santis-card-pill">([^<]+)<\/span>/);
    let titleMatch = match.match(/<h3 class="santis-card-title" data-lang="tr">([^<]+)<\/h3>/);
    let enTitleMatch = match.match(/<h3 class="santis-card-title" data-lang="en" style="display:none;">([^<]+)<\/h3>/);
    let timeEnMatch = match.match(/<span class="santis-card-pill" data-lang="en" style="display:none;">([^<]+)<\/span>/);
    
    let imgSrc = imgSrcMatch ? imgSrcMatch[1] : '/assets/img/cards/santis_hero_massage_lux.webp';
    let filter = filterMatch ? filterMatch[1] : 'none';
    let time = timeMatch ? timeMatch[1].replace('⏱ ', '') : '';
    let timeEn = timeEnMatch ? timeEnMatch[1].replace('⏱ ', '') : '';
    let price = priceMatch ? priceMatch[1].replace('💎 ', '') : '';
    let title = titleMatch ? titleMatch[1] : '';
    let titleEn = enTitleMatch ? enTitleMatch[1] : title;
    
    let clickStr = `window.location.href='/spa-booking.html?service=${serviceId}'`;
    let enterStr = `window.SovereignTelemetry && window.SovereignTelemetry.reportServiceView('${serviceId}')`;
    
    return `<div class="santis-stack-card santis-signature-card" data-service-id="${serviceId}" data-category="${category}" style="--card-img: url(${imgSrc}); --card-fx: ${filter};" onclick="${clickStr}" onmouseenter="${enterStr}">
        <h3 data-morph="title" data-lang="tr">${title}</h3>
        <h3 data-morph="title" data-lang="en" style="display:none;">${titleEn}</h3>
        <span class="santis-stack-meta" data-lang="tr">${time} | ${price}</span>
        <span class="santis-stack-meta" data-lang="en" style="display:none;">${timeEn} | ${price}</span>
    </div>`;
});

fs.writeFileSync(file, html);
console.log('masaj.html cards successfully rebuilt as Signature Cards!');

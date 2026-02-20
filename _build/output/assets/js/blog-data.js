/**
 * SANTIS WISDOM RECORDS (BİLGELİK KAYITLARI)
 * Data Source for Phase 18
 * Tone: The Monk (Philosophical, Minimal, Quiet)
 */

window.blogCatalog = [
    {
        id: 1,
        slug: "suyun-hafizasi",
        title: "Suyun Hafızası",
        category: "Elementler",
        date: "2024.02",
        author: "Santis",
        summary: "Su sadece bedeni yıkamaz, ruhun taşıdığı tortuları da çözer. Kadim geleneklerde suyun sessiz tanıklığı üzerine.",
        content: `
            <p>Su, dünya üzerindeki en eski tanıktır. Taşların, dağların ve medeniyetlerin yükselişini ve çöküşünü izlemiştir. Santis'te su ile kurduğumuz ilişki, sadece fiziksel bir temizlenme ritüeli değildir.</p>
            <p>Japon bilim insanı Masaru Emoto'nun da gösterdiği gibi, su kelimelere, düşüncelere ve müziğe tepki verir. Sizin enerjiniz, girdiğiniz suyun moleküler yapısını değiştirir. Ve su, size bu enerjiyi geri yansıtır.</p>
            <h3>Akışta Olmak</h3>
            <p>Hamam kurnasından dökülen her tas su, geçmişin ağırlığını omuzlarınızdan almak için oradadır. Sıcak mermerin üzerindeki buhar, zihnin katılaşmış düşüncelerini yumuşatır. Suyun hafızası vardır; ama en büyük yeteneği, unutmayı ve akıp gitmeyi öğretmesidir.</p>
            <p>Kendinizi suya bıraktığınızda, aslında kontrolü bırakırsınız. Ve huzur, kontrolün bittiği yerde başlar.</p>
        `,
        img: "wisdom_water.webp"
    },
    {
        id: 2,
        slug: "neden-sessizlik",
        title: "Neden Sessizlik?",
        category: "Felsefe",
        date: "2024.01",
        author: "Santis",
        summary: "Gürültülü bir dünyada sessizlik en büyük lükstür. Zihnin sesini kısmadan, bedenin sesini duyamazsınız.",
        content: `
            <p>Modern şehir yaşamı, bitmeyen bir gürültü senfonisidir. Bildirimler, kornalar, konuşmalar ve zihnin kendi iç diyalogları... Bu kakofoni içinde, kendi kalp atışımızı duymayı unuttuk.</p>
            <p>Santis'in "Code of Silence" (Sessizlik Kodu) bir yasak değil, bir davettir. Telefonların sustuğu, konuşmaların fısıltıya dönüştüğü o alanda, başka bir duyu uyanır.</p>
            <h3>İç Sesin Dönüşü</h3>
            <p>Sessizlik boşluk değildir. Sessizlik doludur. Cevaplarla, farkındalıkla ve saf varoluşla doludur. Bir masaj ritüelinde gözlerinizi kapattığınızda, dışarıdaki dünya silikleşir ve içerideki evren netleşir.</p>
            <p>Biz size sadece bir masaj sunmuyoruz. Size, kendinizi duyabileceğiniz o nadir sessizliği sunuyoruz.</p>
        `,
        img: "wisdom_silence.webp"
    },
    {
        id: 3,
        slug: "bedenin-dili",
        title: "Bedenin Dili",
        category: "Beden",
        date: "2023.12",
        author: "Santis",
        summary: "Omuzlarınızdaki ağrı sadece bir kas düğümü mü, yoksa taşınan bir yük mü? Beden asla yalan söylemez.",
        content: `
            <p>Zihin yalan söyleyebilir. "İyiyim" der, "yorgun değilim" der, "bunu halledebilirim" der. Ama beden asla yalan söylemez. Stres omuzlara yerleşir, korku mideye, üzüntü göğüs kafesine.</p>
            <p>Terapistlerimiz dokunduğunda, sadece kasları değil, o kasların tuttuğu anıları da hissederler. Bir spazmın çözülmesi, bazen bir duygunun serbest kalmasıdır.</p>
            <h3>Dinlemeyi Öğrenmek</h3>
            <p>Bedeni dinlemek, yeni bir dil öğrenmek gibidir. Ağrı bir kelimedir. Rahatlama bir cümledir. Esneklik bir şiirdir. Kendi bedeninizi bir makine gibi değil, bir tapınak gibi gördüğünüzde, iyileşme kendiliğinden başlar.</p>
            <p>Bedeninize kulak verin. O size neye ihtiyacı olduğunu fısıldıyor.</p>
        `,
        img: "wisdom_body.webp"
    }
];

// Initialize Blog Logic if DataBridge is present
if (typeof window.initBlog === 'function') window.initBlog();
console.log("📜 [Wisdom Records] Archives Loaded.");

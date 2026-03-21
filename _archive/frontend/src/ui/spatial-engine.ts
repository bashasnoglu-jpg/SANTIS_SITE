import gsap from 'gsap';

export class SpatialUIEngine {
    private elements: HTMLElement[] = [];

    public mount(): void {
        const newElements = Array.from(document.querySelectorAll('[data-spatial="true"]:not([data-spatial-mounted])')) as HTMLElement[];
        if (newElements.length === 0) return;

        console.log(`🌌 [Spatial Engine] ${newElements.length} YENİ arayüz elemanı 3D uzaya bağlandı (Apple VisionOS Fiziği).`);
        
        // Tüm sayfanın 3D derinlik algısını aç
        gsap.set(document.body, { perspective: 1200 });
        this.initMagneticHover(newElements);
    }

    private initMagneticHover(newElements: HTMLElement[]): void {
        newElements.forEach(el => {
            el.setAttribute('data-spatial-mounted', 'true');
            // HTML elementini 3D render moduna geçir
            gsap.set(el, { transformStyle: "preserve-3d" });

            // GSAP quickTo: Layout thrashing yaratmadan doğrudan GPU'ya yazar
            const xTilt = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
            const yTilt = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
            const zFloat = gsap.quickTo(el, "z", { duration: 0.5, ease: "power3.out" });
            
            const glareEl = el.querySelector('.spatial-glare') as HTMLElement;
            const glareOpacity = glareEl ? gsap.quickTo(glareEl, "opacity", { duration: 0.4 }) : null;

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Merkezden uzaklığa göre -1 ile 1 arası normalize et
                const xPct = (x / rect.width - 0.5) * 2; 
                const yPct = (y / rect.height - 0.5) * 2; 

                // Fiziği Uygula: Max 15 derece eğim ve Z ekseninde havaya kalkma
                xTilt(xPct * 15); 
                yTilt(-yPct * 15); 
                zFloat(30);
                
                // Dinamik Işık Parlaması (Glare)
                if(glareOpacity && glareEl) {
                    glareOpacity(1);
                    glareEl.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 60%)`;
                }
            });

            el.addEventListener('mouseleave', () => {
                // Kullanıcı çıkınca yaylanarak (spring) eski haline dön
                xTilt(0); yTilt(0); zFloat(0);
                if (glareOpacity) glareOpacity(0);
            });
        });
        
        this.elements.push(...newElements);
    }
}

import React, { useState, useEffect, useRef } from 'react';
import './SantisViteConcierge.css';

const SantisViteConcierge = ({ contextData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Dinamik Prompt Enjeksiyonu (Yield Engine)
  const generateSystemPrompt = (contextData) => {
    // Temel Anayasa (Her durumda geçerli olan kurallar)
    const basePrompt = `Sen Santis Wellness & Spa'nın üst düzey yapay zeka asistanı, 'Kahin'sin. 
    Görevin: Misafirleri premium bir dille ağırlamak, ihtiyaçlarını analiz etmek ve nazikçe en uygun lüks hizmetlerimize yönlendirmek.
    Ton: Asil, zarif, güven verici ve son derece profesyonel.`;
  
    // Bağlama Göre Özel Yönlendirme (Yield Engine Devrede)
    if (contextData && contextData.serviceName) {
      return `${basePrompt}
      
      ÖNEMLİ BAĞLAM: Misafir şu anda '${contextData.serviceName}' ${contextData.category ? `(Kategori: ${contextData.category})` : ''} sayfasında bulunuyor.
      ${contextData.basePrice ? `Referans Fiyat: ${contextData.basePrice}.` : ''}
      
      STRATEJİ: 
      1. Misafire doğrudan bu hizmetin özel faydalarından bahset.
      2. Satın alma kararı verdirmek için nazikçe yönlendir.
      3. Fırsat bulursan, bu hizmeti tamamlayacak ek bir premium hizmet (örneğin masajın yanına lüks bir cilt bakımı) önererek sepet değerini artır (Upsell yap).`;
    }
  
    // Genel Sayfa Durumu
    return `${basePrompt} 
    
    ÖNEMLİ BAĞLAM: Misafir şu an ana sayfalarda geziniyor, belirli bir hizmet seçmemiş.
    
    STRATEJİ: İhtiyaçlarını sor ve onu Santis'in en popüler 'İmza' hizmetlerinden birine yönlendirerek keşfetmesini sağla.`;
  };

  useEffect(() => {
    // Sistem Prompt'unu konsola basarak Yield Engine'in çalıştığını doğruluyoruz
    const systemPrompt = generateSystemPrompt(contextData);
    console.log("🦅 [Yield Engine] Kahin Promptu Yenilendi:", systemPrompt);
    
    // Bağlama göre ilk karşılama mesajını belirliyoruz
    if (contextData && contextData.serviceName) {
      setMessages([{
        role: 'assistant',
        content: `Santis dünyasına hoş geldiniz. Şu an incelediğiniz ${contextData.serviceName} deneyimi hakkında size nasıl yardımcı olabilirim?`
      }]);
    } else {
      setMessages([{
        role: 'assistant',
        content: 'Santis Wellness & Spa dünyasına hoş geldiniz. Ben Kahin. Sizi en üst düzey lüks hizmetlerimizle buluşturmak için buradayım. Size nasıl yardımcı olabilirim?'
      }]);
    }
  }, [contextData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock API Çağrısı (Gerçek Gemini LLM entegrasyonu gelene kadar)
    setTimeout(() => {
      let botResponse = "Bu harika bir tercih. Lüks deneyimlerin sınırlarını zorlayan Santis Wellness & Spa'da size hizmet vermekten onur duyarız.";
      
      // Basit bir Upsell Senaryosu (Yield Engine demosu)
      if (contextData && contextData.serviceName && input.toLowerCase().includes('rezervasyon')) {
        botResponse = `Harika bir karar. Sizin için ${contextData.serviceName} rezervasyonunuzu planlayabilirim. Ayrıca, bu deneyimi tamamlayacak özel bir 'Altın Yüz Bakımı' eklememizi ister misiniz? Müşterilerimizin çoğu bu eşsiz ikili kombinasyonu tercih ediyor.`;
      } else if (input.toLowerCase().includes('fiyat')) {
        botResponse = `Şu an incelediğiniz ayrıcalıklı ${contextData?.serviceName || 'imza hizmetlerimiz'}, sunduğumuz premium standartlara göre özenle fiyatlandırılmıştır. Daha detaylı bilgi için size özel bir teklif sunabilirim.`;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="santis-concierge-container">
      <div className="santis-concierge-header">
        <h3>Kahin Odası</h3>
        <span className="santis-concierge-status">Sovereign Zeka Aktif</span>
      </div>
      
      <div className="santis-concierge-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`santis-message-wrapper ${msg.role}`}>
            <div className="santis-message-bubble">
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="santis-message-wrapper assistant">
            <div className="santis-message-bubble typing">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="santis-concierge-input-area" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Kahin'e mesaj gönderin..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping || !input.trim()}>
          Gönder
        </button>
      </form>
    </div>
  );
};

export default SantisViteConcierge;

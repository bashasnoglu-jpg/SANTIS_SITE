// useSantisChannel.js
import { useEffect, useState } from 'react';
import SantisSocketRegistry from '../core/santis-socket-registry.js';

export function useSantisChannel(channel) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(SantisSocketRegistry.getState().status);

  useEffect(() => {
    // Kanala abone ol
    const offChannel = SantisSocketRegistry.subscribe(channel, (packet) => {
      setMessages(prev => [packet, ...prev].slice(0, 100));
    });

    // Ana bağlantı durumunu dinle (bağlanıyor, koptu vb.)
    const offGlobal = SantisSocketRegistry.onMessage((packet) => {
      if (packet.type === '__STATUS__') {
        setStatus(packet.status);
      }
    });

    // Bağlantıyı başlat (Zaten açıksa registry bunu yoksayar)
    SantisSocketRegistry.connect();

    return () => {
      offChannel();
      offGlobal();
    };
  }, [channel]);

  return { messages, status };
}

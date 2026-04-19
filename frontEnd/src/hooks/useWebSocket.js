import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Custom hook for WebSocket/STOMP connection to the backend.
 *
 * @param {string[]} topics - Array of topic paths to subscribe to
 * @param {function} onMessage - Callback when a message arrives: (topic, data) => void
 */
const useWebSocket = (topics = [], onMessage) => {
    const clientRef = useRef(null);

    const connect = useCallback(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            onConnect: () => {
                topics.forEach(topic => {
                    client.subscribe(topic, (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            onMessage(topic, data);
                        } catch (e) {
                            onMessage(topic, message.body);
                        }
                    });
                });
            },
            onStompError: (frame) => {
                console.warn('WebSocket STOMP error:', frame);
            },
        });

        client.activate();
        clientRef.current = client;
    }, [topics.join(','), onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [connect]);
};

export default useWebSocket;

import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Client } from '@stomp/stompjs';

// Use native WebSocket — avoids the sockjs-client/eventsource bundler bug.
const wsUrl = () => {
    const base = (typeof API_BASE_URL === 'string' ? API_BASE_URL : '')
        .replace(/^http/, 'ws');
    return `${base}/ws/websocket`;
};

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
            brokerURL: wsUrl(),
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

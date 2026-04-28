import { API_BASE_URL } from '../config';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Feature 4: Real-time Chat Box
 * Used in NGO, Volunteer, and Donor dashboards for per-pickup communication.
 */
const ChatBox = ({ pickupId, currentUserPhone, currentUserRole, onClose }) => {
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const stompClientRef = useRef(null);
    // Track message IDs we've already added to avoid duplicates from WS echo
    const sentMessageIds = useRef(new Set());

    const token = sessionStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // Normalize a message from REST (entity) or WebSocket (flat map) to a common shape
    const normalizeMsg = (raw) => ({
        id: raw.id,
        senderPhone: raw.sender?.phone || raw.senderPhone || '',
        senderName: raw.sender?.fullName || raw.senderName || 'Unknown',
        senderRole: raw.sender?.role || raw.senderRole || '',
        message: raw.message,
        sentAt: raw.sentAt,
        type: raw.type || 'TEXT',
    });

    // Load chat room and message history
    useEffect(() => {
        if (!pickupId) return;

        const loadChat = async () => {
            try {
                setError('');
                const roomRes = await axios.get(
                    `${API_BASE_URL}/api/chat/room/${pickupId}`, authHeader
                );
                const rid = roomRes.data.roomId;
                setRoomId(rid);

                const msgRes = await axios.get(
                    `${API_BASE_URL}/api/chat/messages/${rid}`, authHeader
                );
                setMessages((msgRes.data || []).map(normalizeMsg));
                setLoading(false);

                // Connect WebSocket for live messages
                const client = new Client({
                    webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
                    reconnectDelay: 5000,
                    onConnect: () => {
                        client.subscribe(`/topic/chat/${rid}`, (frame) => {
                            try {
                                const data = JSON.parse(frame.body);
                                if (data.type === 'SYSTEM') return;

                                const normalized = normalizeMsg(data);
                                // Skip if we already added this message (sent by us via REST)
                                if (normalized.id && sentMessageIds.current.has(normalized.id)) {
                                    sentMessageIds.current.delete(normalized.id);
                                    return;
                                }
                                setMessages(prev => [...prev, normalized]);
                            } catch (e) {}
                        });
                    },
                    onStompError: () => {
                        // WebSocket failed — REST polling fallback would go here
                    }
                });
                client.activate();
                stompClientRef.current = client;
            } catch (err) {
                setLoading(false);
                if (err.response?.status === 404) {
                    setError('Chat room not found for this pickup. It may not have been created yet.');
                } else {
                    setError('Could not load chat. Please try again.');
                }
            }
        };

        loadChat();
        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [pickupId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !roomId) return;
        setSending(true);
        const text = newMessage.trim();
        setNewMessage('');
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/chat/send/${roomId}`,
                { message: text },
                authHeader
            );
            // Track the ID so we don't double-add when WS echoes it back
            if (res.data?.id) sentMessageIds.current.add(res.data.id);

            // Optimistically add to UI immediately
            setMessages(prev => [...prev, {
                id: res.data?.id || Date.now(),
                senderPhone: currentUserPhone,
                senderName: 'You',
                senderRole: currentUserRole,
                message: text,
                sentAt: new Date().toISOString(),
                type: 'TEXT',
            }]);
        } catch (err) {
            setNewMessage(text); // restore on failure
            setError('Failed to send message. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSending(false);
        }
    };

    const getRoleColor = (role) => {
        const map = { DONOR: '#003527', NGO: '#416900', VOLUNTEER: '#1A73E8', ADMIN: '#DC2626' };
        return map[role] || '#6B7280';
    };

    const isMyMessage = (msg) => msg.senderPhone === currentUserPhone;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '20px',
                width: '100%', maxWidth: '500px', height: '600px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    background: '#003527', color: 'white',
                    borderRadius: '20px 20px 0 0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>
                            Pickup Chat
                        </p>
                        <h3 style={{ margin: '2px 0 0', fontFamily: 'Manrope,sans-serif', fontSize: '1rem', fontWeight: 800 }}>
                            💬 Request #{pickupId}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        ✕
                    </button>
                </div>

                {/* Messages area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '2rem' }}>
                            Loading messages...
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', color: '#DC2626', marginTop: '2rem', padding: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
                            <p style={{ fontSize: '0.875rem' }}>{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '2rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const mine = isMyMessage(msg);
                            return (
                                <div key={msg.id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '75%' }}>
                                        {!mine && (
                                            <p style={{ margin: '0 0 3px 8px', fontSize: '0.7rem', fontWeight: 700, color: getRoleColor(msg.senderRole) }}>
                                                {msg.senderName} {msg.senderRole ? `(${msg.senderRole})` : ''}
                                            </p>
                                        )}
                                        <div style={{
                                            padding: '10px 14px',
                                            borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: mine ? '#003527' : '#F3F4F6',
                                            color: mine ? 'white' : '#0d1c2f',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.4
                                        }}>
                                            {msg.message}
                                        </div>
                                        <p style={{ margin: '3px 8px 0', fontSize: '0.65rem', color: '#9CA3AF', textAlign: mine ? 'right' : 'left' }}>
                                            {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Error banner */}
                {error && !loading && (
                    <div style={{ padding: '8px 16px', background: '#FEE2E2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {/* Input */}
                <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={roomId ? 'Type a message...' : 'Chat unavailable'}
                        style={{
                            flex: 1, padding: '10px 14px',
                            borderRadius: '100px', border: '1.5px solid #E5E7EB',
                            outline: 'none', fontSize: '0.9rem',
                            background: roomId ? 'white' : '#F9FAFB'
                        }}
                        disabled={!roomId || !!error}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { sendMessage(e); } }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || !roomId}
                        style={{
                            background: '#003527', color: 'white', border: 'none',
                            borderRadius: '100px', padding: '10px 18px',
                            fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                            opacity: (sending || !newMessage.trim() || !roomId) ? 0.5 : 1
                        }}
                    >
                        {sending ? '...' : '➤'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;

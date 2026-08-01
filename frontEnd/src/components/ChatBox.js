import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { Client } from '@stomp/stompjs';

// Use native WebSocket instead of SockJS to avoid bundler compatibility issues.
// The Spring WebSocket endpoint supports both SockJS and raw WS connections.
const wsUrl = () => {
    const base = (typeof API_BASE_URL === 'string' ? API_BASE_URL : '')
        .replace(/^http/, 'ws');   // http→ws, https→wss
    return `${base}/ws/websocket`;
};

/**
 * Feature 4: Real-time Chat Box
 * WhatsApp-style: long-press (mobile) or right-click (desktop) your own message
 * to get a context menu with "Delete for everyone".
 */
const ChatBox = ({ pickupId, currentUserPhone, currentUserRole, onClose }) => {
    const [roomId, setRoomId]           = useState(null);
    const [messages, setMessages]       = useState([]);
    const [newMessage, setNewMessage]   = useState('');
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [sending, setSending]         = useState(false);
    // Context menu state: { msgId, x, y } or null
    const [contextMenu, setContextMenu] = useState(null);

    const messagesEndRef   = useRef(null);
    const stompClientRef   = useRef(null);
    const seenMessageIds   = useRef(new Set());
    const longPressTimer   = useRef(null);
    const containerRef     = useRef(null);

    const token      = sessionStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // ── Normalize REST entity / WS flat map to a common shape ──────────────
    const normalizeMsg = (raw) => ({
        id:          raw.id,
        senderPhone: raw.sender?.phone || raw.senderPhone || '',
        senderName:  raw.sender?.fullName || raw.senderName || 'Unknown',
        senderRole:  raw.sender?.role || raw.senderRole || '',
        message:     raw.message || '',
        sentAt:      raw.sentAt,
        type:        raw.type || 'TEXT',
        // Handle boolean true/false and string "true"/"false" from different serializations
        deleted:     raw.deleted === true || raw.deleted === 'true' || raw.type === 'DELETED',
    });

    // ── Load room + history + WebSocket ─────────────────────────────────────
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
                const historical = (msgRes.data || []).map(normalizeMsg);
                historical.forEach(m => { if (m.id) seenMessageIds.current.add(m.id); });
                setMessages(historical);
                setLoading(false);

                const client = new Client({
                    brokerURL: wsUrl(),
                    reconnectDelay: 5000,
                    onConnect: () => {
                        client.subscribe(`/topic/chat/${rid}`, (frame) => {
                            try {
                                const data = JSON.parse(frame.body);
                                if (data.type === 'SYSTEM') return;

                                // Handle "delete for everyone" broadcast
                                if (data.type === 'DELETED') {
                                    setMessages(prev =>
                                        prev.map(m =>
                                            m.id === data.id
                                                ? { ...m, message: 'This message was deleted', deleted: true }
                                                : m
                                        )
                                    );
                                    return;
                                }

                                const normalized = normalizeMsg(data);
                                if (normalized.id && seenMessageIds.current.has(normalized.id)) return;
                                if (normalized.id) seenMessageIds.current.add(normalized.id);
                                setMessages(prev => [...prev, normalized]);
                            } catch (e) {}
                        });
                    },
                    onStompError: () => {}
                });
                client.activate();
                stompClientRef.current = client;
            } catch (err) {
                setLoading(false);
                if (err.response?.status === 404) {
                    setError('Chat room not found for this pickup. It may not have been created yet.');
                } else if (err.response?.status === 401 || err.response?.status === 403) {
                    setError('Session expired. Please log in again.');
                } else {
                    // Log the actual error for debugging
                    console.error('Chat load error:', err.response?.data || err.message);
                    setError(`Could not load chat (${err.response?.status || 'network error'}). Please close and reopen.`);
                }
            }
        };

        loadChat();
        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [pickupId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close context menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (contextMenu && !e.target.closest('.chat-context-menu')) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [contextMenu]);

    // ── Send message ────────────────────────────────────────────────────────
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !roomId) return;
        setSending(true);
        const text = newMessage.trim();
        setNewMessage('');
        try {
            await axios.post(
                `${API_BASE_URL}/api/chat/send/${roomId}`,
                { message: text },
                authHeader
            );
            // Message appears via WebSocket broadcast — no optimistic add needed
        } catch (err) {
            setNewMessage(text);
            setError('Failed to send message. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSending(false);
        }
    };

    // ── Delete for everyone ─────────────────────────────────────────────────
    const handleDeleteMessage = async (msgId) => {
        setContextMenu(null);
        try {
            await axios.delete(`${API_BASE_URL}/api/chat/message/${msgId}`, authHeader);
            // WS broadcast will update the message for everyone including us
        } catch (err) {
            setError('Could not delete message.');
            setTimeout(() => setError(''), 3000);
        }
    };

    // ── Helpers ─────────────────────────────────────────────────────────────
    const getRoleColor = (role) => {
        const map = { DONOR: '#003527', NGO: '#416900', VOLUNTEER: '#1A73E8', ADMIN: '#DC2626' };
        return map[role] || '#6B7280';
    };

    // Normalize to last 10 digits to match backend storage format
    const normalizePhone = (p) => (p || '').replace(/\D/g, '').slice(-10);

    const isMyMessage = useCallback(
        (msg) => normalizePhone(msg.senderPhone) === normalizePhone(currentUserPhone),
        [currentUserPhone]
    );

    // ── Context menu helpers ────────────────────────────────────────────────
    const openContextMenu = useCallback((e, msg) => {
        if (normalizePhone(msg.senderPhone) !== normalizePhone(currentUserPhone) || msg.deleted) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        setContextMenu({ msgId: msg.id, x, y });
    }, [currentUserPhone]);

    // Long-press for mobile
    const handleTouchStart = useCallback((e, msg) => {
        if (normalizePhone(msg.senderPhone) !== normalizePhone(currentUserPhone) || msg.deleted) return;
        longPressTimer.current = setTimeout(() => openContextMenu(e, msg), 500);
    }, [currentUserPhone, openContextMenu]);

    const handleTouchEnd = useCallback(() => {
        clearTimeout(longPressTimer.current);
    }, []);

    // ── Render ───────────────────────────────────────────────────────────────
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
                {/* ── Header ── */}
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

                {/* ── Messages area (position:relative so context menu is anchored) ── */}
                <div
                    ref={containerRef}
                    style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '2rem' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
                            Loading messages...
                        </div>
                    ) : error && messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#DC2626', marginTop: '2rem', padding: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
                            <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>{error}</p>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px',
                                    background: '#003527', color: 'white',
                                    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                                }}
                            >
                                Close & Retry
                            </button>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '2rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const mine    = isMyMessage(msg);
                            const deleted = msg.deleted;
                            return (
                                <div
                                    key={msg.id || i}
                                    style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}
                                    // Desktop: right-click
                                    onContextMenu={(e) => openContextMenu(e, msg)}
                                    // Mobile: long-press
                                    onTouchStart={(e) => handleTouchStart(e, msg)}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchMove={handleTouchEnd}
                                >
                                    <div style={{ maxWidth: '75%' }}>
                                        {!mine && !deleted && (
                                            <p style={{ margin: '0 0 3px 8px', fontSize: '0.7rem', fontWeight: 700, color: getRoleColor(msg.senderRole) }}>
                                                {msg.senderName} {msg.senderRole ? `(${msg.senderRole})` : ''}
                                            </p>
                                        )}
                                        <div style={{
                                            padding: '10px 14px',
                                            borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: deleted
                                                ? (mine ? 'rgba(0,53,39,0.35)' : '#EDEDEE')
                                                : (mine ? '#003527' : '#F3F4F6'),
                                            color: deleted
                                                ? (mine ? 'rgba(255,255,255,0.55)' : '#9CA3AF')
                                                : (mine ? 'white' : '#0d1c2f'),
                                            fontSize: deleted ? '0.82rem' : '0.9rem',
                                            fontStyle: deleted ? 'italic' : 'normal',
                                            lineHeight: 1.4,
                                            userSelect: deleted ? 'none' : 'text',
                                        }}>
                                            {deleted && (
                                                <span style={{ marginRight: '5px', opacity: 0.7 }}>🚫</span>
                                            )}
                                            {msg.message}
                                        </div>
                                        <p style={{ margin: '3px 8px 0', fontSize: '0.65rem', color: '#9CA3AF', textAlign: mine ? 'right' : 'left' }}>
                                            {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {mine && !deleted && (
                                                <span style={{ marginLeft: '4px', fontSize: '0.6rem', opacity: 0.5 }}>
                                                    · hold to delete
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />

                    {/* ── Context Menu (WhatsApp-style) ── */}
                    {contextMenu && (
                        <div
                            className="chat-context-menu"
                            style={{
                                position: 'absolute',
                                top:  Math.min(contextMenu.y, 480),   // keep inside box
                                left: Math.min(Math.max(contextMenu.x - 80, 4), 320),
                                background: 'white',
                                borderRadius: '10px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                                zIndex: 100,
                                overflow: 'hidden',
                                minWidth: '160px',
                                border: '1px solid #E5E7EB',
                            }}
                        >
                            <button
                                onClick={() => handleDeleteMessage(contextMenu.msgId)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '12px 16px',
                                    border: 'none', background: 'none',
                                    cursor: 'pointer', fontSize: '0.875rem',
                                    color: '#DC2626', fontWeight: 700,
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                🗑️ Delete for everyone
                            </button>
                            <button
                                onClick={() => setContextMenu(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '12px 16px',
                                    border: 'none', borderTop: '1px solid #F3F4F6',
                                    background: 'none', cursor: 'pointer',
                                    fontSize: '0.875rem', color: '#6B7280', fontWeight: 600,
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Error banner ── */}
                {error && !loading && (
                    <div style={{ padding: '8px 16px', background: '#FEE2E2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {/* ── Input ── */}
                <form
                    onSubmit={sendMessage}
                    style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}
                >
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
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
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

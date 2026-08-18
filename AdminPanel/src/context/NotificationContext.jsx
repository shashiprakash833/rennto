import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { WS_BASE_URL } from "../config/Api";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem("adminNotifications");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [toast, setToast] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const wsRef = useRef(null);
    const seenIdsRef = useRef(new Set());
    const reconnectTimerRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    const MAX_RECONNECT_ATTEMPTS = 5;

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Persist notifications
    useEffect(() => {
        try {
            localStorage.setItem("adminNotifications", JSON.stringify(notifications));
        } catch (e) {
            console.warn("Storage quota exceeded", e);
        }
    }, [notifications]);

    // Notification sound
    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523, 659, 784];

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);

                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 0.6);
            });
        } catch (e) {
            console.warn("Audio not available:", e);
        }
    };

    const connect = () => {
        const token = localStorage.getItem("adminToken");

        // ✅ Prevent WS if not logged in
        if (!token) {
            console.warn("[WS] No admin token found, skipping connection");
            return;
        }

        const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${token}`;

        console.log(`[WS] 📡 Connecting to ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] ✅ Connected successfully");
            reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (
                    data.type === "new_registration" ||
                    data.type === "table_refresh" ||
                    data.type === "property_update"
                ) {
                    triggerRefresh();
                }

                if (data.type === "new_registration") {
                    const dedupKey = `${data.message}__${data.time}`;
                    if (seenIdsRef.current.has(dedupKey)) return;
                    seenIdsRef.current.add(dedupKey);

                    const newNotif = {
                        id: Date.now(),
                        message: data.message,
                        time: data.time,
                        type: "new_registration",
                        route: "/owners",
                        routeState: { filter: "pending" },
                        read: false,
                    };

                    setNotifications(prev => {
                        const exists = prev.some(
                            n => n.message === data.message && n.time === data.time
                        );
                        if (exists) return prev;
                        return [newNotif, ...prev];
                    });

                    setToast(data.message);
                    setTimeout(() => setToast(null), 5000);

                    playNotificationSound();
                }
            } catch (err) {
                console.error("[WS] Error parsing message:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("[WS] ❌ Error:", err);
        };

        ws.onclose = (e) => {
            console.warn(`[WS] Disconnected (code=${e.code})`);

            // ❌ Prevent infinite reconnect loop
            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                console.error("[WS] Max reconnect attempts reached. Stopping reconnect.");
                return;
            }

            if (e.code !== 1000) {
                reconnectAttemptsRef.current += 1;

                reconnectTimerRef.current = setTimeout(() => {
                    connect();
                }, 5000);
            }
        };
    };

    useEffect(() => {
        let mounted = true;
        const timer = setTimeout(() => {
            if (mounted) connect();
        }, 100);

        return () => {
            mounted = false;

            clearTimeout(timer);
            clearTimeout(reconnectTimerRef.current);

            const ws = wsRef.current;
            if (ws) {
                ws.onopen = null;
                ws.onmessage = null;
                ws.onerror = null;
                ws.onclose = null;

                if (
                    ws.readyState === WebSocket.OPEN ||
                    ws.readyState === WebSocket.CONNECTING
                ) {
                    ws.close(1000);
                }
            }

            wsRef.current = null;

        };

    }, []);


    const clearNotifications = () => {

        setNotifications([]);
        localStorage.removeItem("adminNotifications");

        seenIdsRef.current.clear();

    };

    const markAsRead = (id) => {

        setNotifications(prev =>

            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );

    };


    const removeNotification = (id) => {

        setNotifications(prev => prev.filter(n => n.id !== id));

    };


    return (

        <NotificationContext.Provider

            value={{
                notifications,
                toast,

                clearNotifications,
                markAsRead,

                removeNotification,
                refreshTrigger,

            }}
        >

            {children}
        </NotificationContext.Provider>
    );
};

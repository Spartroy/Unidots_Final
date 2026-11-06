import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Notice } from '../../design/kit';
import { Field } from '../../design/controls';
import { Skeleton } from '../../design/motionKit';

// Order chat between the client, the designer and the manager.
const OrderChat = ({ orderId, isVisible = true }) => {
  const { user } = useContext(AuthContext);
  const { t, lang, dir } = useLanguage();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const end = useRef(null);
  const me = user?._id || user?.id;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get(`/api/chats/order/${orderId}`);
      setChat(r.data);
      setMessages(r.data.messages || []);
      setError(null);
      if (r.data._id) api.put(`/api/chats/${r.data._id}/read`).catch(() => {});
    } catch (e) {
      setError(e.response?.status === 403 ? t('ch.order.forbidden') : e.response?.status === 404 ? t('ch.order.notFound') : t('ch.order.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    if (orderId && isVisible) load();
  }, [orderId, isVisible, load]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !chat) return;
    try {
      setSending(true);
      const r = await api.post(`/api/chats/${chat._id}/messages`, { content: text.trim(), messageType: 'text' });
      setMessages((m) => [...m, r.data]);
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || t('ch.order.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const when = (d) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const mine = (m) => (m.sender?._id || m.sender) === me;

  if (!isVisible) return null;
  if (loading) return <div role="status" aria-label={t('ch.order.loading')}><Skeleton height={260} /></div>;
  if (error) return <Notice tone="error">{error}</Notice>;

  return (
    <div dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {chat?.participants?.length ? <p className="ud-hint" style={{ margin: 0 }}>{t('ch.order.people', { n: chat.participants.length })}</p> : null}
      <div role="log" aria-live="polite" aria-label={t('ch.order.title')} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, minHeight: 160, overflowY: 'auto', padding: 4 }}>
        {messages.length === 0 && <p className="ud-card-s">{t('ch.order.empty')}</p>}
        {messages.map((m, i) =>
          m.messageType === 'system' ? (
            <p key={m._id || m.id || i} className="ud-hint" style={{ textAlign: 'center', margin: 0 }}>{m.content}</p>
          ) : (
            <div
              key={m._id || m.id || i}
              style={{
                alignSelf: mine(m) ? 'flex-end' : 'flex-start', maxWidth: 'min(520px, 90%)', padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                background: mine(m) ? 'var(--primary)' : 'var(--bg-app)', color: mine(m) ? 'var(--on-primary)' : 'var(--text)', border: mine(m) ? 0 : '1px solid var(--border)',
              }}
            >
              {!mine(m) && <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{m.sender?.name || t('ch.order.unknown')}</div>}
              <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginBlockStart: 2 }}>
                {when(m.timestamp || m.createdAt)}
                {mine(m) ? ` · ${m.readBy && m.readBy.some((r) => (r.user?._id || r.user) !== me) ? t('ch.order.read') : t('ch.order.sent')}` : ''}
              </div>
            </div>
          )
        )}
        <div ref={end} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Field label={t('ch.order.label')} multiline rows={2} placeholder={t('ch.order.placeholder')} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        </div>
        <Button type="submit" disabled={sending || !text.trim()}>{sending ? t('ch.order.sending') : t('ch.order.send')}</Button>
      </form>
    </div>
  );
};

export default OrderChat;

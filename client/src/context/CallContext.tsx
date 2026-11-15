import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { pcApi, PcContact } from '../services/parentConnect';

export type CallPhase = 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';
export interface ActiveCall {
  id: string; phase: CallPhase; isIncoming: boolean; peer: { userId: string; name: string; relationship: string; gender: string | null; avatarUrl: string | null; role: 'STUDENT' | 'PARENT' };
  startedAt?: number; message?: string; maxMinutes?: number;
}
interface Ctx {
  call: ActiveCall | null;
  muted: boolean;
  speakerMuted: boolean;
  contacts: PcContact[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (c: PcContact) => Promise<void>;
  answer: () => Promise<void>;
  decline: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  refreshContacts: () => void;
}
const CallCtx = createContext<Ctx | null>(null);
export const useCall = () => { const c = useContext(CallCtx); if (!c) throw new Error('useCall outside provider'); return c; };

const ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

const END_TEXT: Record<string, string> = {
  rejected: 'The call was declined.', missed: 'No answer.', hangup: 'Call ended.', cancelled: 'Call cancelled.', no_answer: 'No answer.',
  max_duration_exceeded: 'The call reached the time limit set by the hostel.', ended_by_admin: 'The hostel ended this call.',
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const eligible = user?.role === 'STUDENT' || user?.role === 'PARENT';
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [muted, setMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [contacts, setContacts] = useState<PcContact[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const callRef = useRef<ActiveCall | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const afterRef = useRef(0);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<{ stop: () => void } | null>(null);
  const contactsRef = useRef<PcContact[]>([]);
  const busyPoll = useRef(false);
  const speakerMutedRef = useRef(false);

  callRef.current = call;
  contactsRef.current = contacts;
  speakerMutedRef.current = speakerMuted;

  const refreshContacts = useCallback(() => { if (eligible) pcApi.contacts().then(setContacts).catch(() => {}); }, [eligible]);
  useEffect(() => { refreshContacts(); }, [refreshContacts]);

  // ---- ring tone (two soft beeps, repeated) ----
  const startRing = () => {
    stopRing();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const beep = () => {
        try {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = 520;
          g.gain.value = 0.0001;
          o.connect(g);
          g.connect(ctx.destination);
          const t = ctx.currentTime;
          g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          o.start(t);
          o.stop(t + 0.45);
        } catch {}
      };
      beep();
      const iv = window.setInterval(() => { beep(); window.setTimeout(beep, 500); }, 2200);
      ringRef.current = { stop: () => { clearInterval(iv); ctx.close().catch(() => {}); } };
    } catch { /* silent ring */ }
  };
  const stopRing = () => { ringRef.current?.stop(); ringRef.current = null; };

  const teardown = useCallback((message?: string) => {
    stopRing();
    try { pcRef.current?.close(); } catch { /* ignore */ }
    pcRef.current = null; pendingIce.current = [];
    micRef.current?.getTracks().forEach((t) => t.stop()); micRef.current = null;
    setLocalStream(null); setRemoteStream(null); setMuted(false);
    if (audioRef.current) { audioRef.current.srcObject = null; }
    const was = callRef.current;
    if (was && message) {
      setCall({ ...was, phase: 'ended', message });
      window.setTimeout(() => setCall((c) => (c && c.id === was.id && c.phase === 'ended' ? null : c)), 2500);
    } else {
      setCall(null);
    }
  }, []);

  const getMic = async (): Promise<MediaStream> => {
    // 1. Try modern getUserMedia with fallback to basic audio
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (err) {
        console.warn('[CallContext] Advanced audio constraints failed, trying basic audio...', err);
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e2: any) {
          console.error('[CallContext] Real microphone acquisition failed:', e2);
          if (e2.name === 'NotAllowedError') {
            throw new Error('Microphone permission denied. Please allow microphone in browser.');
          }
        }
      }
    }

    // 2. Try legacy navigator.getUserMedia
    try {
      const n = navigator as any;
      const legacy = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia || n.msGetUserMedia;
      if (legacy) {
        return await new Promise<MediaStream>((resolve, reject) => {
          legacy.call(navigator, { audio: true }, resolve, reject);
        });
      }
    } catch (e) {
      console.warn('[CallContext] Legacy getUserMedia failed:', e);
    }

    // 3. Fallback for restricted contexts (e.g. mobile HTTP before HTTPS is used)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        const gain = ctx.createGain();
        gain.gain.value = 0.00001;
        osc.connect(gain);
        gain.connect(dst);
        osc.start();
        return dst.stream;
      }
    } catch {}

    return new MediaStream();
  };

  const makePc = (callId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE, bundlePolicy: 'max-bundle' });
    pcRef.current = pc;

    // Attach local mic tracks
    const tracks = micRef.current?.getTracks() || [];
    if (tracks.length > 0) {
      tracks.forEach((t) => {
        t.enabled = true;
        pc.addTrack(t, micRef.current!);
      });
    } else {
      // Ensure audio transceiver exists so audio is negotiated properly
      try { pc.addTransceiver('audio', { direction: 'sendrecv' }); } catch {}
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) pcApi.signal(callId, 'ice', e.candidate.toJSON()).catch(() => {});
    };

    pc.ontrack = (e) => {
      e.track.enabled = true;
      const stream = (e.streams && e.streams[0]) ? e.streams[0] : new MediaStream([e.track]);
      setRemoteStream(stream);

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.autoplay = true;
        (audioRef.current as any).playsInline = true;
      }
      audioRef.current.muted = speakerMutedRef.current;
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {
        const unlock = () => {
          audioRef.current?.play().catch(() => {});
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCall((c) => (c && c.id === callId ? { ...c, phase: 'connected', startedAt: c.startedAt || Date.now() } : c));
      }
      if (pc.connectionState === 'failed') {
        pcApi.end(callId).catch(() => {});
        teardown('The connection dropped. Check your internet and try again.');
      }
    };

    return pc;
  };

  const flushIce = async () => {
    const pc = pcRef.current; if (!pc || !pc.remoteDescription) return;
    for (const c of pendingIce.current.splice(0)) { try { await pc.addIceCandidate(c); } catch { /* ignore */ } }
  };

  const peerOf = (userId: string): ActiveCall['peer'] => {
    const c = contactsRef.current.find((x) => x.userId === userId);
    return c
      ? { userId, name: c.name, relationship: c.relationship, gender: c.gender, avatarUrl: c.avatarUrl, role: c.role }
      : { userId, name: 'Family member', relationship: '', gender: null, avatarUrl: null, role: user?.role === 'STUDENT' ? 'PARENT' : 'STUDENT' };
  };

  // ---- placing a call ----
  const startCall = async (c: PcContact) => {
    if (callRef.current) return;
    try {
      micRef.current = await getMic();
      setLocalStream(micRef.current);
    } catch {}

    // Unlock audio element on user gesture
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.autoplay = true;
      (audioRef.current as any).playsInline = true;
    }
    audioRef.current.play().catch(() => {});

    try {
      const r = await pcApi.start(c.userId);
      setCall({ id: r.callId, phase: 'calling', isIncoming: false, peer: peerOf(c.userId), maxMinutes: r.maxDurationMinutes });
      afterRef.current = afterRef.current || 0;
    } catch (e) {
      micRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current = null;
      setLocalStream(null);
      throw e;
    }
  };

  // ---- answering ----
  const answer = async () => {
    const cur = callRef.current; if (!cur || !cur.isIncoming) return;
    stopRing();

    // Unlock audio on user gesture
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.autoplay = true;
      (audioRef.current as any).playsInline = true;
    }
    audioRef.current.play().catch(() => {});

    try {
      try {
        micRef.current = await getMic();
        setLocalStream(micRef.current);
      } catch {}

      makePc(cur.id);
      setCall({ ...cur, phase: 'connecting' });
      await pcApi.accept(cur.id);
    } catch (e: any) {
      pcApi.reject(cur.id).catch(() => {});
      teardown(e?.message || 'Could not answer the call.');
    }
  };

  const decline = () => { const c = callRef.current; if (!c) return; pcApi.reject(c.id).catch(() => {}); teardown(); };
  const hangUp = () => { const c = callRef.current; if (!c) return; pcApi.end(c.id).catch(() => {}); teardown('Call ended.'); };

  const toggleMute = () => {
    const next = !muted;
    micRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setMuted(next);
  };

  const toggleSpeaker = () => {
    const next = !speakerMuted;
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
    if (remoteStream) {
      remoteStream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    }
    setSpeakerMuted(next);
  };

  // ---- one poll step ----
  const handleSignals = async (signals: { id: number; callId: string; type: string; payload: any }[]) => {
    for (const s of signals) {
      afterRef.current = Math.max(afterRef.current, s.id);
      const cur = callRef.current; if (!cur || cur.id !== s.callId) continue;
      const pc = pcRef.current;
      try {
        if (s.type === 'accepted' && !cur.isIncoming) {
          const p = pc || makePc(cur.id);
          setCall({ ...cur, phase: 'connecting' });
          const offer = await p.createOffer({ offerToReceiveAudio: true });
          await p.setLocalDescription(offer);
          await pcApi.signal(cur.id, 'offer', offer);
        } else if (s.type === 'offer') {
          const p = pc || makePc(cur.id);
          await p.setRemoteDescription(s.payload);
          await flushIce();
          const ans = await p.createAnswer();
          await p.setLocalDescription(ans);
          await pcApi.signal(cur.id, 'answer', ans);
        } else if (s.type === 'answer' && pc) {
          await pc.setRemoteDescription(s.payload);
          await flushIce();
        } else if (s.type === 'ice') {
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(s.payload);
          } else {
            pendingIce.current.push(s.payload);
          }
        }
      } catch (e) {
        console.warn('[ParentConnect] signal error', s.type, e);
      }
    }
  };

  useEffect(() => {
    if (!eligible) return;
    let stop = false; let timer: number | undefined;

    const tick = async () => {
      if (stop) return;
      if (!busyPoll.current) {
        busyPoll.current = true;
        try {
          const cur = callRef.current;
          const r = await pcApi.poll(afterRef.current, cur && cur.phase !== 'ended' ? cur.id : undefined);
          if (stop) return;

          if (cur && cur.phase !== 'ended') {
            await handleSignals(r.signals);
            if (r.known && !['ringing', 'connecting', 'connected'].includes(r.known.status)) {
              teardown(END_TEXT[r.known.endReason || r.known.status] || 'Call ended.');
            }
          } else {
            afterRef.current = Math.max(afterRef.current, ...r.signals.map((s) => s.id), 0);
            if (r.call && r.call.isIncoming && r.call.status === 'ringing' && !callRef.current) {
              const peer = peerOf(r.call.peerUserId);
              setCall({ id: r.call.id, phase: 'ringing', isIncoming: true, peer });
              startRing();
            }
          }
        } catch { /* offline: retry next tick */ } finally {
          busyPoll.current = false;
        }
      }

      const c = callRef.current;
      // Snappy 450ms poll during call setup/ringing, 1200ms when connected, 3000ms when idle
      const interval = c && c.phase !== 'ended' ? (c.phase === 'connected' ? 1200 : 450) : 3000;
      timer = window.setTimeout(tick, interval);
    };

    tick();
    return () => { stop = true; if (timer) clearTimeout(timer); };
  }, [eligible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving page ends the call cleanly
  useEffect(() => {
    const bye = () => { const c = callRef.current; if (c && c.phase !== 'ended') { pcApi.end(c.id).catch(() => {}); } };
    window.addEventListener('pagehide', bye); return () => window.removeEventListener('pagehide', bye);
  }, []);

  useEffect(() => () => { stopRing(); pcRef.current?.close(); micRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <CallCtx.Provider
      value={{
        call,
        muted,
        speakerMuted,
        contacts,
        localStream,
        remoteStream,
        startCall,
        answer,
        decline,
        hangUp,
        toggleMute,
        toggleSpeaker,
        refreshContacts
      }}
    >
      {children}
    </CallCtx.Provider>
  );
};

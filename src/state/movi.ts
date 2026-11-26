import { useSyncExternalStore } from 'react';
import type { Action, Card, Query } from '../movi/engine';

/**
 * Conversazione con Movi: resta finché l'app è aperta (sessionStorage), così si torna alla chat
 * dopo "Prenotato" o dopo la mappa. "Ripristina demo" la svuota.
 */
export type Msg =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'movi'; text: string; cards?: Card[]; actions?: Action[]; suggestions?: string[];
      offline?: { retry: string }; /** prenotazioni fatte da queste card: activityId → id prenotazione */ booked?: Record<string, string> };
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never;
type ChatState = { messages: Msg[]; pending: { thinking: string; search: boolean } | null; lastQuery?: Query };

const KEY = 'movitae-movi-chat';
const load = (): ChatState => {
  try { const r = sessionStorage.getItem(KEY); if (r) return { ...JSON.parse(r), pending: null }; } catch { /* ignora */ }
  return { messages: [], pending: null };
};
let state = load();
const subs = new Set<() => void>();
const set = (p: Partial<ChatState>) => {
  state = { ...state, ...p };
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, pending: null })); } catch { /* ignora */ }
  subs.forEach((f) => f());
};
let n = 0;
const uid = () => `${Date.now().toString(36)}-${n++}`;

export const chat = {
  get: () => state,
  add(m: NewMsg) { const msg = { ...m, id: uid() } as Msg; set({ messages: [...state.messages, msg] }); return msg; },
  remove(id: string) { set({ messages: state.messages.filter((m) => m.id !== id) }); },
  update(id: string, patch: Partial<Msg>) { set({ messages: state.messages.map((m) => (m.id === id ? ({ ...m, ...patch } as Msg) : m)) }); },
  setPending(p: ChatState['pending']) { set({ pending: p }); },
  setLastQuery(q?: Query) { set({ lastQuery: q }); },
  reset() { try { sessionStorage.removeItem(KEY); } catch { /* ignora */ } state = { messages: [], pending: null }; subs.forEach((f) => f()); },
};
export const useChat = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state);

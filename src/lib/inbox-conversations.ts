// Turns the raw inbound + outbound email lists from gmail-list-client-inbox
// into one row per person with a clear status. Pure, so the rules live in one
// place:
//
//  - Messages are grouped per person, then into conversations by normalised
//    subject ("Re: Locking in your next lesson" ≡ "Locking in your next
//    lesson"). Clients' mail apps regularly split one back-and-forth across
//    several Gmail threads, and a reply sent as a fresh email lands in its own
//    thread too. Grouping by thread alone showed the same exchange twice and
//    kept "Needs reply" on a thread that had really been answered elsewhere.
//  - needs_reply: their latest message in a conversation came after anything
//    you sent in it.
//  - follow_up: you wrote last, it's been FOLLOW_UP_AFTER_DAYS+ with no reply
//    from them anywhere, and it was a real conversation (they'd written in it,
//    or you wrote it yourself through the app). Automated reminders and
//    receipts never count.
//  - waiting: same as follow_up but still recent, or they already have a
//    session booked.
//  - done: marked Done/Booked, or nothing outstanding. A mark lasts until they
//    email again.

export const FOLLOW_UP_AFTER_DAYS = 3;
const FOLLOW_UP_MAX_DAYS = 60;
const DAY_MS = 86400000;

export interface InboundMessage {
  id: string;
  thread_id: string;
  client_id: string | null;
  voice_student_email: string | null;
  name: string;
  email: string;
  kind: "kinesiology" | "voice";
  subject: string;
  snippet: string;
  date_iso: string;
  needs_reply: boolean;
}

export interface SentMessage {
  id: string;
  thread_id: string;
  to_email: string;
  subject: string;
  snippet: string;
  date_iso: string;
}

export interface ManualSend {
  recipient: string;
  subject: string;
  created_at: string;
}

export interface ContactInfo {
  name: string;
  kind: "kinesiology" | "voice";
  client_id: string | null;
}

export interface ContactMark {
  state: "done" | "booked";
  resolved_at: string;
}

export type PersonStatus = "needs_reply" | "follow_up" | "waiting" | "done";

export interface ConversationEvent {
  direction: "inbound" | "outbound";
  thread_id: string;
  subject: string;
  snippet: string;
  date: Date;
}

export interface Conversation {
  key: string;
  subject: string;
  threadIds: string[]; // most recently active first
  events: ConversationEvent[]; // oldest first
  last: ConversationEvent;
  needsReply: boolean;
  chaseable: boolean; // you wrote last and it's a real (non-automated) exchange
}

export interface InboxPerson {
  email: string;
  name: string;
  kind: "kinesiology" | "voice";
  clientId: string | null;
  status: PersonStatus;
  focus: Conversation; // the conversation the row is about
  conversations: Conversation[];
  lastActivity: Date;
  waitingSince: Date | null; // needs_reply: their message; follow_up/waiting: your message
  upcoming: string | null;
  mark: ContactMark | null;
}

export function normaliseSubject(subject: string): string {
  return (subject || "")
    .replace(/^\s*((re|fwd?|aw|sv)\s*(\[\d+\])?\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function buildInboxPeople(args: {
  inbound: InboundMessage[];
  sent: SentMessage[];
  manualSends: ManualSend[];
  contacts: Record<string, ContactInfo>;
  upcoming: Record<string, string>;
  marks: Record<string, ContactMark>;
  now?: Date;
}): InboxPerson[] {
  const { inbound, sent, manualSends, contacts, upcoming, marks } = args;
  const now = args.now ?? new Date();

  // Threads the server saw a later practice reply in (possibly older than the
  // sent-mail window) — trust that over our own event ordering.
  const threadNeedsReply = new Map<string, boolean>();
  for (const m of inbound) threadNeedsReply.set(m.thread_id, m.needs_reply);

  const manualKeys = new Set(manualSends.map((m) => `${m.recipient}|${normaliseSubject(m.subject)}`));

  const byPerson = new Map<string, ConversationEvent[]>();
  const push = (email: string, e: ConversationEvent) => {
    const list = byPerson.get(email) ?? [];
    list.push(e);
    byPerson.set(email, list);
  };
  const info = new Map<string, ContactInfo>(Object.entries(contacts));
  for (const m of inbound) {
    push(m.email, { direction: "inbound", thread_id: m.thread_id, subject: m.subject, snippet: m.snippet, date: new Date(m.date_iso) });
    if (!info.has(m.email)) info.set(m.email, { name: m.name, kind: m.kind, client_id: m.client_id });
  }
  for (const m of sent) {
    push(m.to_email, { direction: "outbound", thread_id: m.thread_id, subject: m.subject, snippet: m.snippet, date: new Date(m.date_iso) });
  }

  const people: InboxPerson[] = [];
  for (const [email, events] of byPerson) {
    const contact = info.get(email);
    if (!contact) continue;

    // Conversations: same normalised subject OR same Gmail thread.
    const convByKey = new Map<string, ConversationEvent[]>();
    const keyByThread = new Map<string, string>();
    for (const e of [...events].sort((a, b) => a.date.getTime() - b.date.getTime())) {
      const key = keyByThread.get(e.thread_id) ?? (normaliseSubject(e.subject) || `thread:${e.thread_id}`);
      keyByThread.set(e.thread_id, key);
      const list = convByKey.get(key) ?? [];
      list.push(e);
      convByKey.set(key, list);
    }

    const conversations: Conversation[] = [];
    for (const [key, evs] of convByKey) {
      const last = evs[evs.length - 1];
      const hasInbound = evs.some((e) => e.direction === "inbound");
      const needsReply = last.direction === "inbound" && (threadNeedsReply.get(last.thread_id) ?? true);
      const chaseable = last.direction === "outbound" && (hasInbound || manualKeys.has(`${email}|${key}`));
      const threadIds = [...new Set([...evs].reverse().map((e) => e.thread_id))];
      const subjectSource = evs.find((e) => e.direction === "inbound") ?? evs[0];
      conversations.push({ key, subject: subjectSource.subject, threadIds, events: evs, last, needsReply, chaseable });
    }
    conversations.sort((a, b) => b.last.date.getTime() - a.last.date.getTime());

    const mark = marks[email] ?? null;
    const markedAt = mark ? new Date(mark.resolved_at).getTime() : -Infinity;
    const lastInbound = Math.max(...events.filter((e) => e.direction === "inbound").map((e) => e.date.getTime()), -Infinity);
    const booked = upcoming[email] ?? null;

    const openReplies = conversations.filter((c) => c.needsReply && c.last.date.getTime() > markedAt);
    const chases = conversations.filter(
      (c) => c.chaseable && c.last.date.getTime() > lastInbound && c.last.date.getTime() > markedAt,
    );

    let status: PersonStatus;
    let focus: Conversation;
    let waitingSince: Date | null = null;
    if (openReplies.length) {
      status = "needs_reply";
      // Longest-waiting first within the person: the oldest unanswered one.
      focus = openReplies[openReplies.length - 1];
      waitingSince = focus.last.date;
    } else if (chases.length) {
      focus = chases[0];
      waitingSince = focus.last.date;
      const days = (now.getTime() - focus.last.date.getTime()) / DAY_MS;
      status = !booked && days >= FOLLOW_UP_AFTER_DAYS && days <= FOLLOW_UP_MAX_DAYS ? "follow_up" : "waiting";
    } else {
      status = "done";
      focus = conversations[0];
    }

    people.push({
      email,
      name: contact.name,
      kind: contact.kind,
      clientId: contact.client_id,
      status,
      focus,
      conversations,
      lastActivity: conversations[0].last.date,
      waitingSince,
      upcoming: booked,
      mark,
    });
  }

  // Needs reply and follow up: longest waiting first. Everything else: most recent first.
  return people.sort((a, b) => {
    if ((a.status === "needs_reply" || a.status === "follow_up") && a.status === b.status && a.waitingSince && b.waitingSince) {
      return a.waitingSince.getTime() - b.waitingSince.getTime();
    }
    return b.lastActivity.getTime() - a.lastActivity.getTime();
  });
}

// Strips the quoted history from a reply body so the thread view shows what
// was actually written, not the whole chain again underneath every message.
export function splitQuotedReply(body: string): { main: string; quoted: string } {
  if (!body) return { main: "", quoted: "" };
  const patterns = [
    /\n[^\n]*On (?:(?!\. )[^\n]){6,160}?(wrote|a écrit):/i,
    /\n\s*-{2,}\s*Original Message/i,
    /\n\s*From:\s[^\n]+\n\s*(Sent|Date):/i,
    /\n>/,
  ];
  let cut = -1;
  for (const p of patterns) {
    const i = body.search(p);
    if (i > 0 && (cut === -1 || i < cut)) cut = i;
  }
  if (cut <= 0) return { main: body.trim(), quoted: "" };
  return { main: body.slice(0, cut).trim(), quoted: body.slice(cut).trim() };
}

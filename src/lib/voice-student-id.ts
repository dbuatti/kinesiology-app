// Voice students (Notion-backed, no row in `clients`) are selectable in the Assistant
// page's client picker alongside kinesiology clients. Since they don't share the
// `clients` uuid id space, they're addressed by a prefixed pseudo-id built from their
// email instead.
const VOICE_ID_PREFIX = "voice:";

export const voiceStudentIdFor = (email: string) => `${VOICE_ID_PREFIX}${email}`;
export const emailFromVoiceStudentId = (id: string) => id.slice(VOICE_ID_PREFIX.length);
export const isVoiceStudentId = (id: string | null) => !!id && id.startsWith(VOICE_ID_PREFIX);

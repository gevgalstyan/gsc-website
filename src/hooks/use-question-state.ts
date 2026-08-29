"use client";

/**
 * Synchronizes question progress, favorites, and continuation state.
 * Guests use localStorage. Signed-in members use Supabase as source of truth,
 * with a small local retry queue for temporary network failures.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { questions, type CategoryFilter, type DifficultyFilter } from "@/lib/questions";
import type { InitialQuestionSyncState, QuestionDeckSyncState } from "@/lib/question-sync";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const progressKey = "gsc_question_progress_v3";
const legacyProgressKey = "gsc_seen_questions_v2";
const favoritesKey = "gsc_question_favorites_v1";
const deckStateKey = "gsc_question_deck_state_v1";
const mergeKeyPrefix = "gsc_question_account_merge_v1:";
const pendingKeyPrefix = "gsc_question_pending_v1:";
const validQuestionIds = new Set(questions.map((question) => question.id));
const emptyQuestionIds: string[] = [];

type StoredProgress = { version: 3; seen: string[] };
type QuestionProgressRow = { question_id: string; last_viewed_at?: string };
type QuestionFavoriteRow = { question_id: string; is_favorite?: boolean; favorite_updated_at?: string };
type QuestionDeckStateRow = {
  current_question_id: string | null;
  category_filter: string;
  difficulty_filter: string;
  favorites_only: boolean;
  updated_at: string;
};
type PendingQuestionWrites = {
  progress: Record<string, string>;
  favorites: Record<string, { isFavorite: boolean; updatedAt: string }>;
  deckState: QuestionDeckSyncState | null;
};

const emptyPending: PendingQuestionWrites = { progress: {}, favorites: {}, deckState: null };

function nowIso() {
  return new Date().toISOString();
}

function sanitizeIds(value: unknown, validIds = validQuestionIds): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && validIds.has(id)))];
}

function readJson(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

function validCategory(value: unknown): CategoryFilter {
  if (value === "all") return "all";
  return questions.some((question) => question.category === value) ? value as CategoryFilter : "all";
}

function validDifficulty(value: unknown): DifficultyFilter {
  return value === "beginner" || value === "intermediate" || value === "advanced" ? value : "all";
}

function sanitizeDeckState(value: unknown, validIds = validQuestionIds): QuestionDeckSyncState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<QuestionDeckSyncState>;
  const currentQuestionId = typeof record.currentQuestionId === "string" && validIds.has(record.currentQuestionId) ? record.currentQuestionId : null;
  return {
    currentQuestionId,
    category: validCategory(record.category),
    difficulty: validDifficulty(record.difficulty),
    favoritesOnly: Boolean(record.favoritesOnly),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : nowIso(),
  };
}

function rowToDeckState(row: QuestionDeckStateRow | null | undefined, validIds = validQuestionIds): QuestionDeckSyncState | null {
  if (!row) return null;
  return sanitizeDeckState({
    currentQuestionId: row.current_question_id,
    category: row.category_filter,
    difficulty: row.difficulty_filter,
    favoritesOnly: row.favorites_only,
    updatedAt: row.updated_at,
  }, validIds);
}

// ======================================================
// QUESTIONS — GUEST LOCAL STORAGE
// ======================================================
function readGuestProgress(validIds = validQuestionIds): string[] {
  const current = readJson(progressKey) as Partial<StoredProgress> | string[] | null;
  if (Array.isArray(current)) return sanitizeIds(current, validIds);
  if (current?.version === 3) return sanitizeIds(current.seen, validIds);
  return sanitizeIds(readJson(legacyProgressKey), validIds);
}

function readGuestImportProgress(validIds = validQuestionIds): string[] {
  const current = readJson(progressKey) as Partial<StoredProgress> | string[] | null;
  const currentIds = Array.isArray(current) ? sanitizeIds(current, validIds) : sanitizeIds(current?.seen, validIds);
  return sanitizeIds([...currentIds, ...sanitizeIds(readJson(legacyProgressKey), validIds)], validIds);
}

function readGuestFavorites(validIds = validQuestionIds): string[] {
  return sanitizeIds(readJson(favoritesKey), validIds);
}

function readGuestDeckState(validIds = validQuestionIds): QuestionDeckSyncState | null {
  return sanitizeDeckState(readJson(deckStateKey), validIds);
}

function saveGuestProgress(seen: string[]) {
  try { localStorage.setItem(progressKey, JSON.stringify({ version: 3, seen } satisfies StoredProgress)); } catch { /* Keep in memory. */ }
}

function saveGuestFavorites(favorites: string[]) {
  try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch { /* Keep in memory. */ }
}

function saveGuestDeckState(deckState: QuestionDeckSyncState) {
  try { localStorage.setItem(deckStateKey, JSON.stringify(deckState)); } catch { /* Keep in memory. */ }
}

function clearImportedGuestState(userId: string) {
  try {
    localStorage.removeItem(progressKey);
    localStorage.removeItem(legacyProgressKey);
    localStorage.removeItem(favoritesKey);
    localStorage.removeItem(deckStateKey);
    localStorage.setItem(`${mergeKeyPrefix}${userId}`, "complete");
  } catch { /* A later idempotent merge is safe if storage is unavailable. */ }
}

function readPending(userId: string): PendingQuestionWrites {
  const value = readJson(`${pendingKeyPrefix}${userId}`) as Partial<PendingQuestionWrites> | null;
  if (!value || typeof value !== "object") return emptyPending;
  return {
    progress: value.progress && typeof value.progress === "object" ? value.progress as Record<string, string> : {},
    favorites: value.favorites && typeof value.favorites === "object" ? value.favorites as PendingQuestionWrites["favorites"] : {},
    deckState: sanitizeDeckState(value.deckState),
  };
}

function savePending(userId: string, pending: PendingQuestionWrites) {
  try {
    const hasPending = Object.keys(pending.progress).length || Object.keys(pending.favorites).length || pending.deckState;
    if (hasPending) localStorage.setItem(`${pendingKeyPrefix}${userId}`, JSON.stringify(pending));
    else localStorage.removeItem(`${pendingKeyPrefix}${userId}`);
  } catch { /* The optimistic in-memory state still stays visible. */ }
}

function updatePending(userId: string, updater: (pending: PendingQuestionWrites) => PendingQuestionWrites) {
  savePending(userId, updater(readPending(userId)));
}

// ======================================================
// QUESTIONS — ACCOUNT SYNCHRONIZATION
// ======================================================
export function useQuestionState(extraQuestionIds: string[] = emptyQuestionIds, initialState: InitialQuestionSyncState | null = null) {
  const [seen, setSeen] = useState<string[]>(initialState?.seen ?? []);
  const [favorites, setFavorites] = useState<string[]>(initialState?.favorites ?? []);
  const [deckState, setDeckState] = useState<QuestionDeckSyncState | null>(initialState?.deckState ?? null);
  const [accountId, setAccountId] = useState<string | null>(initialState?.userId ?? null);
  const [ready, setReady] = useState(Boolean(initialState));
  const [syncError, setSyncError] = useState("");
  const [pendingRevision, setPendingRevision] = useState(0);
  const loadSequence = useRef(0);
  const accountIdRef = useRef<string | null>(initialState?.userId ?? null);
  const retryAttempt = useRef(0);
  const validIds = useMemo(() => new Set([...validQuestionIds, ...extraQuestionIds]), [extraQuestionIds]);

  const queuePendingWrite = useCallback((userId: string, updater: (pending: PendingQuestionWrites) => PendingQuestionWrites) => {
    updatePending(userId, updater);
    setPendingRevision((value) => value + 1);
  }, []);

  const loadAccountState = useCallback(async (userId: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Account sync is unavailable.");
    const sequence = ++loadSequence.current;
    const [progressResult, favoritesResult, deckStateResult] = await Promise.all([
      client.from("question_progress").select("question_id,last_viewed_at").eq("user_id", userId),
      client.from("question_favorites").select("question_id,is_favorite,favorite_updated_at").eq("user_id", userId).eq("is_favorite", true),
      client.from("question_deck_state").select("current_question_id,category_filter,difficulty_filter,favorites_only,updated_at").eq("user_id", userId).maybeSingle(),
    ]);
    if (progressResult.error || favoritesResult.error || deckStateResult.error) throw new Error("Couldn’t synchronize question progress.");
    if (sequence !== loadSequence.current || accountIdRef.current !== userId) return;
    setSeen(sanitizeIds((progressResult.data as QuestionProgressRow[]).map((row) => row.question_id), validIds));
    setFavorites(sanitizeIds((favoritesResult.data as QuestionFavoriteRow[]).map((row) => row.question_id), validIds));
    setDeckState(rowToDeckState(deckStateResult.data as QuestionDeckStateRow | null, validIds));
    setSyncError("");
    setReady(true);
  }, [validIds]);

  const flushPendingWrites = useCallback(async (userId: string) => {
    const pending = readPending(userId);
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Account sync is unavailable.");
    const progressRows = Object.entries(pending.progress)
      .filter(([questionId]) => validIds.has(questionId))
      .map(([question_id, last_viewed_at]) => ({ question_id, last_viewed_at }));
    const favoriteRows = Object.entries(pending.favorites)
      .filter(([questionId]) => validIds.has(questionId))
      .map(([question_id, value]) => ({ question_id, is_favorite: value.isFavorite, favorite_updated_at: value.updatedAt }));
    let remaining: PendingQuestionWrites = pending;
    const failures: string[] = [];
    // Flush each durable queue lane independently. A successful progress write must
    // never remain stuck behind a temporary favorite/deck request failure.
    if (progressRows.length) {
      const { error } = await client.from("question_progress").upsert(progressRows, { onConflict: "user_id,question_id" });
      if (error) failures.push("progress"); else remaining = { ...remaining, progress: {} };
    }
    if (favoriteRows.length) {
      const { error } = await client.from("question_favorites").upsert(favoriteRows, { onConflict: "user_id,question_id" });
      if (error) failures.push("favorites"); else remaining = { ...remaining, favorites: {} };
    }
    if (pending.deckState) {
      const { error } = await client.from("question_deck_state").upsert({
        current_question_id: pending.deckState.currentQuestionId,
        category_filter: pending.deckState.category,
        difficulty_filter: pending.deckState.difficulty,
        favorites_only: pending.deckState.favoritesOnly,
        updated_at: pending.deckState.updatedAt,
      }, { onConflict: "user_id" });
      if (error) failures.push("continuation"); else remaining = { ...remaining, deckState: null };
    }
    savePending(userId, remaining);
    setPendingRevision((value) => value + 1);
    if (failures.length) throw new Error("Question changes are saved on this device and will retry automatically.");
    retryAttempt.current = 0;
  }, [validIds]);

  const mergeGuestState = useCallback(async (userId: string) => {
    try { if (localStorage.getItem(`${mergeKeyPrefix}${userId}`) === "complete") return; } catch { /* Continue idempotently. */ }
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Account sync is unavailable.");
    const guestSeen = readGuestImportProgress(validIds);
    const guestFavorites = readGuestFavorites(validIds);
    const guestDeckState = readGuestDeckState(validIds);
    const [progressResult, favoritesResult, deckStateResult] = await Promise.all([
      client.from("question_progress").select("question_id").eq("user_id", userId),
      client.from("question_favorites").select("question_id").eq("user_id", userId),
      client.from("question_deck_state").select("updated_at").eq("user_id", userId).maybeSingle(),
    ]);
    if (progressResult.error || favoritesResult.error || deckStateResult.error) throw new Error("Couldn’t import this device’s question history.");
    const serverSeen = new Set((progressResult.data as QuestionProgressRow[]).map((row) => row.question_id));
    const serverFavoriteRows = new Set((favoritesResult.data as QuestionFavoriteRow[]).map((row) => row.question_id));
    const timestamp = nowIso();
    const missingSeen = guestSeen.filter((id) => !serverSeen.has(id)).map((question_id) => ({ question_id, last_viewed_at: timestamp }));
    const missingFavorites = guestFavorites.filter((id) => !serverFavoriteRows.has(id)).map((question_id) => ({ question_id, is_favorite: true, favorite_updated_at: timestamp }));
    const writes = [];
    if (missingSeen.length) writes.push(client.from("question_progress").upsert(missingSeen, { onConflict: "user_id,question_id" }));
    if (missingFavorites.length) writes.push(client.from("question_favorites").upsert(missingFavorites, { onConflict: "user_id,question_id" }));
    if (guestDeckState && (!deckStateResult.data?.updated_at || new Date(guestDeckState.updatedAt) > new Date(deckStateResult.data.updated_at))) {
      writes.push(client.from("question_deck_state").upsert({
        current_question_id: guestDeckState.currentQuestionId,
        category_filter: guestDeckState.category,
        difficulty_filter: guestDeckState.difficulty,
        favorites_only: guestDeckState.favoritesOnly,
        updated_at: guestDeckState.updatedAt,
      }, { onConflict: "user_id" }));
    }
    const results = await Promise.all(writes);
    if (results.some((result) => result.error)) throw new Error("Couldn’t import this device’s question history.");
    clearImportedGuestState(userId);
  }, [validIds]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    let active = true;
    const invalidatePendingLoads = () => { loadSequence.current += 1; };

    function loadGuest() {
      ++loadSequence.current;
      accountIdRef.current = null;
      setAccountId(null);
      const restoredSeen = readGuestProgress(validIds);
      const restoredFavorites = readGuestFavorites(validIds);
      const restoredDeckState = readGuestDeckState(validIds);
      setSeen(restoredSeen);
      setFavorites(restoredFavorites);
      setDeckState(restoredDeckState);
      saveGuestProgress(restoredSeen);
      saveGuestFavorites(restoredFavorites);
      setSyncError("");
      setReady(true);
    }

    async function loadUser(userId: string) {
      const sameUser = accountIdRef.current === userId;
      const sequence = ++loadSequence.current;
      accountIdRef.current = userId;
      setAccountId(userId);
      if (!sameUser) {
        setSeen([]);
        setFavorites([]);
        setDeckState(null);
        setReady(false);
      }
      setSyncError("");
      try {
        await mergeGuestState(userId);
        await flushPendingWrites(userId);
        if (active && sequence === loadSequence.current) await loadAccountState(userId);
      } catch (error) {
        if (!active || accountIdRef.current !== userId) return;
        setSyncError(error instanceof Error ? error.message : "Couldn’t synchronize question progress.");
        setReady(sameUser);
      }
    }

    if (!client) {
      loadGuest();
      return;
    }

    client.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!active) return;
      if (data.user) void loadUser(data.user.id); else loadGuest();
    }).catch(() => {
      if (active) loadGuest();
    });
    const { data: authListener } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      if (session?.user) void loadUser(session.user.id); else loadGuest();
    });
    return () => {
      active = false;
      invalidatePendingLoads();
      authListener.subscription.unsubscribe();
    };
  }, [flushPendingWrites, loadAccountState, mergeGuestState, validIds]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !accountId) return;
    let active = true;
    let channel: ReturnType<typeof client.channel> | null = null;
    const refresh = () => {
      if (!active) return;
      void flushPendingWrites(accountId)
        .then(() => loadAccountState(accountId))
        .catch(() => setSyncError("Question sync is retrying. Your latest actions are kept on this device."));
    };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    void client.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      if (!active || !data.session) return;
      await client.realtime.setAuth(data.session.access_token);
      if (!active) return;
      channel = client.channel(`question-state:${accountId}`, { config: { private: true } })
        .on("broadcast", { event: "question_state_changed" }, refresh)
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSyncError("Live sync is reconnecting. Your progress will refresh automatically.");
        });
    }).catch(() => {
      if (active) setSyncError("Live sync is temporarily unavailable. Your progress will refresh automatically.");
    });
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      if (channel) void client.removeChannel(channel);
    };
  }, [accountId, flushPendingWrites, loadAccountState]);

  // A real offline queue must recover without waiting for a manual focus event.
  // Backoff is capped to avoid noisy retries on a weak mobile connection.
  useEffect(() => {
    if (!accountId) return;
    const pending = readPending(accountId);
    if (!Object.keys(pending.progress).length && !Object.keys(pending.favorites).length && !pending.deckState) return;
    const delay = Math.min(30_000, 2_000 * 2 ** retryAttempt.current);
    const timer = window.setTimeout(() => {
      void flushPendingWrites(accountId)
        .then(() => loadAccountState(accountId))
        .catch(() => {
          retryAttempt.current += 1;
          setSyncError("Changes saved on this device. Syncing when the connection returns.");
          setPendingRevision((value) => value + 1);
        });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [accountId, flushPendingWrites, loadAccountState, pendingRevision]);

  useEffect(() => {
    if (accountId) return;
    const refreshGuest = (event: StorageEvent) => {
      if (![progressKey, legacyProgressKey, favoritesKey, deckStateKey].includes(event.key || "")) return;
      setSeen(readGuestProgress(validIds));
      setFavorites(readGuestFavorites(validIds));
      setDeckState(readGuestDeckState(validIds));
    };
    window.addEventListener("storage", refreshGuest);
    return () => window.removeEventListener("storage", refreshGuest);
  }, [accountId, validIds]);

  const markExplored = useCallback(async (questionId: string) => {
    if (!validIds.has(questionId)) return true;
    const timestamp = nowIso();
    const alreadySeen = seen.includes(questionId);
    if (!alreadySeen) setSeen([...seen, questionId]);
    setSyncError("");
    if (!accountId) {
      if (!alreadySeen) saveGuestProgress([...seen, questionId]);
      return true;
    }
    const client = getSupabaseBrowserClient();
    const { error } = await client!.from("question_progress").upsert({ question_id: questionId, last_viewed_at: timestamp }, { onConflict: "user_id,question_id" });
    if (!error) return true;
    queuePendingWrite(accountId, (pending) => ({ ...pending, progress: { ...pending.progress, [questionId]: timestamp } }));
    setSyncError("Changes saved on this device. Syncing when the connection returns.");
    return false;
  }, [accountId, queuePendingWrite, seen, validIds]);

  const setFavorite = useCallback(async (questionId: string, favorite: boolean) => {
    if (!validIds.has(questionId)) return false;
    const timestamp = nowIso();
    const updated = favorite ? sanitizeIds([...favorites, questionId], validIds) : favorites.filter((id) => id !== questionId);
    setFavorites(updated);
    setSyncError("");
    if (!accountId) { saveGuestFavorites(updated); return true; }
    const client = getSupabaseBrowserClient()!;
    const { error } = await client.from("question_favorites").upsert({
      question_id: questionId,
      is_favorite: favorite,
      favorite_updated_at: timestamp,
    }, { onConflict: "user_id,question_id" });
    if (!error) return true;
    queuePendingWrite(accountId, (pending) => ({
      ...pending,
      favorites: { ...pending.favorites, [questionId]: { isFavorite: favorite, updatedAt: timestamp } },
    }));
    setSyncError("Changes saved on this device. Syncing when the connection returns.");
    return false;
  }, [accountId, favorites, queuePendingWrite, validIds]);

  const saveDeckState = useCallback(async (state: Omit<QuestionDeckSyncState, "updatedAt">) => {
    const updated: QuestionDeckSyncState = {
      ...state,
      currentQuestionId: state.currentQuestionId && validIds.has(state.currentQuestionId) ? state.currentQuestionId : null,
      updatedAt: nowIso(),
    };
    setDeckState(updated);
    setSyncError("");
    if (!accountId) { saveGuestDeckState(updated); return true; }
    const client = getSupabaseBrowserClient()!;
    const { error } = await client.from("question_deck_state").upsert({
      current_question_id: updated.currentQuestionId,
      category_filter: updated.category,
      difficulty_filter: updated.difficulty,
      favorites_only: updated.favoritesOnly,
      updated_at: updated.updatedAt,
    }, { onConflict: "user_id" });
    if (!error) return true;
    queuePendingWrite(accountId, (pending) => ({ ...pending, deckState: updated }));
    setSyncError("Changes saved on this device. Syncing when the connection returns.");
    return false;
  }, [accountId, queuePendingWrite, validIds]);

  const resetProgress = useCallback(async (questionIds: string[]) => {
    const ids = sanitizeIds(questionIds, validIds).filter((id) => seen.includes(id));
    if (!ids.length) return true;
    const previous = seen;
    const remove = new Set(ids);
    const updated = seen.filter((id) => !remove.has(id));
    setSeen(updated);
    setSyncError("");
    if (!accountId) { saveGuestProgress(updated); return true; }
    const client = getSupabaseBrowserClient()!;
    for (let index = 0; index < ids.length; index += 200) {
      const { error } = await client.from("question_progress").delete().eq("user_id", accountId).in("question_id", ids.slice(index, index + 200));
      if (error) {
        setSeen(previous);
        setSyncError("Progress reset was interrupted. Your account state was restored.");
        return false;
      }
    }
    return true;
  }, [accountId, seen, validIds]);

  const refreshState = useCallback(async () => {
    if (!accountId) return;
    await flushPendingWrites(accountId);
    await loadAccountState(accountId);
  }, [accountId, flushPendingWrites, loadAccountState]);

  return { seen, favorites, deckState, ready, syncError, markExplored, setFavorite, saveDeckState, resetProgress, refreshState };
}

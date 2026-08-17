"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { questions } from "@/lib/questions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const progressKey = "gsc_question_progress_v3";
const legacyProgressKey = "gsc_seen_questions_v2";
const favoritesKey = "gsc_question_favorites_v1";
const mergeKeyPrefix = "gsc_question_account_merge_v1:";
const validQuestionIds = new Set(questions.map((question) => question.id));

type StoredProgress = { version: 3; seen: string[] };
type QuestionStateRow = { question_id: string };

function sanitizeIds(value: unknown, validIds = validQuestionIds): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && validIds.has(id)))];
}

function readJson(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

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

function saveGuestProgress(seen: string[]) {
  try { localStorage.setItem(progressKey, JSON.stringify({ version: 3, seen } satisfies StoredProgress)); } catch { /* Keep in memory. */ }
}

function saveGuestFavorites(favorites: string[]) {
  try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch { /* Keep in memory. */ }
}

function clearImportedGuestState(userId: string) {
  try {
    localStorage.removeItem(progressKey);
    localStorage.removeItem(legacyProgressKey);
    localStorage.removeItem(favoritesKey);
    localStorage.setItem(`${mergeKeyPrefix}${userId}`, "complete");
  } catch { /* A later idempotent merge is safe if storage is unavailable. */ }
}

export function useQuestionState(extraQuestionIds: string[] = []) {
  const [seen, setSeen] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  const loadSequence = useRef(0);
  const accountIdRef = useRef<string | null>(null);
  const validIds = useMemo(() => new Set([...validQuestionIds, ...extraQuestionIds]), [extraQuestionIds]);

  const loadAccountState = useCallback(async (userId: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Account sync is unavailable.");
    const sequence = ++loadSequence.current;
    const [progressResult, favoritesResult] = await Promise.all([
      client.from("question_progress").select("question_id").eq("user_id", userId),
      client.from("question_favorites").select("question_id").eq("user_id", userId),
    ]);
    if (progressResult.error || favoritesResult.error) throw new Error("Couldn’t synchronize question progress.");
    if (sequence !== loadSequence.current || accountIdRef.current !== userId) return;
    setSeen(sanitizeIds((progressResult.data as QuestionStateRow[]).map((row) => row.question_id), validIds));
    setFavorites(sanitizeIds((favoritesResult.data as QuestionStateRow[]).map((row) => row.question_id), validIds));
    setSyncError("");
    setReady(true);
  }, [validIds]);

  const mergeGuestState = useCallback(async (userId: string) => {
    try { if (localStorage.getItem(`${mergeKeyPrefix}${userId}`) === "complete") return; } catch { /* Continue idempotently. */ }
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Account sync is unavailable.");
    const guestSeen = readGuestImportProgress(validIds);
    const guestFavorites = readGuestFavorites(validIds);
    const [progressResult, favoritesResult] = await Promise.all([
      client.from("question_progress").select("question_id").eq("user_id", userId),
      client.from("question_favorites").select("question_id").eq("user_id", userId),
    ]);
    if (progressResult.error || favoritesResult.error) throw new Error("Couldn’t import this device’s question history.");
    const serverSeen = new Set((progressResult.data as QuestionStateRow[]).map((row) => row.question_id));
    const serverFavorites = new Set((favoritesResult.data as QuestionStateRow[]).map((row) => row.question_id));
    const missingSeen = guestSeen.filter((id) => !serverSeen.has(id));
    const missingFavorites = guestFavorites.filter((id) => !serverFavorites.has(id));
    const insertions = [];
    if (missingSeen.length) insertions.push(client.from("question_progress").insert(missingSeen.map((question_id) => ({ question_id }))));
    if (missingFavorites.length) insertions.push(client.from("question_favorites").insert(missingFavorites.map((question_id) => ({ question_id }))));
    const results = await Promise.all(insertions);
    if (results.some((result) => result.error && result.error.code !== "23505")) throw new Error("Couldn’t import this device’s question history.");
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
      setSeen(restoredSeen);
      setFavorites(restoredFavorites);
      saveGuestProgress(restoredSeen);
      saveGuestFavorites(restoredFavorites);
      setSyncError("");
      setReady(true);
    }

    async function loadUser(userId: string) {
      if (accountIdRef.current === userId) return;
      const sequence = ++loadSequence.current;
      accountIdRef.current = userId;
      setAccountId(userId);
      setSeen([]);
      setFavorites([]);
      setReady(false);
      setSyncError("");
      try {
        await mergeGuestState(userId);
        if (active && sequence === loadSequence.current) await loadAccountState(userId);
      } catch (error) {
        if (!active || accountIdRef.current !== userId) return;
        setSyncError(error instanceof Error ? error.message : "Couldn’t synchronize question progress.");
        setReady(false);
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
  }, [loadAccountState, mergeGuestState, validIds]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !accountId) return;
    let active = true;
    let channel: ReturnType<typeof client.channel> | null = null;
    const refresh = () => { if (active) void loadAccountState(accountId).catch(() => setSyncError("Couldn’t refresh question progress.")); };
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
  }, [accountId, loadAccountState]);

  useEffect(() => {
    if (accountId) return;
    const refreshGuest = (event: StorageEvent) => {
      if (![progressKey, legacyProgressKey, favoritesKey].includes(event.key || "")) return;
      setSeen(readGuestProgress(validIds));
      setFavorites(readGuestFavorites(validIds));
    };
    window.addEventListener("storage", refreshGuest);
    return () => window.removeEventListener("storage", refreshGuest);
  }, [accountId, validIds]);

  const markExplored = useCallback(async (questionId: string) => {
    if (!validIds.has(questionId) || seen.includes(questionId)) return true;
    const updated = [...seen, questionId];
    setSeen(updated);
    setSyncError("");
    if (!accountId) { saveGuestProgress(updated); return true; }
    const client = getSupabaseBrowserClient();
    const { error } = await client!.from("question_progress").insert({ question_id: questionId });
    if (!error || error.code === "23505") return true;
    await loadAccountState(accountId).catch(() => setSeen(seen));
    setSyncError("That question couldn’t be saved. Your account state was restored.");
    return false;
  }, [accountId, loadAccountState, seen, validIds]);

  const setFavorite = useCallback(async (questionId: string, favorite: boolean) => {
    if (!validIds.has(questionId)) return false;
    const previous = favorites;
    const updated = favorite ? sanitizeIds([...favorites, questionId], validIds) : favorites.filter((id) => id !== questionId);
    setFavorites(updated);
    setSyncError("");
    if (!accountId) { saveGuestFavorites(updated); return true; }
    const client = getSupabaseBrowserClient()!;
    const result = favorite
      ? await client.from("question_favorites").insert({ question_id: questionId })
      : await client.from("question_favorites").delete().eq("user_id", accountId).eq("question_id", questionId);
    if (!result.error || (favorite && result.error.code === "23505")) return true;
    await loadAccountState(accountId).catch(() => setFavorites(previous));
    setSyncError("That favorite couldn’t be saved. Your account state was restored.");
    return false;
  }, [accountId, favorites, loadAccountState, validIds]);

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
        await loadAccountState(accountId).catch(() => setSeen(previous));
        setSyncError("Progress reset was interrupted. Your account state was refreshed.");
        return false;
      }
    }
    return true;
  }, [accountId, loadAccountState, seen, validIds]);

  return { seen, favorites, ready, syncError, markExplored, setFavorite, resetProgress };
}

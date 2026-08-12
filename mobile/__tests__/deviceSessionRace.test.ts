/**
 * Single-device-login race — the cause of "female user logs out automatically".
 *
 * registerDeviceSession tore down synchronously but awaited before installing
 * its watchers, so two overlapping auth events (a cold-start INITIAL_SESSION
 * followed closely by TOKEN_REFRESHED) interleaved: the earlier invocation
 * leaked a poll holding a stale session id, that poll read the id the later
 * invocation had written, concluded another device had taken over, and signed
 * the user out. One device, no second login, spontaneous logout.
 *
 * The fix has two halves and both are load-bearing:
 *   1. a generation counter, so a superseded invocation installs nothing, and
 *   2. serialisation, so a superseded invocation never *writes* either — a
 *      late-landing stale write would otherwise poison the row and kick the
 *      legitimate watcher.
 *
 * Modelled here rather than driven through sessionStore because the Supabase
 * client cannot be constructed off-device.
 */
import { describe, expect, it } from '@jest/globals';

type Watcher = { myId: string; isCurrent: () => boolean };

/** Mirrors registerDeviceSession's guard + queue. */
function makeRegistrar({ serialised }: { serialised: boolean }) {
  let generation = 0;
  let serverId: string | null = null;
  let chain: Promise<void> = Promise.resolve();
  const kicks: string[] = [];
  const watchers: Watcher[] = [];

  async function run(newId: string, delayMs: number, mine: number): Promise<void> {
    const superseded = (): boolean => mine !== generation;

    // Serialised runs check staleness before writing anything.
    if (serialised && superseded()) {
      return;
    }

    await new Promise(r => setTimeout(r, delayMs));
    serverId = newId; // the claim write

    if (superseded()) {
      return;
    }
    watchers.push({ myId: newId, isCurrent: () => !superseded() });
  }

  function register(newId: string, delayMs: number): Promise<void> {
    const mine = ++generation;
    if (!serialised) {
      return run(newId, delayMs, mine);
    }
    chain = chain.then(() => run(newId, delayMs, mine));
    return chain;
  }

  /** One interval tick across every watcher still installed. */
  function poll(): void {
    for (const w of watchers) {
      if (w.isCurrent() && serverId && serverId !== w.myId) {
        kicks.push(w.myId);
      }
    }
  }

  return { register, poll, kicks, watchers, currentServerId: () => serverId };
}

describe('device-session registration race', () => {
  it('leaves exactly one live watcher when registrations overlap', async () => {
    const r = makeRegistrar({ serialised: true });
    await Promise.all([r.register('A', 20), r.register('B', 5)]);

    expect(r.watchers.filter(w => w.isCurrent())).toHaveLength(1);
  });

  it('does not sign the user out when registrations overlap', async () => {
    const r = makeRegistrar({ serialised: true });
    await Promise.all([r.register('A', 20), r.register('B', 5)]);

    r.poll();
    expect(r.kicks).toEqual([]);
  });

  it('leaves the row holding the winning id, not a stale one', async () => {
    const r = makeRegistrar({ serialised: true });
    await Promise.all([r.register('A', 20), r.register('B', 5)]);

    const live = r.watchers.filter(w => w.isCurrent());
    expect(r.currentServerId()).toBe(live[0]!.myId);
  });

  it('a superseded watcher never reaches the kick path', async () => {
    const r = makeRegistrar({ serialised: true });
    await r.register('A', 0);
    const stale = r.watchers[0]!;
    await r.register('B', 0);

    expect(stale.isCurrent()).toBe(false);
    r.poll();
    expect(r.kicks).toEqual([]);
  });

  it('without serialisation the stale write still kicks — why the queue exists', async () => {
    const r = makeRegistrar({ serialised: false });
    // B is requested second but its write lands first; A's late write wins the
    // row while B is the live watcher.
    await Promise.all([r.register('A', 20), r.register('B', 5)]);

    r.poll();
    expect(r.kicks).toEqual(['B']);
  });
});

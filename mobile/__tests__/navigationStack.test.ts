/**
 * Navigation stack behaviour (alpha round 2, issue 7).
 *
 * Reproduces the reported repro against the real StackRouter:
 *   Profile → Buy Coins → Back → Profile → Edit Profile → Back
 * used to land on Buy Coins instead of Profile.
 *
 * Cause: React Navigation v7 changed `navigate` so it only reuses an existing
 * route when that route is the *focused* one. A back handler that called
 * `navigate('MaleTabs')` therefore pushed a duplicate tabs instance and left
 * CoinStore stranded underneath it. These tests pin both the broken semantics
 * (so an upgrade that changes them is noticed) and the corrected behaviour.
 */
import { describe, expect, it } from '@jest/globals';
import { CommonActions, StackActions, StackRouter } from '@react-navigation/routers';

const ROUTE_NAMES = ['MaleTabs', 'CoinStore', 'EditProfile'];

type RouterOptions = Parameters<ReturnType<typeof StackRouter>['getInitialState']>[0];

const options = {
  routeNames: ROUTE_NAMES,
  routeParamList: {},
  routeGetIdList: {},
} as unknown as RouterOptions;

function makeRouter() {
  const router = StackRouter({});
  let state = router.getInitialState(options);

  return {
    dispatch(action: Parameters<typeof router.getStateForAction>[1]) {
      const next = router.getStateForAction(state, action, options);
      if (next === null) {
        throw new Error('router rejected the action');
      }
      state = next as typeof state;
      return this;
    },
    get names(): string[] {
      return state.routes.map(r => r.name);
    },
    get focused(): string {
      return state.routes[state.index]?.name ?? '';
    },
  };
}

describe('stack back-behaviour', () => {
  it('navigate() pushes a duplicate instead of popping (the v7 trap)', () => {
    const nav = makeRouter()
      .dispatch(CommonActions.navigate({ name: 'CoinStore' }))
      // What the old CoinStore back handler did.
      .dispatch(CommonActions.navigate({ name: 'MaleTabs' }));

    expect(nav.names).toEqual(['MaleTabs', 'CoinStore', 'MaleTabs']);
  });

  it('reproduces the reported bug with the old back handler', () => {
    const nav = makeRouter()
      .dispatch(CommonActions.navigate({ name: 'CoinStore' })) // Buy Coins
      .dispatch(CommonActions.navigate({ name: 'MaleTabs' })) // "Back"
      .dispatch(CommonActions.navigate({ name: 'EditProfile' })) // Edit Profile
      .dispatch(CommonActions.goBack()); // Back

    // Focused on the stranded duplicate; one more Back surfaces Buy Coins.
    expect(nav.focused).toBe('MaleTabs');
    nav.dispatch(CommonActions.goBack());
    expect(nav.focused).toBe('CoinStore');
  });

  it('goBack() returns to the immediate previous screen', () => {
    const nav = makeRouter()
      .dispatch(CommonActions.navigate({ name: 'CoinStore' }))
      .dispatch(CommonActions.goBack());

    expect(nav.names).toEqual(['MaleTabs']);
    expect(nav.focused).toBe('MaleTabs');
  });

  it('the fixed flow leaves no stranded route behind', () => {
    const nav = makeRouter()
      .dispatch(CommonActions.navigate({ name: 'CoinStore' })) // Buy Coins
      .dispatch(CommonActions.goBack()) // Back (fixed handler)
      .dispatch(CommonActions.navigate({ name: 'EditProfile' })) // Edit Profile
      .dispatch(CommonActions.goBack()); // Back

    expect(nav.names).toEqual(['MaleTabs']);
    expect(nav.focused).toBe('MaleTabs');
  });

  it('popTo() unwinds a completed flow without duplicating the tabs', () => {
    const nav = makeRouter()
      .dispatch(CommonActions.navigate({ name: 'CoinStore' }))
      .dispatch(CommonActions.navigate({ name: 'EditProfile' })) // stands in for the payment screens
      .dispatch(StackActions.popTo('MaleTabs'));

    expect(nav.names).toEqual(['MaleTabs']);
  });

  it('repeated visits do not grow the stack', () => {
    const nav = makeRouter();
    for (let i = 0; i < 5; i += 1) {
      nav.dispatch(CommonActions.navigate({ name: 'CoinStore' })).dispatch(CommonActions.goBack());
    }
    expect(nav.names).toEqual(['MaleTabs']);
  });
});

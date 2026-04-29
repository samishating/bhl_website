type RealtimeEvent = {
  type: 'division-xp-update';
  timestamp: number;
  reason: string;
  userId?: string;
  divisions?: string[];
};

type Subscriber = {
  push: (event: RealtimeEvent) => void;
};

type RealtimeState = {
  nextId: number;
  subscribers: Map<number, Subscriber>;
};

declare global {
  var __bhlRealtimeState: RealtimeState | undefined;
}

function getRealtimeState(): RealtimeState {
  if (!global.__bhlRealtimeState) {
    global.__bhlRealtimeState = {
      nextId: 1,
      subscribers: new Map(),
    };
  }

  return global.__bhlRealtimeState;
}

export function subscribeToRealtimeUpdates(push: Subscriber['push']) {
  const state = getRealtimeState();
  const id = state.nextId++;
  state.subscribers.set(id, { push });

  return () => {
    state.subscribers.delete(id);
  };
}

export function publishRealtimeUpdate(event: Omit<RealtimeEvent, 'timestamp'>) {
  const payload: RealtimeEvent = {
    ...event,
    timestamp: Date.now(),
  };

  const { subscribers } = getRealtimeState();
  for (const subscriber of subscribers.values()) {
    try {
      subscriber.push(payload);
    } catch (error) {
      console.error('Failed to push realtime update:', error);
    }
  }
}

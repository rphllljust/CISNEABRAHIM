/** In-process latch so concurrent async workers start together (same event-loop tick batch). */
export class ConcurrencyLatch {
  private arrived = 0;
  private readonly releaseWaiters: Array<() => void> = [];

  constructor(private readonly parties: number) {
    if (parties < 2) {
      throw new Error('ConcurrencyLatch requires at least 2 parties.');
    }
  }

  async arriveAndWait(): Promise<void> {
    this.arrived += 1;
    if (this.arrived >= this.parties) {
      for (const release of this.releaseWaiters) {
        release();
      }
      return;
    }
    return new Promise<void>((resolve) => {
      this.releaseWaiters.push(resolve);
    });
  }
}

export async function runWithStartLatch<T>(
  parties: number,
  workers: Array<() => Promise<T>>,
): Promise<PromiseSettledResult<T>[]> {
  if (workers.length !== parties) {
    throw new Error('Worker count must match latch parties.');
  }
  const latch = new ConcurrencyLatch(parties);
  return Promise.allSettled(
    workers.map(
      (worker) =>
        (async () => {
          await latch.arriveAndWait();
          return worker();
        })(),
    ),
  );
}

export function countFulfilled<T>(results: PromiseSettledResult<T>[]): number {
  return results.filter((result) => result.status === 'fulfilled').length;
}

export function countRejected<T>(results: PromiseSettledResult<T>[]): number {
  return results.filter((result) => result.status === 'rejected').length;
}

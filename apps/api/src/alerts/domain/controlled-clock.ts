let currentNow: Date | null = null;

export function getControlledNow(): Date {
  return currentNow ? new Date(currentNow) : new Date();
}

export function setControlledNow(value: Date | null): void {
  currentNow = value ? new Date(value) : null;
}

export function resetControlledNow(): void {
  currentNow = null;
}

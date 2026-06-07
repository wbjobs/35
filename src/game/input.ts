import { playerMove, isPlayerTurn, isGameOver, goToNextFloor } from './turnManager';
import type { TurnResult } from './turnManager';
import { DIRECTIONS } from '../constants/gameConfig';

export type { TurnResult };
export type InputCallback = (result: TurnResult) => void;

let onInputCallback: InputCallback | null = null;
let isProcessing = false;

export function setInputCallback(callback: InputCallback): void {
  onInputCallback = callback;
}

export function handleKeyDown(event: KeyboardEvent): void {
  if (isProcessing || isGameOver()) return;
  if (!isPlayerTurn()) return;

  let dx = 0;
  let dy = 0;
  let handled = false;

  switch (event.key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      dx = DIRECTIONS.UP.x;
      dy = DIRECTIONS.UP.y;
      handled = true;
      break;
    case 'arrowdown':
    case 's':
      dx = DIRECTIONS.DOWN.x;
      dy = DIRECTIONS.DOWN.y;
      handled = true;
      break;
    case 'arrowleft':
    case 'a':
      dx = DIRECTIONS.LEFT.x;
      dy = DIRECTIONS.LEFT.y;
      handled = true;
      break;
    case 'arrowright':
    case 'd':
      dx = DIRECTIONS.RIGHT.x;
      dy = DIRECTIONS.RIGHT.y;
      handled = true;
      break;
    case ' ':
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();

    if (dx !== 0 || dy !== 0) {
      isProcessing = true;
      const result = playerMove(dx, dy);
      isProcessing = false;

      if (onInputCallback) {
        onInputCallback(result);
      }
    }
  }
}

export function handleNextFloor(): void {
  if (isProcessing || isGameOver()) return;

  isProcessing = true;
  goToNextFloor();
  isProcessing = false;

  if (onInputCallback) {
    onInputCallback({ success: true });
  }
}

export function initInput(): void {
  window.addEventListener('keydown', handleKeyDown);
}

export function cleanupInput(): void {
  window.removeEventListener('keydown', handleKeyDown);
}

export function isInputProcessing(): boolean {
  return isProcessing;
}

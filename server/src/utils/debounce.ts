export const debounceHeadTail = <F extends (...args: any[]) => void>(
  func: F,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let firstRun: boolean = true;

  return function (...args: Parameters<F>) {
    if (firstRun) {
      func(...args);
      firstRun = false;
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      firstRun = true; // Reset firstRun for the next series of invocations
    }, delay);
  };
};

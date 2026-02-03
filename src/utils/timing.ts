export const createDebounce = (delay = 300) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (callback: () => void) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
};

type LoaderListener = (activeRequests: number) => void;

let activeRequests = 0;
const listeners = new Set<LoaderListener>();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

export const startApiRequest = () => {
  activeRequests += 1;
  notify();
};

export const endApiRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

export const subscribeApiLoader = (listener: LoaderListener) => {
  listeners.add(listener);
  listener(activeRequests);
  return () => {
    listeners.delete(listener);
  };
};

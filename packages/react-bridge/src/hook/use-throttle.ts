// @ts-ignore
import { throttle } from 'lodash';
import { useMemo, useRef, useEffect } from 'react';

type noop = (...args: any[]) => any;

export interface ThrottleOptions {
  wait?: number;
  leading?: boolean;
  trailing?: boolean;
}
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}
const useUnmount = (fn: () => void) => {

  const fnRef = useLatest(fn);

  useEffect(
    () => () => {
      fnRef.current();
    },
    [],
  );
};

function useThrottleFn<T extends noop>(fn: T, options?: ThrottleOptions): any {

  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;
  const throttled = useMemo(
    () =>
      throttle(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return {
    run: throttled,
    cancel: throttled.cancel,
    flush: throttled.flush,
  };
}

// @ts-ignore
export default useThrottleFn;

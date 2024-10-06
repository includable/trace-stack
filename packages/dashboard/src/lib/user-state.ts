import { useState } from "react";

const PREFIX = `trace-stack/`;

/**
 * Hook to store user state in local storage.
 *
 * @param {string} key
 * @param {any?} defaultValue
 * @returns {[any, ((value: any) => void)]}
 */
export const useUserState = (key: string, defaultValue: any = null) => {
  const [state, setState] = useState(() => {
    if (!key) {
      throw new Error("no key provided for useUserState");
    }
    const value = localStorage.getItem(`${PREFIX}${key}`);
    return value ? JSON.parse(value) : defaultValue;
  });

  return [
    state,
    (value: any) => {
      setState((old: any) => {
        if (typeof value === "function") {
          value = value(old);
        }

        if (value === null || value === undefined) {
          localStorage.removeItem(`${PREFIX}${key}`);
        } else {
          localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
        }

        return value;
      });
    },
  ];
};

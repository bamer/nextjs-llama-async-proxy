"use client";

import { toast, ToastT } from "sonner";

interface ToastFunctions {
  show: (message: string, options?: ToastT) => number | Promise<number>;
  success: (message: string, options?: Omit<ToastT, "type" | "message">) => number | Promise<number>;
  error: (message: string, options?: Omit<ToastT, "type" | "message">) => number | Promise<number>;
  warning: (message: string, options?: Omit<ToastT, "type" | "message">) => number | Promise<number>;
  info: (message: string, options?: Omit<ToastT, "type" | "message">) => number | Promise<number>;
  progress: (message: string, options?: Omit<ToastT, "type" | "message">) => Promise<number>;
  dismiss: (id?: number | string | undefined) => void;
}

const toastOptions: Partial<ToastT> = {
  style: { background: "#1e1e1e", color: "#fff" },
  className: "sonner-toast-custom",
};

export function useToast(): ToastFunctions {
  const show = (message: string, options?: ToastT): number | Promise<number> => {
    return toast(message, { ...toastOptions, ...options }) as number | Promise<number>;
  };

  const success = (message: string, options?: Omit<ToastT, "type" | "message">): number | Promise<number> => {
    return toast.success(message, { ...toastOptions, ...options }) as number | Promise<number>;
  };

  const error = (message: string, options?: Omit<ToastT, "type" | "message">): number | Promise<number> => {
    return toast.error(message, { ...toastOptions, ...options }) as number | Promise<number>;
  };

  const warning = (message: string, options?: Omit<ToastT, "type" | "message">): number | Promise<number> => {
    return toast.warning(message, { ...toastOptions, ...options }) as number | Promise<number>;
  };

  const info = (message: string, options?: Omit<ToastT, "type" | "message">): number | Promise<number> => {
    return toast.info(message, { ...toastOptions, ...options }) as number | Promise<number>;
  };

  const progress = async (message: string, options?: Omit<ToastT, "type" | "message">): Promise<number> => {
    const promise = toast.promise(Promise.resolve(message), {
      loading: message,
      success: () => message,
      error: () => message,
      ...toastOptions,
      ...options,
    });
    return promise as unknown as Promise<number>;
  };

  const dismiss = (id?: number | string | undefined): void => {
    toast.dismiss(id);
  };

  return { show, success, error, warning, info, progress, dismiss };
}

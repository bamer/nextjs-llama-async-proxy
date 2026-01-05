import { toast, type ToastT } from "sonner";

export interface ToastOptions {
  title?: string;
  message?: string;
  type?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  action?: { label: string; onClick: () => void };
}

function getToastOptions(options: ToastOptions): Partial<Omit<ToastT, "type" | "message">> & { description?: string } {
  const result: Partial<Omit<ToastT, "type" | "message">> & { description?: string } = {};
  if (options.message !== undefined) result.description = options.message;
  if (options.duration !== undefined) result.duration = options.duration;
  if (options.action !== undefined) result.action = options.action;
  return result;
}

export function showToast(options: ToastOptions): number | Promise<number> {
  return toast(options.title || "", getToastOptions(options)) as number | Promise<number>;
}

export function showSuccess(title: string, message?: string): number | Promise<number> {
  return toast.success(title, getToastOptions(message ? { message } : {})) as number | Promise<number>;
}

export function showError(
  title: string,
  message?: string,
  action?: ToastOptions["action"]
): number | Promise<number> {
  const opts: ToastOptions = { title };
  if (message) opts.message = message;
  if (action) opts.action = action;
  return toast.error(title, getToastOptions(opts)) as number | Promise<number>;
}

export function showWarning(title: string, message?: string): number | Promise<number> {
  return toast.warning(title, getToastOptions(message ? { message } : {})) as number | Promise<number>;
}

export function showInfo(title: string, message?: string): number | Promise<number> {
  return toast.info(title, getToastOptions(message ? { message } : {})) as number | Promise<number>;
}

export function showProgress(title: string, message?: string): Promise<number> {
  const promise = toast.promise(Promise.resolve(title), {
    loading: message || title,
    success: () => title,
    error: () => title,
    duration: Infinity,
  });
  return promise as unknown as Promise<number>;
}

export function dismissToast(id?: number | string): void {
  toast.dismiss(id);
}

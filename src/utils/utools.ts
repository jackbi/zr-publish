const getServices = (): any => (window as any).services;

export const safeReadFile = (filePath: string) => {
  try {
    return getServices()?.readFile?.(filePath) ?? '';
  } catch (error) {
    return '';
  }
};

export const safeReadDir = (dirPath: string) => {
  try {
    return getServices()?.readDir?.(dirPath) ?? [];
  } catch (error) {
    return [];
  }
};

export const safeIsDir = (filePath: string) => {
  try {
    return !!getServices()?.isDir?.(filePath);
  } catch (error) {
    return false;
  }
};

export const safePublish = async (params: unknown) => {
  try {
    const services = getServices();
    if (!services?.publish) {
      return { ok: false, error: new Error('发布服务不可用（preload 未加载）') } as const;
    }
    const result = services.publish(params);
    if (result instanceof Promise) {
      await result;
    }
    return { ok: true } as const;
  } catch (error) {
    return { ok: false, error } as const;
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('发布超时，请重试')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

const isTimeoutError = (error: unknown) =>
  error instanceof Error && error.message === '发布超时，请重试';

export const safePublishWithRetry = async (
  params: unknown,
  options: { retries?: number; timeoutMs?: number } = {},
) => {
  const { retries = 1, timeoutMs = 120000 } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const services = getServices();
    if (!services?.publish) {
      // 服务不可用时必须报错，不能静默返回成功
      return { ok: false, error: new Error('发布服务不可用（preload 未加载）') } as const;
    }
    try {
      const result = services.publish(params);
      if (result instanceof Promise) {
        try {
          await withTimeout(result, timeoutMs);
        } catch (error) {
          if (isTimeoutError(error)) {
            // 超时只作用于调用方，底层上传仍在继续，native 侧的 publishBusy 也仍然为 true。
            // 这里等它真正结束后再释放锁，避免锁死发布功能，同时避免并发发布。
            Promise.resolve(result)
              .catch(() => {})
              .finally(() => getServices()?.resetPublishState?.());
          }
          throw error;
        }
      }
      return { ok: true, attempt } as const;
    } catch (error) {
      lastError = error;
    }
  }
  return { ok: false, error: lastError } as const;
};

export const safeOpenDialog = (options: Record<string, unknown>) => {
  try {
    return (window as any).utools?.showOpenDialog?.(options) ?? [];
  } catch (error) {
    return [];
  }
};

export const safeSaveDialog = (options: Record<string, unknown>) => {
  try {
    return (window as any).utools?.showSaveDialog?.(options) ?? '';
  } catch (error) {
    return '';
  }
};

export const safeWriteFile = (filePath: string, content: string) => {
  try {
    return getServices()?.writeFile?.(filePath, content) ?? false;
  } catch (error) {
    return false;
  }
};

export const safeShellOpenExternal = (url: string) => {
  try {
    (window as any).utools?.shellOpenExternal?.(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const safeTestConnect = async (params: unknown) => {
  try {
    const result = (window as any).services?.testConnect?.(params);
    if (result instanceof Promise) {
      return await result;
    }
    return result || { success: false, message: '连接失败' };
  } catch (error: any) {
    return {
      success: false,
      message: '连接失败',
      error: error.toString(),
    };
  }
};

export type DbDoc = { _id: string; datas?: string; _rev?: string } & Record<string, unknown>;

export const getDoc = (key: string) => window.utools.db.promises.get(key) as Promise<DbDoc | null>;
export const getDocSync = (key: string) => window.utools.db.get(key) as DbDoc | null;

export const readList = async <T>(key: string): Promise<T[]> => {
  const doc = await getDoc(key);
  if (doc?.datas) {
    return JSON.parse(doc.datas) as T[];
  }
  return [] as T[];
};

export const readSingle = async <T>(key: string): Promise<T | null> => {
  const doc = await getDoc(key);
  if (doc?.datas) {
    return JSON.parse(doc.datas) as T;
  }
  return null;
};

/**
 * 解析 uTools DB 返回的错误对象。
 * put 失败时返回的是普通对象（{ok:false, error:true, name, message}），
 * 直接 throw 会让所有 `catch (e) { e.message }` 拿到 undefined。
 */
const toDbError = (res: unknown) => {
  if (res instanceof Error) return res;
  const message =
    (res as { message?: string } | null)?.message ||
    (res as { name?: string } | null)?.name ||
    '数据库写入失败';
  return new Error(message);
};

export const writeDbList = async <T>(docTemplate: DbDoc, data: T[]): Promise<boolean> => {
  const doc = (getDocSync(docTemplate._id) as DbDoc | null) || docTemplate;
  doc.datas = JSON.stringify(data);
  const res = await window.utools.db.promises.put(doc as DbDoc);
  if (res.ok) {
    doc._rev = res.rev || '';
    return true;
  }
  throw toDbError(res);
};

export const writeSingle = async <T>(docTemplate: DbDoc, data: T): Promise<boolean> => {
  const doc = (getDocSync(docTemplate._id) as DbDoc | null) || docTemplate;
  doc.datas = JSON.stringify(data);
  const res = await window.utools.db.promises.put(doc as DbDoc);
  if (res.ok) {
    doc._rev = res.rev || '';
    return true;
  }
  throw toDbError(res);
};

/**
 * 在多个文档上执行一批写入，任何一步失败就把这些文档恢复到执行前的 datas。
 * 导入备份（覆盖 6 个文档）需要它：否则中途失败会留下「一半新一半旧」的数据。
 */
export const runWithRollback = async (docTemplates: DbDoc[], task: () => Promise<void>) => {
  const ids = docTemplates.map((doc) => doc._id);
  const before = await Promise.all(ids.map((id) => getDoc(id)));

  try {
    await task();
  } catch (error) {
    const failedIds: string[] = [];

    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const previous = before[index];
      try {
        const current = await getDoc(id);
        if (previous) {
          // 重新读取以获得最新 _rev，只把 datas 换回旧值
          if (current) {
            current.datas = previous.datas;
            await window.utools.db.promises.put(current);
          } else {
            await window.utools.db.promises.put(previous);
          }
        } else if (current) {
          // 导入前不存在，回滚即删除（uTools DB 的 remove 需要带 _rev 的文档）
          await window.utools.db.promises.remove(current);
        }
      } catch (rollbackError) {
        failedIds.push(id);
      }
    }

    const reason = error instanceof Error ? error.message : '未知错误';
    throw new Error(
      failedIds.length
        ? `导入失败，且以下数据未能回滚（${failedIds.join('、')}）：${reason}`
        : `导入失败，已回滚到导入前的数据：${reason}`,
    );
  }
};

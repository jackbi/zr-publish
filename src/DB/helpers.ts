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

export const writeDbList = async <T>(docTemplate: DbDoc, data: T[]): Promise<boolean> => {
  const doc = (getDocSync(docTemplate._id) as DbDoc | null) || docTemplate;
  doc.datas = JSON.stringify(data);
  const res = await window.utools.db.promises.put(doc as DbDoc);
  if (res.ok) {
    doc._rev = res.rev || '';
    return true;
  }
  throw res;
};

export const writeSingle = async <T>(docTemplate: DbDoc, data: T): Promise<boolean> => {
  const doc = (getDocSync(docTemplate._id) as DbDoc | null) || docTemplate;
  doc.datas = JSON.stringify(data);
  const res = await window.utools.db.promises.put(doc as DbDoc);
  if (res.ok) {
    doc._rev = res.rev || '';
    return true;
  }
  throw res;
};

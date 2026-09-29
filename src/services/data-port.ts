import { safeEncrypt } from '@/utils/CryptoJS';
import type {
  ProjectItemType,
  sshItemType,
  TaskGroupItemType,
  TaskItemType,
} from '@/types/index.type';

/**
 * 导出格式版本
 * - 1.0：SSH 凭据以明文写入导出文件（历史版本）
 * - 1.1：SSH 凭据沿用本地库中的密文形态，不再解密成明文
 *
 * 说明：密文用的是插件内置密钥，作用是「不让口令被直接看到」，
 * 不构成对拿到插件本体的攻击者的保护。
 */
export const EXPORT_VERSION = '1.1';
export const CREDENTIAL_FORMAT = 'encrypted';

export interface ExportData {
  version: string;
  exportTime: string;
  /** 凭据形态；1.0 的老文件没有这个字段（视作明文） */
  credentialFormat?: 'plaintext' | 'encrypted';
  data: {
    projects: ProjectItemType[];
    ssh: sshItemType[];
    commands: string[];
    remotes: string[];
    tasks: TaskItemType[];
    taskGroups: TaskGroupItemType[];
  };
}

export interface ExportSource {
  projects?: ProjectItemType[];
  ssh?: sshItemType[];
  commands?: string[];
  remotes?: string[];
  tasks?: TaskItemType[];
  taskGroups?: TaskGroupItemType[];
}

/**
 * 组装导出数据。
 * 凭据使用 safeEncrypt：已经是密文的原样保留，历史遗留的明文会被补加密，
 * 因此导出文件里不会再出现明文口令。
 */
export const buildExportData = (source: ExportSource): ExportData => ({
  version: EXPORT_VERSION,
  exportTime: new Date().toISOString(),
  credentialFormat: CREDENTIAL_FORMAT,
  data: {
    projects: source.projects || [],
    ssh: (source.ssh || []).map((item) => ({
      ...item,
      password: safeEncrypt(item.password),
      passphrase: safeEncrypt(item.passphrase),
    })),
    commands: source.commands || [],
    remotes: source.remotes || [],
    tasks: source.tasks || [],
    taskGroups: source.taskGroups || [],
  },
});

/**
 * 解析导入数据，同时兼容 1.0（明文凭据）与 1.1（密文凭据）。
 * safeEncrypt 对密文是幂等的，所以两种格式都能直接入库，无需分支判断。
 */
export const parseImportData = (raw: Partial<ExportData> | null | undefined) => {
  const data = raw?.data;
  if (!data || typeof data !== 'object') {
    throw new Error('文件格式不正确：缺少 data 字段');
  }

  const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  return {
    projects: list<ProjectItemType>(data.projects),
    ssh: list<sshItemType>(data.ssh).map((item) => ({
      ...item,
      password: safeEncrypt(item?.password),
      passphrase: safeEncrypt(item?.passphrase),
    })),
    commands: list<string>(data.commands),
    remotes: list<string>(data.remotes),
    tasks: list<TaskItemType>(data.tasks),
    taskGroups: list<TaskGroupItemType>(data.taskGroups),
  };
};

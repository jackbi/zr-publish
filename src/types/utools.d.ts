declare global {
  interface Window {
    services?: {
      readFile: (filePath: string) => string;
      readDir: (dirPath: string) => string[];
      isDir: (filePath: string) => boolean;
      publish: (params: unknown) => Promise<unknown> | void;
      testConnect: (params: unknown) => Promise<{ success: boolean; message: string; authType?: string; error?: string }>;
      listRemoteDirectory: (serverConfig: {
        host: string;
        port: number;
        username: string;
        password: string;
        auth_type?: string;
        private_key?: string;
        passphrase?: string;
      }, remotePath: string) => Promise<Array<{ name: string; isDirectory: boolean }>>;
      executeRemoteCommand: (serverConfig: {
        host: string;
        port: number;
        username: string;
        password: string;
        auth_type?: string;
        private_key?: string;
        passphrase?: string;
      }, command: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; code?: number; error?: string }>;
      openSSHTerminal: (serverConfig: {
        host: string;
        port: number;
        username: string;
        password: string;
        auth_type?: string;
        private_key?: string;
        passphrase?: string;
      }, terminalType?: string) => { success: boolean; error?: string };
      openInTerminal: (workingDir: string, terminalType?: string) => { success: boolean; error?: string };
      openInFileManager: (filePath: string) => { success: boolean; error?: string };
      openWithVSCode: (filePath: string) => { success: boolean; error?: string };
      openWithIDEA: (filePath: string) => { success: boolean; error?: string };
      detectAvailableTerminals: () => Promise<Array<{
        type: string;
        name: string;
        command: string;
        available: boolean;
      }>>;
      getDefaultTerminal: () => Promise<string>;
      getGitInfo: (projectPath: string) => {
        isGit: boolean;
        branch: string;
        remote: string;
        remoteUrl: string;
        status: 'up-to-date' | 'ahead' | 'behind' | 'diverged' | 'no-remote' | 'not-git' | 'unknown' | 'error';
        ahead: number;
        behind: number;
        hasChanges: boolean;
        error?: string;
      };
      refreshGitStatus: (projectPath: string) => {
        isGit: boolean;
        branch: string;
        remote: string;
        remoteUrl: string;
        status: 'up-to-date' | 'ahead' | 'behind' | 'diverged' | 'no-remote' | 'not-git' | 'unknown' | 'error';
        ahead: number;
        behind: number;
        hasChanges: boolean;
        error?: string;
      };
      getLastCommitInfo: (projectPath: string) => {
        message: string;
        author: string;
        date: string;
        hash: string;
      } | null;
      getUncommittedChanges: (projectPath: string) => {
        count: number;
        files: Array<{ status: string; file: string }>;
      };
      getAllBranches: (projectPath: string) => {
        local: string[];
        remote: string[];
        current: string;
      };
      gitPull: (projectPath: string) => {
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      };
      gitPush: (projectPath: string) => {
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      };
      gitFetch: (projectPath: string) => {
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      };
      switchBranch: (projectPath: string, branchName: string) => {
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      };
    };
    utools?: {
      showOpenDialog: (options: Record<string, unknown>) => string[] | undefined;
      shellOpenExternal: (url: string) => void;
    };
  }
}

export {};

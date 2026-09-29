const { execFileSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// 统一使用 execFile + 参数数组（不经过 shell）。
// git 允许分支名包含反引号、$()、; 等字符，一旦用模板字符串拼接命令，
// 打开一个不可信仓库就可能执行任意本地命令。
const GIT_BASE_OPTIONS = {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
  windowsHide: true,
};

const runGit = (args, projectPath, options = {}) =>
  execFileSync('git', args, { ...GIT_BASE_OPTIONS, ...options, cwd: projectPath }).trim();

const isGitRepository = (projectPath) => {
  try {
    const gitPath = path.join(projectPath, '.git');
    return existsSync(gitPath);
  } catch (error) {
    return false;
  }
};

const getGitInfo = (projectPath) => {
  if (!isGitRepository(projectPath)) {
    return {
      isGit: false,
      branch: '',
      remote: '',
      remoteUrl: '',
      status: 'not-git',
      ahead: 0,
      behind: 0,
      hasChanges: false,
    };
  }

  try {
    const currentBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], projectPath);

    let remoteName = '';
    let remoteUrl = '';
    try {
      remoteName = runGit(['config', `branch.${currentBranch}.remote`], projectPath);

      if (remoteName) {
        remoteUrl = runGit(['config', `remote.${remoteName}.url`], projectPath);
      }
    } catch (error) {
      remoteName = '';
      remoteUrl = '';
    }

    let ahead = 0;
    let behind = 0;
    let status = 'unknown';

    if (remoteName) {
      try {
        runGit(['fetch', '--quiet'], projectPath, { timeout: 5000 });

        const revList = runGit(
          [
            'rev-list',
            '--left-right',
            '--count',
            `${currentBranch}...${remoteName}/${currentBranch}`,
          ],
          projectPath,
        );

        const [aheadCount, behindCount] = revList.split(/\s+/).map(Number);
        ahead = aheadCount || 0;
        behind = behindCount || 0;

        if (ahead === 0 && behind === 0) {
          status = 'up-to-date';
        } else if (ahead > 0 && behind === 0) {
          status = 'ahead';
        } else if (ahead === 0 && behind > 0) {
          status = 'behind';
        } else {
          status = 'diverged';
        }
      } catch (error) {
        status = 'unknown';
      }
    } else {
      status = 'no-remote';
    }

    let hasChanges = false;
    try {
      const statusOutput = runGit(['status', '--porcelain'], projectPath);
      hasChanges = statusOutput.length > 0;
    } catch (error) {
      hasChanges = false;
    }

    return {
      isGit: true,
      branch: currentBranch,
      remote: remoteName,
      remoteUrl: remoteUrl,
      status: status,
      ahead: ahead,
      behind: behind,
      hasChanges: hasChanges,
    };
  } catch (error) {
    return {
      isGit: true,
      branch: '',
      remote: '',
      remoteUrl: '',
      status: 'error',
      ahead: 0,
      behind: 0,
      hasChanges: false,
      error: error.message,
    };
  }
};

const refreshGitStatus = (projectPath) => {
  return getGitInfo(projectPath);
};

const getLastCommitInfo = (projectPath) => {
  if (!isGitRepository(projectPath)) {
    return null;
  }

  try {
    const message = runGit(['log', '-1', '--pretty=%s'], projectPath);
    const author = runGit(['log', '-1', '--pretty=%an'], projectPath);
    const date = runGit(['log', '-1', '--pretty=%ar'], projectPath);
    const hash = runGit(['log', '-1', '--pretty=%h'], projectPath);

    return {
      message,
      author,
      date,
      hash,
    };
  } catch (error) {
    return null;
  }
};

const getUncommittedChanges = (projectPath) => {
  if (!isGitRepository(projectPath)) {
    return { count: 0, files: [] };
  }

  try {
    const statusOutput = runGit(['status', '--porcelain'], projectPath);

    if (!statusOutput) {
      return { count: 0, files: [] };
    }

    const files = statusOutput.split('\n').map((line) => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      return { status, file };
    });

    return {
      count: files.length,
      files,
    };
  } catch (error) {
    return { count: 0, files: [] };
  }
};

/*
 * 只导出渲染端实际使用的能力。
 * 原来的 getAllBranches / executeGitCommand / gitPull / gitPush / gitFetch / switchBranch
 * 渲染端从未调用，却等于把「任意 git 命令」暴露给页面，已删除（需要时再按需加回）。
 */
module.exports = {
  getGitInfo,
  refreshGitStatus,
  getLastCommitInfo,
  getUncommittedChanges,
};

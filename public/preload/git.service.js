const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

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
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

    let remoteName = '';
    let remoteUrl = '';
    try {
      remoteName = execSync(`git config branch.${currentBranch}.remote`, {
        cwd: projectPath,
        encoding: 'utf8',
      }).trim();
      
      if (remoteName) {
        remoteUrl = execSync(`git config remote.${remoteName}.url`, {
          cwd: projectPath,
          encoding: 'utf8',
        }).trim();
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
        execSync('git fetch --quiet', {
          cwd: projectPath,
          encoding: 'utf8',
          timeout: 5000,
        });

        const revList = execSync(
          `git rev-list --left-right --count ${currentBranch}...${remoteName}/${currentBranch}`,
          {
            cwd: projectPath,
            encoding: 'utf8',
          },
        ).trim();

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
      const statusOutput = execSync('git status --porcelain', {
        cwd: projectPath,
        encoding: 'utf8',
      }).trim();
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
    const message = execSync('git log -1 --pretty=%s', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

    const author = execSync('git log -1 --pretty=%an', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

    const date = execSync('git log -1 --pretty=%ar', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

    const hash = execSync('git log -1 --pretty=%h', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

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
    const statusOutput = execSync('git status --porcelain', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

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

const getAllBranches = (projectPath) => {
  if (!isGitRepository(projectPath)) {
    return { local: [], remote: [], current: '' };
  }

  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

    const localBranchesOutput = execSync('git branch', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim();

    const localBranches = localBranchesOutput
      .split('\n')
      .map((line) => line.replace(/^\*?\s+/, '').trim())
      .filter(Boolean);

    let remoteBranches = [];
    try {
      const remoteBranchesOutput = execSync('git branch -r', {
        cwd: projectPath,
        encoding: 'utf8',
      }).trim();

      remoteBranches = remoteBranchesOutput
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => !line.includes('->'))
        .filter(Boolean);
    } catch (error) {
      remoteBranches = [];
    }

    return {
      local: localBranches,
      remote: remoteBranches,
      current: currentBranch,
    };
  } catch (error) {
    return { local: [], remote: [], current: '' };
  }
};

const executeGitCommand = (projectPath, command) => {
  if (!isGitRepository(projectPath)) {
    return {
      success: false,
      error: 'Not a git repository',
    };
  }

  try {
    const output = execSync(`git ${command}`, {
      cwd: projectPath,
      encoding: 'utf8',
      timeout: 30000,
    });

    return {
      success: true,
      output: output.trim(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr ? error.stderr.toString() : '',
    };
  }
};

const gitPull = (projectPath) => {
  return executeGitCommand(projectPath, 'pull');
};

const gitPush = (projectPath) => {
  return executeGitCommand(projectPath, 'push');
};

const gitFetch = (projectPath) => {
  return executeGitCommand(projectPath, 'fetch');
};

const switchBranch = (projectPath, branchName) => {
  return executeGitCommand(projectPath, `checkout ${branchName}`);
};

module.exports = {
  isGitRepository,
  getGitInfo,
  refreshGitStatus,
  getLastCommitInfo,
  getUncommittedChanges,
  getAllBranches,
  executeGitCommand,
  gitPull,
  gitPush,
  gitFetch,
  switchBranch,
};

interface GitTask {
  id: string;
  projectPath: string;
  type: 'full' | 'refresh' | 'uncommitted' | 'lastCommit';
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class GitWorkerQueue {
  private queue: GitTask[] = [];
  private maxConcurrent = 3;
  private activeCount = 0;

  async addTask(projectPath: string, type: GitTask['type'] = 'full'): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: GitTask = {
        id: `${Date.now()}-${Math.random()}`,
        projectPath,
        type,
        resolve,
        reject,
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      return;
    }

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const task = this.queue.shift();
      if (task) {
        this.activeCount++;
        this.processTask(task).finally(() => {
          this.activeCount--;
          this.processQueue();
        });
      }
    }
  }

  private async processTask(task: GitTask) {
    try {
      await new Promise(resolve => setTimeout(resolve, 0));

      let result: any;
      switch (task.type) {
        case 'full':
          result = await this.getFullGitInfo(task.projectPath);
          break;
        case 'refresh':
          result = window.services?.refreshGitStatus(task.projectPath);
          break;
        case 'uncommitted':
          result = window.services?.getUncommittedChanges(task.projectPath);
          break;
        case 'lastCommit':
          result = window.services?.getLastCommitInfo(task.projectPath);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.resolve(result);
    } catch (error) {
      task.reject(error);
    }
  }

  private async getFullGitInfo(projectPath: string): Promise<any> {
    const gitInfo = window.services?.getGitInfo(projectPath);
    
    if (!gitInfo || !gitInfo.isGit) {
      return {
        git_info: gitInfo,
        uncommitted_count: 0,
        last_commit_info: '',
      };
    }

    let uncommittedCount = 0;
    let lastCommitInfo = '';

    if (window.services?.getUncommittedChanges) {
      const changes = window.services.getUncommittedChanges(projectPath);
      uncommittedCount = changes.count;
    }

    if (window.services?.getLastCommitInfo) {
      const commitInfo = window.services.getLastCommitInfo(projectPath);
      if (commitInfo) {
        lastCommitInfo = `${commitInfo.hash} - ${commitInfo.message}\n${commitInfo.author} · ${commitInfo.date}`;
      }
    }

    return {
      git_info: gitInfo,
      uncommitted_count: uncommittedCount,
      last_commit_info: lastCommitInfo,
    };
  }

  clear() {
    this.queue = [];
    this.activeCount = 0;
  }

  getQueueSize() {
    return this.queue.length;
  }

  isProcessing() {
    return this.activeCount > 0 || this.queue.length > 0;
  }
}

export const gitWorkerQueue = new GitWorkerQueue();

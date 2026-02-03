import { ProjectType } from '@/types/index.type';
import { safeReadDir, safeReadFile } from './utools';

export function detectProjectType(projectPath: string): ProjectType {
  const files = safeReadDir(projectPath);
  
  if (!files || files.length === 0) {
    return 'unknown';
  }
  
  if (files.includes('pom.xml') || files.includes('build.gradle')) {
    return 'java';
  }
  
  if (files.includes('go.mod')) {
    return 'go';
  }
  
  if (files.includes('requirements.txt') || files.includes('setup.py') || files.includes('pyproject.toml')) {
    return 'python';
  }
  
  if (files.includes('package.json')) {
    const packageJsonData = safeReadFile(`${projectPath}/package.json`);
    if (packageJsonData) {
      try {
        const packageJson = JSON.parse(packageJsonData);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (dependencies['vue'] || dependencies['@vue/cli-service'] || dependencies['vite'] && files.includes('vite.config.ts')) {
          return 'vue';
        }
        
        if (dependencies['react'] || dependencies['react-dom'] || dependencies['next']) {
          return 'react';
        }
        
        return 'node';
      } catch {
        return 'node';
      }
    }
    return 'node';
  }
  
  return 'unknown';
}

export function getProjectTypeLabel(type?: ProjectType): string {
  const labels: Record<ProjectType, string> = {
    vue: 'Vue',
    react: 'React',
    node: 'Node.js',
    java: 'Java',
    python: 'Python',
    go: 'Go',
    unknown: '未知',
  };
  return labels[type || 'unknown'];
}

export function getProjectTypeColor(type?: ProjectType): string {
  const colors: Record<ProjectType, string> = {
    vue: '#42b883',
    react: '#61dafb',
    node: '#68a063',
    java: '#f89820',
    python: '#3776ab',
    go: '#00add8',
    unknown: '#909399',
  };
  return colors[type || 'unknown'];
}

export function openWithEditor(projectPath: string, editor: 'vscode' | 'idea' | 'finder') {
  const services = (window as any).services;
  
  if (editor === 'vscode') {
    const result = services?.openWithVSCode?.(projectPath);
    if (!result || !result.success) {
      console.error('Failed to open with VS Code:', result?.error);
    }
  } else if (editor === 'idea') {
    const result = services?.openWithIDEA?.(projectPath);
    if (!result || !result.success) {
      console.error('Failed to open with IDEA:', result?.error);
    }
  } else if (editor === 'finder') {
    const result = services?.openInFileManager?.(projectPath);
    if (!result || !result.success) {
      console.error('Failed to open in file manager:', result?.error);
    }
  }
}

/*
 * @Description: Settings types
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-21 10:00:00
 * @FilePath: /zr-publish/src/types/settings.type.ts
 */

export type TerminalType = 
  | 'Tabby'           // Cross-platform Tabby
  | 'Terminal'        // macOS Terminal
  | 'iTerm'           // macOS iTerm2
  | 'Warp'            // macOS Warp
  | 'cmd'             // Windows Command Prompt
  | 'powershell'      // Windows PowerShell
  | 'WindowsTerminal' // Windows Terminal
  | 'gnome-terminal'  // Linux GNOME Terminal
  | 'konsole'         // Linux KDE Konsole
  | 'xterm';          // Linux xterm

export interface TerminalInfo {
  type: TerminalType;
  name: string;
  command: string;
  available: boolean;
  icon?: string;
}

export interface SettingsItemType {
  id: string;
  default_terminal?: TerminalType;
  terminal_custom_command?: string;
  git_auto_refresh_enabled?: boolean;
  git_auto_refresh_interval?: number;
}

export interface SettingsItemTypeNoId extends Omit<SettingsItemType, 'id'> {
  id?: string;
}

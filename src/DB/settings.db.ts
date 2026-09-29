/*
 * @Description: 设置管理
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2026-02-03 12:00:00
 * @LastEditors: wenbin
 * @LastEditTime: 2026-02-03 12:00:00
 * @FilePath: /zr-publish/src/DB/settings.db.ts
 * Copyright (c) 2026 wenbin
 */
import { SettingsItemType } from '@/types/index.type';
import { readSingle, writeSingle, DbDoc } from './helpers';

export const settingsDoc: DbDoc = {
  _id: 'zr-publish/settings',
  datas: '',
};

/**
 * @description: 获取设置
 * @return {*}
 */
export const getSettings = async (): Promise<SettingsItemType> => {
  const settings = await readSingle<SettingsItemType>('zr-publish/settings');
  if (!settings) {
    // 返回默认设置
    const defaultSettings: SettingsItemType = {
      id: 'default',
      default_terminal: undefined,
      terminal_custom_command: '',
      collapsed_groups: [],
    };
    await writeSingle(settingsDoc, defaultSettings);
    return defaultSettings;
  }
  return settings;
};

/**
 * @description: 更新设置
 * @param {Partial<SettingsItemType>} settings
 * @return {*}
 */
export const updateSettings = async (
  settings: Partial<SettingsItemType>,
): Promise<SettingsItemType> => {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await writeSingle(settingsDoc, updated);
  return updated;
};

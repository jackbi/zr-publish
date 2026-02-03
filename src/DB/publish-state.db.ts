import { readSingle, writeSingle } from './helpers';
import type { PublishState, PublishStatusSummary, PublishQueueItem } from '@/types/publish.type';

const publishStateDoc = {
  _id: 'zr-publish/publish-state',
  datas: '',
};

export const getPublishState = async (): Promise<PublishState> => {
  const state = await readSingle<PublishState>(publishStateDoc._id);
  if (state) return state;
  return {
    version: 1,
    queue: [],
    byTask: {},
  };
};

export const savePublishState = async (state: PublishState) => {
  await writeSingle(publishStateDoc, state);
  return true;
};

export const upsertPublishStatus = async (summary: PublishStatusSummary) => {
  const state = await getPublishState();
  state.byTask[summary.taskId] = summary;
  await savePublishState(state);
  return state;
};

export const enqueuePublish = async (item: PublishQueueItem) => {
  const state = await getPublishState();
  state.queue.push(item);
  await savePublishState(state);
  return state;
};

export const dequeuePublish = async () => {
  const state = await getPublishState();
  const next = state.queue.shift();
  await savePublishState(state);
  return { state, next };
};

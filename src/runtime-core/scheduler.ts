// 维护一个任务队列
const queue: any[] = [];
// 微任务是否在pending状态,防止创建多个微任务
let isFlushPending = false;

const p = Promise.resolve();

export const nextTick = (fn) => {
  return fn ? p.then(fn) : p;
};

export const queueJobs = (job) => {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
};

const queueFlush = () => {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
};

const flushJobs = () => {
  isFlushPending = false;
  let job;
  // 将所有任务队列执行
  while ((job = queue.shift())) {
    job && job();
  }
};

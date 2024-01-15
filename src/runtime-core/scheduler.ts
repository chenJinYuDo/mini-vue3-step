const queue: any[] = [];
let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  if (isFlushPending) return;
  isFlushPending = true;

  //   Promise.resolve().then(() => {
  //     isFlushPending = false;
  //     // 执行队列中的任务
  //     let job;
  //     while ((job = queue.shift())) {
  //       job && job();
  //     }
  nextTicker(() => {
    isFlushPending = false;
    // 执行队列中的任务
    let job;
    while ((job = queue.shift())) {
      job && job();
    }
  });
}

export function nextTicker(fn?) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

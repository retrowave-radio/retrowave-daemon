export function promisifyCb(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...results) => {
        if (err) return reject(err);
        resolve(...results);
      });
    });
  };
}

export function promisifyStream(stream) {
  return new Promise((resolve, reject) => {
    stream.on('close', resolve);
    stream.on('error', reject);
  });
}


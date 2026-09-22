/*HDBG:__HDBG_SESSION__:B*/
const http = require('http');

const endpoint = process.env.HDBG_ENDPOINT || '__HDBG_ENDPOINT__';
const session = process.env.HDBG_SESSION || '__HDBG_SESSION__';
const runtime = process.env.HDBG_RUNTIME || '__HDBG_RUNTIME__';

function __hdbg(event, data) {
  return new Promise((resolve) => {
    try {
      const target = new URL(`${endpoint.replace(/\/$/, '')}/log`);
      target.searchParams.set('s', session);
      target.searchParams.set('r', runtime);
      target.searchParams.set('e', String(event));
      const body = JSON.stringify({ data: data === undefined ? null : data });
      const request = http.request(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 250,
      }, (response) => {
        response.resume();
        response.on('end', () => resolve(undefined));
      });
      request.on('timeout', () => request.destroy());
      request.on('error', () => resolve(undefined));
      request.end(body);
    } catch {
      resolve(undefined);
    }
  });
}

module.exports = __hdbg;
/*HDBG:__HDBG_SESSION__:E*/

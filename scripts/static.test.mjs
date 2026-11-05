import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

// 对构建产物检查真实路径，防止静态部署后才发现资源丢失。
const output = resolve('dist');
for (const route of ['index.html', 'knowweft/index.html', 'tessera/index.html']) {
  test(`${route} 可独立访问且本地资源完整`, async () => {
    const html = await readFile(resolve(output, route), 'utf8');
    assert.match(html, /<html[^>]*lang="zh-CN"/);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, /<meta[^>]*name="description"/);
    for (const [, url] of html.matchAll(/(?:src|href|content)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
      const relative = url.endsWith('/') ? `${url}index.html` : url;
      await assert.doesNotReject(access(resolve(output, `.${relative}`)), `资源不存在：${url}`);
    }
    for (const [, hash] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${hash}"`), `锚点不存在：${hash}`);
    }
  });
}

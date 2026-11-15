# 自动化测试与 CI

## 现在有什么（已跑通）

```bash
npm test                # 跑全部用例
npm run test:security   # 安全回归：沙箱隔离 + XSS 转义
npm run test:smoke      # 冒烟：起服务 → 打开体验版 → 示例渲染出 canvas
npm run check-demos     # 静态检查：示例游戏完整性 + 内联脚本语法
```

| 用例文件 | 覆盖什么 | 依赖 |
| --- | --- | --- |
| `test/security.test.js` | ① 生成代码在预览 iframe 里读不到父页面 `localStorage`（登录 token），并带一个「旧写法」对照组，保证测试能抓到回归；② `escapeHtml` 把标签和引号转义，塞进 DOM 也不会生成元素 | 本地 Edge/Chrome（或 `npx playwright install chromium`） |
| `test/smoke.test.js` | 起真实服务 → `/api/health`、`/api/demo/health` → 体验版画廊加载 → 点开示例后 iframe 内有 canvas、无未捕获异常 | 同上 |
| `scripts/check-demos.js` | `web/demos/*` 每个文件以 `</html>` 结尾、每段内联脚本能过 `vm.Script` 语法解析 | 无 |

用例数：3 组（安全 2 条 + 冒烟 1 条），本机跑完约 5 秒；不需要 DeepSeek Key、不需要数据库。

## CI 现状：**还没接**

原因很具体：这台机器上配置的 GitHub token 只有 `repo` 权限，没有 `workflow` 权限，推送
`.github/workflows/*` 会被 GitHub 拒绝（`refusing to allow a Personal Access Token to create or update
workflow ... without workflow scope`）。所以目前是本地执行，没有接 GitHub Actions。

补上也很快，两种方式二选一：

1. 在 GitHub 网页上手动新建 `.github/workflows/ci.yml`，粘贴下面这份；
2. 给 token 补 `workflow` 权限（或换一个有该权限的 PAT），我直接在本地提交推送。

```yaml
name: test

on:
  push:
    branches: [master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run check-demos
      - run: npm test
```

> 说明：`test/helpers/browser.js` 会依次尝试系统 Edge → 系统 Chrome → Playwright 自带 Chromium，
> 所以 CI 上装了 Chromium 就能直接跑，本地装了 Edge 也不需要额外下载浏览器。

## 还没做的部分（如实列）

- 没有单元测试框架（用 Node 内置 `node --test`，够用但断言/报告比较朴素）
- 没有覆盖率统计
- 没有对接真实 DeepSeek 的端到端测试（要花钱、不可重复，只在发版前手工跑一次生成）
- 没有视觉回归（截图对比）

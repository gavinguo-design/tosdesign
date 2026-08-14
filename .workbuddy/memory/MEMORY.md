# 项目长期约定

## GitHub 推送规则（gavinguo-design/tosdesign）
- **本任务所有提交只能在独立分支上推送**（当前分支：`手机首页布局`）。
- **绝不改动/覆盖远程 main 及其他原有分支的任何内容**。
- 本地 `main` 为孤儿分支（与远程 main 无共同祖先），**禁止推送**。
- 保护机制：`.git/hooks/pre-push` hook 会拦截任何推送 main 到远程的操作（含 force push）。
- 合入 main 如需发生，须用户明确确认后走 GitHub Squash merge，且不得影响远程 main 历史。

## 其他约定
- 用户 GitHub：zsan31637-pixel；仓库 gavinguo-design/tosdesign（公开）。
- 推送认证：本机无 gh CLI / 无持久凭据，需用 `https://x-access-token:<token>@github.com/...` 临时 URL，推送后立即恢复干净 remote。

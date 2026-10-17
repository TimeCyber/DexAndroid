# Agent skills (multi-client)

Canonical skill files live under `skills/<name>/SKILL.md`.

Synced copies for each agent client:

| Client | Path |
| --- | --- |
| Cursor | `.cursor/skills/<name>/SKILL.md` |
| Codex | `.agents/skills/<name>/SKILL.md` |
| Claude Code | `.claude/skills/<name>/SKILL.md` |

Edit the canonical file, then sync:

```bash
node tools/sync-skills.mjs
```

### Current skills

| Skill | When to use |
| --- | --- |
| [`android-api-smali-analysis`](./android-api-smali-analysis/SKILL.md) | Full API / headers / crypto / key recovery after unpack |
| [`smali-network-image-splash`](./smali-network-image-splash/SKILL.md) | Smali 全屏网络图开屏 + 点击打开链接 + N 秒后非全屏回首页 |

### Invoke tips

- **Cursor:** skill auto-attaches when `description` matches; or open the SKILL.md path.
- **Codex:** discovered from `.agents/skills`; agent loads full body when selected.
- **Claude Code:** auto when relevant, or `/android-api-smali-analysis` / `/smali-network-image-splash`.

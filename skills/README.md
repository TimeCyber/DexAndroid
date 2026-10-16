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

### Invoke tips

- **Cursor:** skill auto-attaches when `description` matches; or open the SKILL.md path.
- **Codex:** discovered from `.agents/skills`; agent loads full body when selected.
- **Claude Code:** auto when relevant, or `/android-api-smali-analysis`.

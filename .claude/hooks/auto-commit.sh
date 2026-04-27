#!/usr/bin/env bash
PROJECT_DIR=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$PROJECT_DIR" ]; then
  echo '{"hookEventName":"Stop","error":"auto-commit: not inside a git repository"}'
  exit 1
fi

cd "$PROJECT_DIR" || exit 1

# Nothing to commit — skip silently
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

git add -A

FILE_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
CHANGED_FILES=$(git diff --cached --name-only | head -20)

BODY=""
while IFS= read -r f; do
  BODY="${BODY}  - ${f}"$'\n'
done <<< "$CHANGED_FILES"

COMMIT_OUTPUT=$(git commit -m "$(printf 'Auto-commit: %s file(s) changed\n\n%s\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>' "$FILE_COUNT" "$BODY")" 2>&1)
if [ $? -ne 0 ]; then
  echo "{\"hookEventName\":\"Stop\",\"error\":\"auto-commit failed: $COMMIT_OUTPUT\"}"
  exit 1
fi

# Check for a configured remote before attempting push
REMOTE=$(git remote 2>/dev/null | head -1)
if [ -z "$REMOTE" ]; then
  echo '{"hookEventName":"Stop","error":"auto-push skipped: no git remote configured. Run: gh repo create <name> --private --source=. --remote=origin --push"}'
  exit 0
fi

# Check the current branch has an upstream tracking branch
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  PUSH_OUTPUT=$(git push --set-upstream "$REMOTE" "$BRANCH" 2>&1)
else
  PUSH_OUTPUT=$(git push 2>&1)
fi

if [ $? -ne 0 ]; then
  echo "{\"hookEventName\":\"Stop\",\"error\":\"auto-push failed: $PUSH_OUTPUT\"}"
  exit 1
fi

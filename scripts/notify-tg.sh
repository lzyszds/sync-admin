#!/usr/bin/env bash
# ==========================================================================
# Telegram 通知脚本
#
# 用法：
#   TG_BOT_TOKEN=xxx TG_CHAT_ID=yyy ./scripts/notify-tg.sh "标题" "正文"
#   ./scripts/notify-tg.sh "标题" "正文"          # 自动读取同目录 .env
#
# 退出码：
#   0 发送成功
#   1 发送失败（网络 / 参数 / token 无效）
#   2 缺少必要配置（TG_BOT_TOKEN / TG_CHAT_ID）
# ==========================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 可选：从 scripts/.env 读取（该文件已被 .gitignore 忽略）
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
  # shellcheck disable=SC1091
  set -a && source "${SCRIPT_DIR}/.env" && set +a
fi

TOKEN="${TG_BOT_TOKEN:-}"
CHAT_ID="${TG_CHAT_ID:-}"
TITLE="${1:-云控后台通知}"
BODY="${2:-}"

if [[ -z "${TOKEN}" || -z "${CHAT_ID}" ]]; then
  echo "[notify-tg] 缺少 TG_BOT_TOKEN / TG_CHAT_ID，已跳过发送。" >&2
  exit 2
fi

TEXT="${TITLE}"
if [[ -n "${BODY}" ]]; then
  TEXT="${TITLE}"$'\n'"${BODY}"
fi

RESP="$(curl -sS --max-time 20 -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "text=${TEXT}" \
  --data-urlencode "disable_web_page_preview=true" 2>&1)"

if printf '%s' "${RESP}" | grep -q '"ok":true'; then
  echo "[notify-tg] 发送成功 → chat ${CHAT_ID}"
  exit 0
fi

echo "[notify-tg] 发送失败：${RESP}" >&2
exit 1

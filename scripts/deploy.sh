#!/usr/bin/env bash
# ==========================================================================
# 云控后台 · 静态产物发布脚本
#
# 用法：
#   DEPLOY_HOST=user@server DEPLOY_PATH=/data/sync/console ./scripts/deploy.sh
#
# 环境变量：
#   DEPLOY_HOST        必填  形如 root@192.168.1.10 或 root@sync.lzyszds.cn
#   DEPLOY_PATH        必填  服务器上存放 /console/ 静态文件的目录（绝对路径）
#   DEPLOY_PORT        可选  SSH 端口，默认 22
#   DEPLOY_SSH_KEY     可选  私钥路径，默认 ~/.ssh/id_ed25519
#   DEPLOY_KNOWN_HOSTS 可选  known_hosts 路径，默认 ~/.ssh/known_hosts
#   DEPLOY_EXCLUDE     可选  额外排除的文件/目录模式（空格分隔），如 "downloads"
#   DEPLOY_CHOWN       可选  同步后把目标目录归属改为该属主，如 "www:www"
#   DEPLOY_HEALTH_URL  可选  发布后健康检查地址，如 https://sync.lzyszds.cn/console/
#   DRY_RUN            可选  设为 1 时只打印将要同步的文件，不真正上传
#
# 退出码：
#   0 发布成功
#   1 发布失败
#   2 参数缺失 / 路径不安全
# ==========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"

HOST="${DEPLOY_HOST:-}"
TARGET="${DEPLOY_PATH:-}"
PORT="${DEPLOY_PORT:-22}"
SSH_KEY="${DEPLOY_SSH_KEY:-${HOME}/.ssh/id_ed25519}"
KNOWN_HOSTS="${DEPLOY_KNOWN_HOSTS:-${HOME}/.ssh/known_hosts}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-}"
DRY_RUN="${DRY_RUN:-0}"

fail() { echo "[deploy] $*" >&2; exit 2; }

# --- 依赖检查 -------------------------------------------------------------
command -v rsync >/dev/null 2>&1 || fail "未找到 rsync，请先安装（Debian/Ubuntu: apt install rsync）"
command -v ssh   >/dev/null 2>&1 || fail "未找到 ssh，请确认 OpenSSH 客户端已安装"

# --- 参数校验 -------------------------------------------------------------
[ -n "${HOST}" ]  || fail "缺少 DEPLOY_HOST（例如 root@server）"
[ -n "${TARGET}" ] || fail "缺少 DEPLOY_PATH（例如 /data/sync/console）"

# rsync --delete 会删除目标目录下多余的���件，路径写错后果严重，这里做硬性拦截
case "${TARGET}" in
  /|/bin|/boot|/etc|/home|/root|/usr|/var|/srv|/lib|/opt|"" )
    fail "DEPLOY_PATH='${TARGET}' 过于危险，已拒绝执行。" ;;
esac
if [ "${#TARGET}" -lt 4 ]; then
  fail "DEPLOY_PATH='${TARGET}' 过短，已拒绝执行。"
fi

# --- 构建产物校验 ---------------------------------------------------------
if [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "[deploy] 未找到 dist/index.html，请先执行 npm run build" >&2
  exit 1
fi

ASSET_COUNT="$(find "${DIST_DIR}" -type f | wc -l | tr -d ' ')"
echo "[deploy] 源目录 : ${DIST_DIR}（${ASSET_COUNT} 个文件）"
echo "[deploy] 目标   : ${HOST}:${TARGET}"

# --- 组装 rsync 参数 ------------------------------------------------------
SSH_OPTS=(
  -p "${PORT}"
  -i "${SSH_KEY}"
  -o "UserKnownHostsFile=${KNOWN_HOSTS}"
  -o "StrictHostKeyChecking=accept-new"
  -o "ConnectTimeout=15"
)

RSYNC_OPTS=(
  -az                       # 压缩 + 递归
  --delete                  # 删除目标目录中已不存在于源目录的旧文件
  --delay-updates           # 全部传完后统一改名，避免更新过程中出现半新半旧的页面
  --human-readable
  --stats
  --exclude=".DS_Store"
  --exclude="Thumbs.db"
)

# 额外排除项（如目标目录里存放的非构建产物目录）。
# 注意：这里不要加 --delete-excluded，否则被排除的文件也会被删除。
if [ -n "${DEPLOY_EXCLUDE:-}" ]; then
  for pattern in ${DEPLOY_EXCLUDE}; do
    RSYNC_OPTS+=("--exclude=${pattern}")
  done
  echo "[deploy] 额外排除：${DEPLOY_EXCLUDE}"
fi

if [ "${DRY_RUN}" = "1" ]; then
  echo "[deploy] DRY_RUN=1，仅预览不上传"
  RSYNC_OPTS+=(--dry-run --itemize-changes)
fi

# --- 执行同步 -------------------------------------------------------------
echo "[deploy] 开始同步..."
rsync "${RSYNC_OPTS[@]}" -e "ssh ${SSH_OPTS[*]}" \
  "${DIST_DIR}/" "${HOST}:${TARGET}/"
echo "[deploy] 同步完成"

# --- 修正属主 -------------------------------------------------------------
# nginx worker 通常以 www 等非 root 用户运行，同步后把属主改回来
if [ -n "${DEPLOY_CHOWN:-}" ] && [ "${DRY_RUN}" != "1" ]; then
  echo "[deploy] 设置属主为 ${DEPLOY_CHOWN} ..."
  # 注意：这里必须用数组展开 "${SSH_OPTS[@]}"，
  # 若写成 "${SSH_OPTS[*]}" 会被拼成单个参数，ssh 会报 "Bad port"
  if ! ssh "${SSH_OPTS[@]}" "${HOST}" "chown -R ${DEPLOY_CHOWN} '${TARGET}'"; then
    echo "[deploy] 设置属主失败（不影响文件内容，忽略）" >&2
  fi
fi

# --- 健康检查 -------------------------------------------------------------
# 用新产物里的 hash 文件名去请求线上，确认真正生效（而不是命中旧缓存或 SPA 回退）
if [ -n "${HEALTH_URL}" ] && [ "${DRY_RUN}" != "1" ]; then
  # HEALTH_URL 形如 https://host/console/ ；JS_PATH 已含 /console/assets/... 前缀，
  # 因此这里取域名根再拼完整路径，避免出现 /console/console/ 这样的重复路径。
  ORIGIN="$(printf '%s' "${HEALTH_URL%/}" | sed -E 's#^(https?://[^/]+).*#\1#')"
  JS_PATH="$(grep -o '/console/assets/index-[A-Za-z0-9_-]*\.js' "${DIST_DIR}/index.html" | head -n 1 || true)"
  if [ -z "${JS_PATH}" ]; then
    echo "[deploy] 未在 index.html 中找到构建产物 JS 路径，跳过资源校验" >&2
  else
    URL="${ORIGIN}${JS_PATH}"
    # 同时记录状态码与 Content-Type：SPA 回退会把未命中的路径也返回 200 + HTML，
    # 只看状态码会把「资源没传上去」误判成成功。
    HTTP_INFO="$(curl -sS -o /dev/null -w '%{http_code} %{content_type}' --max-time 20 "${URL}" || echo '000 ')"
    CODE="$(echo "${HTTP_INFO}" | awk '{print $1}')"
    CTYPE="$(echo "${HTTP_INFO}" | awk '{print $2}')"
    if [ "${CODE}" != "200" ]; then
      echo "[deploy] 健康检查失败：${URL} 返回 ${CODE}" >&2
      exit 1
    fi
    case "${CTYPE}" in
      *javascript*|*ecmascript*)
        echo "[deploy] 健康检查通过：${JS_PATH} → 200 ${CTYPE}" ;;
      *)
        echo "[deploy] 健康检查失败：${URL} 返回 200 但类型是 ${CTYPE}（疑似 SPA 回退，资源未生效）" >&2
        exit 1 ;;
    esac
  fi
fi

echo "[deploy] ✅ 发布完成"

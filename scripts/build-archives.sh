#!/usr/bin/env bash
#
# Сборка версионированных архивов проекта.
#
# Использование:
#   ./scripts/build-archives.sh                  # авто-определение версии из CHANGELOG.md
#   ./scripts/build-archives.sh 1.3.0            # явная версия
#   ./scripts/build-archives.sh 1.3.0 quiet      # без вывода
#
# Создаёт:
#   download/maestro7it-chatbot-v1.3.0.tar.gz
#   download/maestro7it-chatbot-v1.3.0.zip
#   download/maestro7it-chatbot-v1.3.0.sha256    (контрольные суммы)
#
# Исключает:
#   - node_modules, .next, .git, .zscripts, skills
#   - dev.log, server.log, research/, download/, mini-services/
#   - .claude, .z-ai-config
#   - .env (секретный! только .env.example попадает в архив)
#

set -euo pipefail

# --- Определение версии ---
VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  # Авто-определение из CHANGELOG.md: первая строка "## [vX.Y.Z]"
  if [ -f "CHANGELOG.md" ]; then
    VERSION=$(grep -oE '## \[v?[0-9]+\.[0-9]+\.[0-9]+\]' CHANGELOG.md | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  fi
fi

if [ -z "$VERSION" ]; then
  echo "❌ Не удалось определить версию. Укажите явно: ./scripts/build-archives.sh 1.3.0"
  exit 1
fi

QUIET="${2:-}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

TAR_NAME="maestro7it-chatbot-v${VERSION}.tar.gz"
ZIP_NAME="maestro7it-chatbot-v${VERSION}.zip"
SHA_NAME="maestro7it-chatbot-v${VERSION}.sha256"

DOWNLOAD_DIR="$PROJECT_ROOT/download"
mkdir -p "$DOWNLOAD_DIR"

# --- Исключения ---
EXCLUDE_DIRS=(
  './node_modules'
  './.next'
  './.git'
  './.zscripts'
  './skills'
  './research'
  './download'
  './mini-services'
  './.claude'
  './.z-ai-config'
)
EXCLUDE_FILES=(
  './dev.log'
  './server.log'
  './.env'
)

TAR_EXCLUDES=""
for d in "${EXCLUDE_DIRS[@]}"; do
  TAR_EXCLUDES="$TAR_EXCLUDES --exclude=$d"
done
for f in "${EXCLUDE_FILES[@]}"; do
  TAR_EXCLUDES="$TAR_EXCLUDES --exclude=$f"
done

ZIP_EXCLUDES=()
for d in "${EXCLUDE_DIRS[@]}"; do
  ZIP_EXCLUDES+=("-x" "${d#./}/*")
done
for f in "${EXCLUDE_FILES[@]}"; do
  ZIP_EXCLUDES+=("-x" "${f#./}")
done

# --- Сборка ---
if [ "$QUIET" != "quiet" ]; then
  echo "📦 Сборка архивов версии v$VERSION..."
fi

# tar.gz
tar $TAR_EXCLUDES \
  -czf "$DOWNLOAD_DIR/$TAR_NAME" \
  . 2>/dev/null

# zip
zip -rq "$DOWNLOAD_DIR/$ZIP_NAME" \
  . \
  "${ZIP_EXCLUDES[@]}"

# SHA256 — формат совместимый с `shasum -c`
{
  echo "# Контрольные суммы для архивов версии v$VERSION"
  echo "# Сгенерировано: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Проверка: shasum -a 256 -c $SHA_NAME"
  echo ""
  cd "$DOWNLOAD_DIR"
  shasum -a 256 "$TAR_NAME" "$ZIP_NAME"
  cd "$PROJECT_ROOT"
} > "$DOWNLOAD_DIR/$SHA_NAME"

# --- Отчёт ---
if [ "$QUIET" != "quiet" ]; then
  echo ""
  echo "✅ Готово. Файлы в $DOWNLOAD_DIR/:"
  ls -lh "$DOWNLOAD_DIR/$TAR_NAME" "$DOWNLOAD_DIR/$ZIP_NAME" "$DOWNLOAD_DIR/$SHA_NAME" 2>/dev/null | awk '{print "   ", $NF, "("$5")"}'
  echo ""
  echo "📊 Содержимое tar.gz:"
  echo "   $(tar -tzf "$DOWNLOAD_DIR/$TAR_NAME" | wc -l) файлов"
  echo ""
  echo "🔒 Проверка отсутствия .env в архиве:"
  if tar -tzf "$DOWNLOAD_DIR/$TAR_NAME" | grep -qE "^\./\.env$"; then
    echo "   ❌ .env найден в архиве!"
    exit 1
  else
    echo "   ✅ .env исключён"
  fi
fi

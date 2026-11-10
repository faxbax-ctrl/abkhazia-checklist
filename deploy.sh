#!/bin/sh
# "Соберись!" - отдельный Firebase Hosting site в существующем проекте.
# Публикуем только PWA-файлы, не локальные бэкапы и не документы.
# Запуск: sh deploy.sh
set -eu
cd "$(dirname "$0")"

rm -rf _site
mkdir _site
cp index.html sw.js manifest.webmanifest \
  icon-180.png icon-192.png icon-512.png _site/

npx -y firebase-tools@15 deploy \
  --only hosting:soberis \
  --project abkhazia-checklist \
  --non-interactive

echo "Сайт: https://abkhazia-checklist.web.app/"

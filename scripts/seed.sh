#!/usr/bin/env bash
# Seed user admin cho môi trường Supabase local.
# Tạo admin@test.com / password123 (role admin). Idempotent.
# Yêu cầu: supabase local đang chạy (supabase start), .env.local có keys.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.local; set +a

SVC="$SUPABASE_SERVICE_ROLE_KEY"; URL="$NEXT_PUBLIC_SUPABASE_URL"
EMAIL="${1:-admin@test.com}"; PASS="${2:-password123}"; NAME="${3:-Admin Tuấn}"

echo "→ Tạo user $EMAIL (bỏ qua nếu đã có)"
curl -s -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SVC" -H "Authorization: Bearer $SVC" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$NAME\"}}" \
  -o /dev/null -w "  HTTP %{http_code}\n" || true

# set role=admin (dùng cờ bypass guard vì thao tác chạy ngoài context auth admin)
CN=$(docker ps --format '{{.Names}}' | grep 'supabase_db' | head -1)
docker exec "$CN" psql -U postgres -t -A -c \
  "set app.bypass_role_guard='on'; update public.profiles set role='admin' where email='$EMAIL'; select '  '||email||' -> '||role from public.profiles where email='$EMAIL';"
echo "✓ Done"

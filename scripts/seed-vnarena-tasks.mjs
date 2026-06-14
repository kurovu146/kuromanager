// Seed sprints + issues cho project VNArena (key VNA) trên Supabase cloud.
// Dữ liệu được dựng lại từ git history của VNArena (be/ + fe/ + docs-site/).
// Đọc URL + SERVICE ROLE KEY từ vercel-env.txt (file gitignored, không lộ secret).
// Idempotent guard: nếu project VNA đã có issue -> dừng, không tạo trùng.
//
// Chạy:  node scripts/seed-vnarena-tasks.mjs            (mặc định dry-run, chỉ in kế hoạch)
//        node scripts/seed-vnarena-tasks.mjs --apply    (ghi thật vào DB)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- đọc env từ vercel-env.txt ---
const env = Object.fromEntries(
  readFileSync(join(root, 'vercel-env.txt'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong vercel-env.txt');

const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: prefer ? { ...H, Prefer: prefer } : H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// --- sprint timeline (2 tuần / sprint) ---
const SPRINTS = [
  { name: 'Sprint 1 · Nền tảng & Trang chủ', goal: 'Khởi tạo dự án, design system, trang chủ, hồ sơ, follow', start: '2026-02-21', end: '2026-03-06' },
  { name: 'Sprint 2 · Auth, Ranking & Onboarding', goal: 'Xác thực, hệ thống Elo/ranking, onboarding, matchmaking, messaging, lobby', start: '2026-03-07', end: '2026-03-20' },
  { name: 'Sprint 3 · Migration & Ổn định', goal: 'Migration FK sang user_profiles, hardening, polish messaging/lobby', start: '2026-03-21', end: '2026-04-03' },
  { name: 'Sprint 4 · Chatbot AI & Tournament Engine', goal: 'Chatbot LLM tool-loop, bracket engine, CI/deploy', start: '2026-04-04', end: '2026-04-17' },
  { name: 'Sprint 5 · Tournament, Bracket & Subscription', goal: 'Hoàn thiện giải đấu, bracket pan/zoom, formats, subscription split, livestream', start: '2026-04-18', end: '2026-05-01' },
  { name: 'Sprint 6 · Auth nâng cao & Settings', goal: 'Multi-identity, email verify, reset mật khẩu (Resend), settings', start: '2026-05-02', end: '2026-05-15' },
  { name: 'Sprint 7 · Team, V-coin & Challenges', goal: 'Quản lý đội, V-coin economy, challenges Fight Card, luật trận đấu', start: '2026-05-16', end: '2026-05-29' },
  { name: 'Sprint 8 · Performance Sports & Guest', goal: 'Môn performance, guest players, PR leaderboard, docs-site', start: '2026-05-30', end: '2026-06-12' },
  { name: 'Sprint 9 · Challenges/Lobby Redesign (hiện tại)', goal: 'Redesign UI challenges/lobby, hoàn thiện performance & docs', start: '2026-06-13', end: '2026-06-26' },
];

// --- issues: s=sprint(1-9), p=prefix, t=title, ty=type, pr=priority, pts=points, st=status, d=ngày ---
// st mặc định 'done' (sprint đã hoàn tất). Sprint 9 (hiện tại) có in_progress/in_review/todo.
const I = (s, p, t, ty, pr, pts, d, st = 'done') => ({ s, p, t, ty, pr, pts, d, st });
const ISSUES = [
  // ===== Sprint 1 =====
  I(1, 'FE', 'Khởi tạo dự án Next.js + design system nền tảng', 'story', 'high', 5, '2026-02-21'),
  I(1, 'FE', 'Khung layout/navigation + bộ component cơ bản', 'story', 'medium', 3, '2026-02-25'),
  I(1, 'FE', 'PWA: manifest, service worker, app icons (trophy-shield)', 'story', 'medium', 3, '2026-03-04'),
  I(1, 'FE', 'Hồ sơ: upload avatar/cover + header, stats nhà tổ chức', 'story', 'medium', 5, '2026-03-04'),
  I(1, 'FE', 'Trang chủ: hero section + stats carousel (6 môn thể thao)', 'story', 'high', 5, '2026-03-06'),
  I(1, 'Full', 'Follow: theo dõi người chơi + dialog follower/following', 'story', 'low', 3, '2026-03-06'),

  // ===== Sprint 2 =====
  I(2, 'Full', 'Auth nền tảng: đăng ký/đăng nhập + JWT token pair', 'story', 'highest', 8, '2026-03-09'),
  I(2, 'FE', 'AI Planner: wizard tạo giải (structured output, auto-fill, chọn môn)', 'story', 'high', 8, '2026-03-09'),
  I(2, 'Full', 'Ranking: Elo, rank tiers, backfill player_ratings, chart SVG', 'story', 'high', 8, '2026-03-10'),
  I(2, 'FE', 'Rank progression card + modal celebration rank-up theo môn', 'story', 'medium', 5, '2026-03-10'),
  I(2, 'Full', 'Onboarding: tour + checklist tự phát hiện (Supabase), pre-fill tên Google', 'story', 'high', 5, '2026-03-10'),
  I(2, 'FE', 'Hiệu ứng Particles/Celebration overlay + FPS auto-downgrade', 'story', 'low', 3, '2026-03-10'),
  I(2, 'Full', 'Matchmaking: hàng đợi tìm trận + countdown UI, claim opponent', 'story', 'high', 5, '2026-03-10'),
  I(2, 'Full', 'Streak: trang riêng + calendar/heatmap, milestone badge', 'story', 'medium', 5, '2026-03-11'),
  I(2, 'FE', 'Dashboard người chơi: card tiến trình, match history, welcome banner', 'story', 'medium', 5, '2026-03-10'),
  I(2, 'Full', 'Messaging: chat DM/group, infinite scroll cursor pagination, send limit', 'story', 'highest', 8, '2026-03-16'),
  I(2, 'Full', 'Lobby: tạo theo môn, auto-transfer host, dọn lobby "zombie", auto-kick', 'story', 'high', 8, '2026-03-18'),
  I(2, 'Full', 'Multi-profile: CRUD + switch endpoints, UI quản lý profile', 'story', 'high', 8, '2026-03-19'),
  I(2, 'Full', 'Subscription: giới hạn gói (team/lobby/tournament limits)', 'story', 'medium', 5, '2026-03-16'),
  I(2, 'FE', 'Notifications: bell, mark-as-read, delete all', 'story', 'low', 3, '2026-03-13'),
  I(2, 'FE', 'Settings: UI quản lý multi-profile', 'story', 'low', 3, '2026-03-19'),
  I(2, 'FE', 'H2H (head-to-head): màn so kè người chơi', 'story', 'low', 3, '2026-03-19'),
  I(2, 'BE', 'Security hardening pass (RLS, slug→UUID, admin client cho global stats)', 'task', 'high', 3, '2026-03-17'),
  I(2, 'FE', 'Accessibility (a11y) pass + bugfix', 'task', 'low', 2, '2026-03-13'),
  I(2, 'DevOps', 'Expose PostgreSQL port + cấu hình deploy ban đầu', 'task', 'medium', 2, '2026-03-19'),
  I(2, 'Full', 'Trang chủ: top 5 người chơi mọi môn', 'task', 'low', 2, '2026-03-20'),

  // ===== Sprint 3 =====
  I(3, 'BE', 'Migration: chuyển toàn bộ FK từ profiles sang user_profiles (multi-profile)', 'story', 'high', 8, '2026-03-23'),
  I(3, 'Full', 'Messaging: sort hội thoại theo last message + payload DM/group khớp Go API', 'bug', 'medium', 3, '2026-03-25'),
  I(3, 'FE', 'UI polish + fix lỗi prerender/dynamic (useSearchParams)', 'bug', 'low', 2, '2026-03-24'),
  I(3, 'BE', 'Dọn migration: bỏ cột/bảng không tồn tại, vá FK còn sót', 'bug', 'medium', 3, '2026-03-23'),

  // ===== Sprint 4 =====
  I(4, 'BE', 'Chatbot AI: orchestration LLM tool-loop + rate limit', 'story', 'high', 8, '2026-04-08'),
  I(4, 'BE', 'Chatbot: tool registry (5 read-only tools) + bảng chatbot_messages/rate_limits', 'story', 'medium', 5, '2026-04-08'),
  I(4, 'BE', 'Chatbot: ổn định tool calling (gpt-oss-120b) + fallback tool_use_failed', 'bug', 'medium', 3, '2026-04-08'),
  I(4, 'BE', 'Auth: xác thực Facebook token qua Graph API query param', 'bug', 'medium', 2, '2026-04-07'),
  I(4, 'DevOps', 'CI/deploy pipeline + fix lỗi build', 'task', 'medium', 3, '2026-04-10'),

  // ===== Sprint 5 =====
  I(5, 'Full', 'Tournament: tự động kết thúc giải khi mọi trận đã có kết quả', 'story', 'high', 5, '2026-04-29'),
  I(5, 'FE', 'Bracket: pan/zoom canvas cho giải lớn + sửa điểm trận đã hoàn tất', 'story', 'high', 5, '2026-04-27'),
  I(5, 'FE', 'Bracket: in ấn full bracket (không phải screenshot viewport)', 'bug', 'low', 2, '2026-04-29'),
  I(5, 'FE', 'Trang formats: hướng dẫn thể thức giải + sliding tabs indicator', 'story', 'low', 3, '2026-04-27'),
  I(5, 'Full', 'Lobby: redesign card + BE trả flat shape (host/team names/member_count)', 'story', 'medium', 5, '2026-04-28'),
  I(5, 'Full', 'Subscription: tách player/organizer subscriptions, nới free plan limit', 'story', 'medium', 5, '2026-04-26'),
  I(5, 'Full', 'Livestream: nhúng stream + portrait toggle, Twitch thay TikTok, fix YouTube 153', 'story', 'medium', 3, '2026-04-20'),
  I(5, 'FE', 'Trang chủ: redesign hero + featured tournaments (design v2)', 'story', 'medium', 5, '2026-04-27'),
  I(5, 'Full', 'Onboarding: checklist phát hiện "đã hoàn tất giải" cho organizer', 'bug', 'low', 2, '2026-04-27'),
  I(5, 'BE', 'Tournament: upload file điều lệ + phần quy định', 'story', 'low', 3, '2026-04-28'),

  // ===== Sprint 6 =====
  I(6, 'Full', 'Auth: multi-identity linking (1 account, nhiều phương thức login)', 'story', 'highest', 8, '2026-05-13'),
  I(6, 'BE', 'Auth: xác thực email khi đăng ký + đóng lỗ hổng OAuth timing (H10)', 'story', 'high', 5, '2026-05-13'),
  I(6, 'BE', 'Auth: reset mật khẩu qua email Resend + per-user cooldown', 'story', 'high', 5, '2026-05-13'),
  I(6, 'Full', 'Settings: đặt/đổi mật khẩu cho user OAuth-only + link/unlink Google/Facebook', 'story', 'medium', 5, '2026-05-14'),
  I(6, 'BE', 'Auth: bcrypt constant-time chống timing enumeration', 'bug', 'high', 3, '2026-05-13'),
  I(6, 'FE', 'FE pass: hoàn thiện nhiều màn UI (đợt 05-11→05-21)', 'story', 'medium', 5, '2026-05-13'),
  I(6, 'BE', 'BE pass: ổn định API/handler (đợt 05-11→05-13)', 'task', 'medium', 3, '2026-05-12'),

  // ===== Sprint 7 =====
  I(7, 'Full', 'Team management: CRUD, slug, upload icon/banner', 'story', 'highest', 8, '2026-05-23'),
  I(7, 'BE', 'Team: chuyển quyền đội trưởng (transfer ownership) + history log', 'story', 'high', 5, '2026-05-23'),
  I(7, 'BE', 'Team: soft-delete (confirm tên) + admin cleanup endpoint', 'story', 'medium', 5, '2026-05-23'),
  I(7, 'BE', 'Team: auto-tạo conversation khi tạo đội', 'story', 'low', 3, '2026-05-25'),
  I(7, 'BE', 'Team: chống race khi đổi slug (rejection sampling, retry 23505)', 'bug', 'medium', 3, '2026-05-23'),
  I(7, 'Full', 'V-coin: domain model + service + repo (atomic TX), schema/seed/idempotency', 'story', 'highest', 8, '2026-05-23'),
  I(7, 'Full', 'V-coin: balance pill header, tip button profile, transaction history realtime', 'story', 'high', 5, '2026-05-23'),
  I(7, 'FE', 'V-coin: route hook qua /api/proxy/api/vcoin/* (fix path 404)', 'bug', 'medium', 3, '2026-05-25'),
  I(7, 'Full', 'Challenges: redesign UI "Fight Card" + lobby', 'story', 'high', 8, '2026-05-23'),
  I(7, 'Full', 'Challenges: team mode create flow (sub-project D)', 'story', 'medium', 5, '2026-05-20'),
  I(7, 'BE', 'Challenges: judges candidate endpoint + H2H recent matches', 'story', 'medium', 3, '2026-05-23'),
  I(7, 'Full', 'Match rules: target_points + best_of (race-to) + RuleConfigBadge', 'story', 'high', 5, '2026-05-29'),
  I(7, 'Full', 'Match: MatchEndAction (tie/draw) + StartMatch (pending→in_progress)', 'story', 'high', 5, '2026-05-28'),
  I(7, 'Full', 'Tournament: đội/đôi (doubles), roster snapshot, team rating', 'story', 'high', 8, '2026-05-20'),
  I(7, 'Full', 'Matchmaking: realtime SSE notify đối thủ + navigate to lobby khi match', 'story', 'medium', 3, '2026-05-25'),
  I(7, 'BE', 'Admin: cleanup soft-deleted teams + AdminAPIKey constant-time compare', 'task', 'medium', 3, '2026-05-23'),
  I(7, 'BE', 'Profile public: organizerStats + tournamentHistory trong GetPublicProfile', 'story', 'low', 3, '2026-05-20'),
  I(7, 'Full', 'Streak + V-coin: check-in V-coin trên StreakCard, heatmap vcoin_amount/ngày', 'story', 'medium', 3, '2026-05-25'),

  // ===== Sprint 8 =====
  I(8, 'BE', 'Performance sports: bảng performance_entries + perf config columns + SSE', 'story', 'highest', 8, '2026-06-02'),
  I(8, 'BE', 'Performance: generate branch + save/rank results + create validation', 'story', 'high', 5, '2026-06-02'),
  I(8, 'BE', 'Performance: PR leaderboard endpoint (by sport + event)', 'story', 'medium', 3, '2026-06-03'),
  I(8, 'BE', 'Performance: per-sport perf metadata + perf_event', 'story', 'medium', 3, '2026-06-03'),
  I(8, 'BE', 'Guest players: guest profiles + phone verification (migration 047)', 'story', 'high', 5, '2026-06-02'),
  I(8, 'BE', 'Challenges: đối thủ guest + ChallengeRatingService (Elo idempotent + cap)', 'story', 'high', 5, '2026-06-02'),
  I(8, 'BE', 'Performance: chỉ cho phép performance format ở môn performance (gate result)', 'bug', 'medium', 2, '2026-06-03'),
  I(8, 'Docs', 'Khởi tạo docs-site (tài liệu sản phẩm)', 'story', 'low', 3, '2026-06-02'),

  // ===== Sprint 9 (hiện tại / active) =====
  I(9, 'Full', 'Challenges + Lobby: redesign UI (nhánh feat-challenges-lobby-redesign)', 'story', 'high', 8, '2026-06-13', 'in_progress'),
  I(9, 'Full', 'Cập nhật UI Challenges (nhánh feat-update-ui-challenges)', 'story', 'medium', 5, '2026-06-13', 'in_review'),
  I(9, 'FE', 'Challenges: wire MatchEndAction + RuleConfigBadge vào live view', 'story', 'medium', 3, '2026-06-13', 'in_progress'),
  I(9, 'BE', 'Performance sports: hoàn thiện entry/validation còn lại', 'story', 'medium', 5, '2026-06-14', 'todo'),
  I(9, 'Docs', 'Hoàn thiện docs-site: nội dung + deploy', 'story', 'medium', 5, '2026-06-13', 'todo'),
];

const main = async () => {
  // lấy project VNA + 1 profile admin làm reporter/assignee
  const [proj] = await rest('projects?key=eq.VNA&select=id,key,issue_seq');
  if (!proj) throw new Error('Không tìm thấy project key=VNA');
  const [me] = await rest('profiles?role=eq.admin&select=id,full_name&limit=1');
  if (!me) throw new Error('Không tìm thấy profile admin để làm reporter');

  const existing = await rest(`issues?project_id=eq.${proj.id}&select=id&limit=1`);
  if (existing.length > 0) {
    console.error('⚠ Project VNA đã có issue — DỪNG để tránh tạo trùng. Xoá issue/sprint cũ nếu muốn seed lại.');
    process.exit(1);
  }

  console.log(`Project: ${proj.key} (${proj.id})`);
  console.log(`Reporter/Assignee: ${me.full_name} (${me.id})`);
  console.log(`Sprints: ${SPRINTS.length} | Issues: ${ISSUES.length}`);
  const total = ISSUES.reduce((a, i) => a + i.pts, 0);
  for (let s = 1; s <= SPRINTS.length; s++) {
    const its = ISSUES.filter((i) => i.s === s);
    const pts = its.reduce((a, i) => a + i.pts, 0);
    console.log(`  S${s} ${SPRINTS[s - 1].name.padEnd(46)} ${String(its.length).padStart(2)} issue · ${pts} pts`);
  }
  console.log(`  Tổng story points: ${total}`);

  if (!APPLY) {
    console.log('\n(dry-run) Thêm cờ --apply để ghi thật vào DB.');
    return;
  }

  // 1) tạo sprints
  const sprintRows = SPRINTS.map((sp, idx) => ({
    project_id: proj.id,
    name: sp.name,
    goal: sp.goal,
    status: idx === SPRINTS.length - 1 ? 'active' : 'completed',
    start_date: sp.start,
    end_date: sp.end,
    completed_at: idx === SPRINTS.length - 1 ? null : `${sp.end}T17:00:00Z`,
  }));
  const created = await rest('sprints', { method: 'POST', body: sprintRows, prefer: 'return=representation' });
  const sprintIdByName = Object.fromEntries(created.map((r) => [r.name, r.id]));
  console.log(`\n✓ Đã tạo ${created.length} sprint`);

  // 2) tạo issues (key VNA-N, rank 1024 step trong từng sprint)
  const rankBySprint = {};
  const issueRows = ISSUES.map((it, idx) => {
    const sp = SPRINTS[it.s - 1];
    rankBySprint[it.s] = (rankBySprint[it.s] || 0) + 1024;
    const sprint_id = sprintIdByName[sp.name];
    const updated = it.st === 'done' ? `${sp.end}T17:00:00Z` : `${it.d}T09:00:00Z`;
    return {
      project_id: proj.id,
      key: `VNA-${idx + 1}`,
      title: `[${it.p}] ${it.t}`,
      description: `Nguồn: dựng lại từ git history VNArena.\nSprint: ${sp.name}.`,
      type: it.ty,
      status: it.st,
      priority: it.pr,
      story_points: it.pts,
      assignee_id: me.id,
      reporter_id: me.id,
      sprint_id,
      rank: rankBySprint[it.s],
      created_at: `${it.d}T09:00:00Z`,
      updated_at: updated,
    };
  });

  // insert theo lô 50
  let n = 0;
  for (let i = 0; i < issueRows.length; i += 50) {
    const chunk = issueRows.slice(i, i + 50);
    await rest('issues', { method: 'POST', body: chunk, prefer: 'return=minimal' });
    n += chunk.length;
    console.log(`  …đã insert ${n}/${issueRows.length} issue`);
  }

  // 3) cập nhật issue_seq để key tiếp theo không trùng
  await rest(`projects?id=eq.${proj.id}`, {
    method: 'PATCH',
    body: { issue_seq: issueRows.length },
    prefer: 'return=minimal',
  });

  console.log(`\n✓ Hoàn tất: ${created.length} sprint, ${issueRows.length} issue. issue_seq=${issueRows.length}.`);
};

main().catch((e) => {
  console.error('LỖI:', e.message);
  process.exit(1);
});

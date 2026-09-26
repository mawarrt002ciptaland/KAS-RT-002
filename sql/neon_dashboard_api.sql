-- =============================================================================
-- Public read-only dashboard views for Neon Data API.
-- Run this script AFTER enabling Neon Data API on the production branch and
-- database neondb. Managed Better Auth is not required for these anonymous
-- read-only dashboard views. It does not grant access to the base
-- Transaksi, Tagihan, Warga, or AnggotaKK tables.
--
-- The anonymous API role can SELECT only these curated views. Resident NIK,
-- phone, address, household membership, and payment-party columns are not
-- exposed. Personal/social transaction descriptions are replaced with a
-- generic label in the recent-transaction view.
-- =============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.rt_dashboard_summary
WITH (security_barrier = true)
AS
WITH trx AS (
  SELECT
    COALESCE(SUM("nominal") FILTER (WHERE "jenis" = 'pemasukan'), 0)::bigint AS income,
    COALESCE(SUM("nominal") FILTER (WHERE "jenis" = 'pengeluaran'), 0)::bigint AS expense
  FROM public."Transaksi"
), bills AS (
  SELECT
    COUNT(*) FILTER (WHERE "status" <> 'lunas')::bigint AS unpaid_count,
    COUNT(*) FILTER (WHERE "status" = 'telat')::bigint AS late_count,
    COUNT(*) FILTER (WHERE "status" = 'lunas')::bigint AS paid_count,
    COALESCE(SUM("jumlah" + COALESCE("denda", 0)) FILTER (WHERE "status" <> 'lunas'), 0)::bigint AS outstanding
  FROM public."Tagihan"
), residents AS (
  SELECT COUNT(*)::bigint AS household_count
  FROM public."Warga"
  WHERE COALESCE("status", 'aktif') = 'aktif'
), people AS (
  SELECT COUNT(*)::bigint AS member_count
  FROM public."AnggotaKK"
)
SELECT
  (trx.income - trx.expense)::bigint AS saldo,
  trx.income::bigint AS total_pemasukan,
  trx.expense::bigint AS total_pengeluaran,
  bills.unpaid_count AS tagihan_belum_lunas,
  bills.late_count AS tagihan_telat,
  bills.paid_count AS tagihan_lunas,
  bills.outstanding AS nominal_tunggakan,
  residents.household_count AS total_warga,
  (residents.household_count + people.member_count)::bigint AS total_jiwa
FROM trx CROSS JOIN bills CROSS JOIN residents CROSS JOIN people;

CREATE OR REPLACE VIEW public.rt_dashboard_cash_flow
WITH (security_barrier = true)
AS
WITH months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  )::date AS month_start
), totals AS (
  SELECT
    date_trunc('month', "tanggal")::date AS month_start,
    COALESCE(SUM("nominal") FILTER (WHERE "jenis" = 'pemasukan'), 0)::bigint AS income,
    COALESCE(SUM("nominal") FILTER (WHERE "jenis" = 'pengeluaran'), 0)::bigint AS expense
  FROM public."Transaksi"
  GROUP BY 1
)
SELECT
  to_char(months.month_start, 'YYYY-MM') AS month_key,
  CASE EXTRACT(MONTH FROM months.month_start)::int
    WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Apr'
    WHEN 5 THEN 'Mei' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Agu'
    WHEN 9 THEN 'Sep' WHEN 10 THEN 'Okt' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Des'
  END || ' ' || to_char(months.month_start, 'YY') AS label,
  COALESCE(totals.income, 0)::bigint AS pemasukan,
  COALESCE(totals.expense, 0)::bigint AS pengeluaran
FROM months LEFT JOIN totals USING (month_start)
ORDER BY months.month_start;

CREATE OR REPLACE VIEW public.rt_dashboard_expense_categories
WITH (security_barrier = true)
AS
WITH totals AS (
  SELECT "kategori", SUM("nominal")::bigint AS nominal
  FROM public."Transaksi"
  WHERE "jenis" = 'pengeluaran'
  GROUP BY "kategori"
)
SELECT
  "kategori",
  nominal,
  COALESCE(ROUND(100.0 * nominal / NULLIF(SUM(nominal) OVER (), 0), 1), 0) AS percent
FROM totals;

CREATE OR REPLACE VIEW public.rt_dashboard_recent_transactions
WITH (security_barrier = true)
AS
SELECT
  "id",
  "kode",
  "jenis",
  "tanggal",
  "kategori",
  CASE
    WHEN lower("kategori") LIKE '%sosial%' OR lower("kategori") LIKE '%kematian%'
      THEN 'Bantuan sosial warga RT 002'
    WHEN "jenis" = 'pemasukan'
      THEN 'Pemasukan kas RT 002 · ' || COALESCE("kategori", 'Lain-lain')
    ELSE 'Pengeluaran kas RT 002 · ' || COALESCE("kategori", 'Lain-lain')
  END AS "keterangan",
  "nominal",
  "metode",
  CASE WHEN lower(COALESCE("status", '')) = 'pending' THEN 'pending' ELSE 'selesai' END AS "status"
FROM public."Transaksi"
ORDER BY "tanggal" DESC, "createdAt" DESC
LIMIT 8;

-- Exact least-privilege grants for the Neon Data API anonymous role.
-- Do not grant SELECT to anonymous on the original personal-data tables.
GRANT USAGE ON SCHEMA public TO anonymous;
REVOKE ALL ON public.rt_dashboard_summary FROM PUBLIC;
REVOKE ALL ON public.rt_dashboard_cash_flow FROM PUBLIC;
REVOKE ALL ON public.rt_dashboard_expense_categories FROM PUBLIC;
REVOKE ALL ON public.rt_dashboard_recent_transactions FROM PUBLIC;
GRANT SELECT ON public.rt_dashboard_summary TO anonymous;
GRANT SELECT ON public.rt_dashboard_cash_flow TO anonymous;
GRANT SELECT ON public.rt_dashboard_expense_categories TO anonymous;
GRANT SELECT ON public.rt_dashboard_recent_transactions TO anonymous;

COMMIT;

-- Verify the sanitized public dashboard data. Expected totals should match the
-- private source tables, but no resident NIK/phone/address is returned.
SELECT * FROM public.rt_dashboard_summary;
SELECT * FROM public.rt_dashboard_cash_flow ORDER BY month_key;
SELECT * FROM public.rt_dashboard_expense_categories ORDER BY nominal DESC;
SELECT * FROM public.rt_dashboard_recent_transactions ORDER BY tanggal DESC;
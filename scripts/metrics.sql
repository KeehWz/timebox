-- npm run metrics   (reads the production D1 database)

-- Installs, and how many recorded anything at all
SELECT COUNT(DISTINCT install_id) AS installs,
       COUNT(DISTINCT CASE WHEN name = 'session_end' THEN install_id END) AS installs_that_recorded
FROM events;

-- Retention: of the installs first seen N or more days ago, how many ended a session on day N or later
WITH first_seen AS (
  SELECT install_id, MIN(ts) AS t0 FROM events GROUP BY install_id
),
recorded AS (
  SELECT e.install_id, MAX(CAST((e.ts - f.t0) / 86400000 AS INTEGER)) AS last_day
  FROM events e JOIN first_seen f USING (install_id)
  WHERE e.name = 'session_end'
  GROUP BY e.install_id
),
now AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS t)
SELECT d.day,
       COUNT(CASE WHEN now.t - f.t0 >= d.day * 86400000 THEN 1 END) AS eligible,
       COUNT(CASE WHEN now.t - f.t0 >= d.day * 86400000 AND r.last_day >= d.day THEN 1 END) AS still_recording
FROM (SELECT 1 AS day UNION ALL SELECT 3 UNION ALL SELECT 7) d
CROSS JOIN first_seen f
CROSS JOIN now
LEFT JOIN recorded r USING (install_id)
GROUP BY d.day;

-- What gets used
SELECT name, COUNT(*) AS events, COUNT(DISTINCT install_id) AS installs
FROM events GROUP BY name ORDER BY events DESC;

-- Sessions per install per active day, and typical length
SELECT ROUND(AVG(sessions), 1) AS sessions_per_active_day, ROUND(AVG(avg_minutes), 0) AS avg_minutes
FROM (
  SELECT install_id, date(ts / 1000, 'unixepoch') AS day, COUNT(*) AS sessions,
         AVG(json_extract(props, '$.minutes')) AS avg_minutes
  FROM events WHERE name = 'session_end' GROUP BY install_id, day
);

-- Latest feedback
SELECT datetime(received_at / 1000, 'unixepoch') AS received, app_version, contact, message
FROM feedback ORDER BY received_at DESC LIMIT 50;

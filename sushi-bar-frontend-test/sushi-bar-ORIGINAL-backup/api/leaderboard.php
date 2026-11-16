<?php
/*
 * leaderboard.php  (GET)
 * Returns the top 10 players. Each player appears once, with their best game
 * and how many games they have played. Only logged-in players can see it.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_login();

// For each player: the best game (highest score, earliest if tied) and their game count.
$rows = db()->query(
    'SELECT username, score, day, playedAt, games
       FROM (
         SELECT u.username,
                s.score,
                s.day,
                s.played_at AS playedAt,
                COUNT(*)     OVER (PARTITION BY s.user_id) AS games,
                ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY s.score DESC, s.played_at ASC) AS rn
           FROM scores s
           JOIN users u ON u.id = s.user_id
       ) best
      WHERE rn = 1
      ORDER BY score DESC, playedAt ASC
      LIMIT 10'
)->fetchAll();

foreach ($rows as &$row) {
    $row['score'] = (int) $row['score'];
    $row['day']   = (int) $row['day'];
    $row['games'] = (int) $row['games'];
}
unset($row);

respond(['ok' => true, 'rows' => $rows]);

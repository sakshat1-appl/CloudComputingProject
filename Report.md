# Project Report (One Page)

**Project Title:** Flappy Bird – Cloud-Hosted Gaming App with MapReduce Leaderboard

**Student Name(s):** [Member 1], [Member 2] ([Team leader uploads on behalf of the team])

## Objective

To develop a simple browser-based Flappy Bird game whose scores are stored on the cloud and ranked automatically using MapReduce, demonstrating cloud programming and software environments (Module 4).

## Problem Statement

Standalone games keep scores on one device: data is lost, there is no shared leaderboard, and manual ranking does not scale. Centralized cloud storage with automated aggregation solves this.

## Methodology / Tools Used

MapReduce (pure-Python, Hadoop-style: Map → Reduce), Flask REST API (deployment model: Amazon EC2 / PythonAnywhere), SQLite (stands in for S3/RDS), HTML5 Canvas + JavaScript (game), Cloudflare Tunnel (public-URL demo), Git/GitHub.

## Implementation

Browser game (`static/game.js`) POSTs `{player, score}` to Flask `POST /api/score`. `GET /api/leaderboard` runs the MapReduce job — Map emits `(player → score)` per game, Reduce computes `{best, avg, games}` per player and returns the Top-10; `GET /api/stats` returns global aggregates. Architecture:

```
Browser game (Canvas/JS) --REST--> Flask API (EC2 model) --> SQLite (cloud DB)
                                          |
                                   mapreduce.py (Top-10 + stats)
```

Run locally via `py app.py` (http://127.0.0.1:5000); exposed publicly via tunnel URL; source on GitHub.

## Results

Verified end-to-end: scores saved through the cloud API, leaderboard ranked correctly (e.g. test player “CloudDemo” score 99 ranked #1), stats (`total_games`, `overall_max`, `overall_avg`) computed instantly. No manual ranking; demo runs in under 10 minutes.

## Conclusion

The project met its objectives: game logic is decoupled from cloud-hosted data, and MapReduce automates ranking/analytics, demonstrating the Module 4 cloud-programming model on free-tier tooling.

## References

Flask documentation; Python `sqlite3` documentation; Cloudflare Tunnel documentation; GitHub documentation.

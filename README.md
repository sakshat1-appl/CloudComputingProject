# Flappy Bird - Cloud Edition

Simple Flappy Bird game with scores hosted on cloud backend + MapReduce leaderboard.
Module 4: Cloud programming and software environments.

## Structure
- `app.py` - Cloud API + DB (Flask + SQLite). Endpoints: POST /api/score, GET /api/leaderboard, GET /api/stats
- `mapreduce.py` - MapReduce ranking: Map (player,score) -> Reduce (max/avg/count) -> Top-10
- `templates/index.html` + `static/game.js` + `static/style.css` - Game logic
- `scores.db` - created on first run (stands in for S3/RDS/Supabase in demo)

## Run locally
```
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000 - enter name, Start, flap with Space/Click. Score auto-saves to cloud API, leaderboard refreshes every 5s.

## Deploy to cloud (pick one, no code change)
- EC2: launch Ubuntu t2.micro, open ports 22/5000, `pip install -r requirements.txt`, `gunicorn -b 0.0.0.0:5000 app:app`
- PythonAnywhere / Render: upload this folder, set start command `gunicorn app:app`
- DB swap: replace `get_db()` in app.py with Supabase/Postgres to show full cloud DB.

## Demo flow (10 min)
1. Play once, show score saved (2 min)
2. Play as 2nd player, refresh -> MapReduce Top-10 + stats update (3 min)
3. Show `mapreduce.py` map/reduce functions + EC2 architecture (3 min)

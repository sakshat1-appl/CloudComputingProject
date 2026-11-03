"""Flask cloud backend for Flappy Bird scores.
Runs locally and deploy-ready for EC2 / PythonAnywhere / Render.
Storage: SQLite (swap to Supabase/Postgres/S3 by changing get_db()).
"""

import sqlite3
import os
from flask import Flask, request, jsonify, render_template
from mapreduce import get_leaderboard, get_stats

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "scores.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    conn.commit()
    conn.close()


def fetch_all_rows():
    conn = get_db()
    rows = conn.execute("SELECT player, score FROM scores").fetchall()
    conn.close()
    return [{"player": r["player"], "score": r["score"]} for r in rows]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/score", methods=["POST"])
def save_score():
    data = request.get_json(force=True, silent=True) or {}
    player = str(data.get("player", "Anonymous")).strip()[:20] or "Anonymous"
    try:
        score = int(data.get("score", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "score must be an integer"}), 400
    if score < 0 or score > 10000:
        return jsonify({"error": "score out of range"}), 400

    conn = get_db()
    conn.execute("INSERT INTO scores (player, score) VALUES (?, ?)", (player, score))
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "player": player, "score": score})


@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    try:
        limit = min(int(request.args.get("limit", 10)), 50)
    except ValueError:
        limit = 10
    board = get_leaderboard(fetch_all_rows(), top_n=limit)
    return jsonify(board)


@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify(get_stats(fetch_all_rows()))


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "up"})


init_db()  # ensure DB exists for gunicorn / PythonAnywhere (no __main__ there)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

"""MapReduce ranking logic for Flappy Bird cloud scores.

Simulates Hadoop MapReduce in pure Python so it runs locally
and on any cloud VM (EC2 / PythonAnywhere / Render) with no extra setup.

Input rows: list of dicts like {"player": "ABC", "score": 12}
"""

from collections import defaultdict


def map_phase(rows):
    """Map: emit (player, score) for each game played."""
    mapped = []
    for r in rows:
        try:
            player = str(r.get("player", "Anonymous")).strip()[:20] or "Anonymous"
            score = int(r.get("score", 0))
        except (ValueError, TypeError, AttributeError):
            continue
        if score < 0:
            continue
        mapped.append((player, score))
    return mapped


def reduce_phase(mapped):
    """Reduce: group by player -> {max, total, count, avg}."""
    grouped = defaultdict(list)
    for player, score in mapped:
        grouped[player].append(score)

    reduced = {}
    for player, scores in grouped.items():
        reduced[player] = {
            "max": max(scores),
            "total": sum(scores),
            "count": len(scores),
            "avg": round(sum(scores) / len(scores), 2),
        }
    return reduced


def get_leaderboard(rows, top_n=10):
    """Top-N players by best (max) score. Returns list of dicts."""
    mapped = map_phase(rows)
    reduced = reduce_phase(mapped)
    board = [
        {"player": p, "best": v["max"], "games": v["count"], "avg": v["avg"]}
        for p, v in reduced.items()
    ]
    board.sort(key=lambda x: (-x["best"], x["player"]))
    return board[:top_n]


def get_stats(rows):
    """Global stats via MapReduce: total games, players, max, avg."""
    mapped = map_phase(rows)
    if not mapped:
        return {"total_games": 0, "unique_players": 0, "overall_max": 0, "overall_avg": 0}
    scores = [s for _, s in mapped]
    return {
        "total_games": len(scores),
        "unique_players": len({p for p, _ in mapped}),
        "overall_max": max(scores),
        "overall_avg": round(sum(scores) / len(scores), 2),
    }


if __name__ == "__main__":
    demo = [
        {"player": "ABC", "score": 12},
        {"player": "XYZ", "score": 25},
        {"player": "ABC", "score": 30},
        {"player": "DEF", "score": 7},
    ]
    print("Leaderboard:", get_leaderboard(demo))
    print("Stats:", get_stats(demo))

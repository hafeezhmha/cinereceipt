import json
import os
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

try:
    import letterboxdpy.user
    import letterboxdpy.movie
    from groq import Groq
except ImportError as e:
    # For debugging
    pass

def generate_taste_profile(user_data, reviews_data, groq_api_key):
    """Generate AI taste profile using Groq + Llama"""
    if not groq_api_key:
        return None

    try:
        client = Groq(api_key=groq_api_key)

        context = f"""Analyze this person's Letterboxd data. Write like you're having a real conversation - observant and natural, not academic.

{user_data['year']} VIEWING:
• {user_data['totals']['films']} films ({user_data['totals']['minutes']//60} hours)
• {user_data['totals']['average_rating']}/5 avg rating • {user_data['totals']['rewatches']} rewatches
• Most active: {max(user_data['monthly_breakdown'].items(), key=lambda x: x[1])[0]} ({max(user_data['monthly_breakdown'].values())} films)

TOP DIRECTORS:
{chr(10).join([f"{d['name']}: {d['count']} films" for d in user_data['top_directors'][:5]])}

ACTORS THEY WATCH:
{chr(10).join([f"{a['name']}: {a['count']} times" for a in user_data['top_actors'][:3]])}

FIVE-STAR FILMS:
{chr(10).join([f"• {f['title']}" for f in user_data['top_films'][:5]])}

THEIR ACTUAL REVIEWS:
{chr(10).join([f'{r["movie"]["name"]} ({r["rating"]/2}★): "{r["review"]["content"][:200]}"' for r in reviews_data[:4]])}

Write 4-6 sentences. Make it personal and specific:

• Reference their actual review quotes naturally - weave them into your analysis
• Notice specific director/actor combinations and what that reveals
• Mention concrete patterns (rating habits, peak month, rewatches)
• Connect their favorites to show a cohesive taste
• Sound like you actually read their reviews, not just scanned data

Be perceptive, not performative. Natural, not forced. Second person. No film school jargon."""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": context}],
            temperature=0.7,
            max_completion_tokens=400,
            top_p=0.9,
            stream=False
        )

        return completion.choices[0].message.content.strip()

    except Exception:
        return None

def fetch_letterboxd_data(username, year):
    """Fetch real data from Letterboxd using letterboxdpy"""
    try:
        user = letterboxdpy.user.User(username)
        diary_data = user.get_diary_year(year)

        if not diary_data or 'entries' not in diary_data:
            return {
                "username": username,
                "year": year,
                "error": "user_not_found",
                "message": f"User '{username}' not found on Letterboxd or has a private account"
            }

        entries_dict = diary_data['entries']

        if not entries_dict:
            return {
                "username": username,
                "year": year,
                "error": "no_films",
                "message": f"No films logged in {year}"
            }

        diary_entries = list(entries_dict.values())
        total_films = len(diary_entries)
        rewatches = sum(1 for entry in diary_entries if entry.get('actions', {}).get('rewatched', False))

        def fetch_film_details(entry):
            result = {
                'runtime': None,
                'directors': [],
                'actors': [],
                'rating': None,
                'title': entry.get('name', 'Unknown')
            }

            actions = entry.get('actions', {})
            if actions.get('rating'):
                result['rating'] = actions['rating'] / 2.0

            film_slug = entry.get('slug')
            if film_slug:
                try:
                    film = letterboxdpy.movie.Movie(film_slug)

                    if hasattr(film, 'runtime') and film.runtime:
                        result['runtime'] = film.runtime

                    if hasattr(film, 'crew') and film.crew:
                        film_directors = film.crew.get('director', [])
                        result['directors'] = [d['name'] for d in film_directors]

                    if hasattr(film, 'cast') and film.cast:
                        result['actors'] = [c['name'] for c in film.cast[:5]]
                except Exception:
                    pass

            return result

        total_minutes = 0
        directors = []
        actors = []
        rated_films = []

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {executor.submit(fetch_film_details, entry): i for i, entry in enumerate(diary_entries)}

            for future in as_completed(futures):
                try:
                    result = future.result()

                    if result['runtime']:
                        total_minutes += result['runtime']

                    directors.extend(result['directors'])
                    actors.extend(result['actors'])

                    if result['rating']:
                        rated_films.append((result['title'], result['rating']))
                except Exception:
                    pass

        avg_rating = round(sum(r[1] for r in rated_films) / len(rated_films), 1) if rated_films else 0.0

        director_counts = Counter(directors).most_common(5)
        top_directors = [{"name": name, "count": count} for name, count in director_counts]

        actor_counts = Counter(actors).most_common(3)
        top_actors = [{"name": name, "count": count} for name, count in actor_counts]

        rated_films.sort(key=lambda x: x[1], reverse=True)
        top_films = [{"title": title, "rating": rating} for title, rating in rated_films[:5]]

        months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"]
        monthly_counts = defaultdict(int)

        for entry in diary_entries:
            date_dict = entry.get('date')
            if date_dict and isinstance(date_dict, dict):
                month_num = date_dict.get('month')
                if month_num and 1 <= month_num <= 12:
                    month_name = months[month_num - 1]
                    monthly_counts[month_name] += 1

        monthly_breakdown = {month: monthly_counts.get(month, 0) for month in months}

        reviews_list = []
        try:
            reviews_dict = user.get_reviews()
            if reviews_dict:
                for outer_key, outer_value in list(reviews_dict.items())[:10]:
                    if isinstance(outer_value, dict):
                        for review_id, review_data in outer_value.items():
                            if isinstance(review_data, dict) and 'movie' in review_data:
                                reviews_list.append(review_data)
        except Exception:
            pass

        user_data = {
            "username": username,
            "year": year,
            "totals": {
                "films": total_films,
                "rewatches": rewatches,
                "minutes": total_minutes,
                "average_rating": avg_rating
            },
            "top_directors": top_directors,
            "top_actors": top_actors,
            "top_films": top_films,
            "monthly_breakdown": monthly_breakdown
        }

        groq_api_key = os.environ.get('GROQ_API_KEY')
        taste_profile = None
        if groq_api_key and reviews_list:
            taste_profile = generate_taste_profile(user_data, reviews_list, groq_api_key)

        user_data["ai_taste_profile"] = taste_profile
        user_data["reviews_count"] = len(reviews_list)

        return user_data

    except Exception as e:
        return {"error": "fetch_failed", "message": str(e)}

class handler(BaseHTTPRequestHandler):
    """Vercel serverless handler"""

    def do_POST(self):
        try:
            # Read and parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}

            username = data.get('username')
            year = data.get('year')

            if not username or not year:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing username or year"}).encode())
                return

            result = fetch_letterboxd_data(username, int(year))

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

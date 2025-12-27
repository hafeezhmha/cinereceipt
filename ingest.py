import sys
import json
import argparse
import os
from collections import Counter, defaultdict
from datetime import datetime
import letterboxdpy.user
import letterboxdpy.movie
from concurrent.futures import ThreadPoolExecutor, as_completed
from groq import Groq

def generate_taste_profile(user_data, reviews_data, groq_api_key):
    """Generate AI taste profile using Groq + Llama"""
    if not groq_api_key:
        return None

    try:
        client = Groq(api_key=groq_api_key)

        # Build context for LLM with more specific data
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

    except Exception as e:
        print(f"Warning: Could not generate taste profile: {e}", file=sys.stderr)
        return None

def fetch_letterboxd_data(username, year):
    """Fetch real data from Letterboxd using letterboxdpy"""
    try:
        user = letterboxdpy.user.User(username)

        # Get all diary entries for the year
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

        # Convert dict to list of entries
        diary_entries = list(entries_dict.values())

        # Calculate totals
        total_films = len(diary_entries)
        rewatches = sum(1 for entry in diary_entries if entry.get('actions', {}).get('rewatched', False))

        # Fetch film details in parallel for speed
        print(f"Fetching details for {total_films} films in parallel...", file=sys.stderr)

        def fetch_film_details(entry):
            """Fetch details for a single film"""
            result = {
                'runtime': None,
                'directors': [],
                'actors': [],
                'rating': None,
                'title': entry.get('name', 'Unknown')
            }

            # Get rating from entry
            actions = entry.get('actions', {})
            if actions.get('rating'):
                result['rating'] = actions['rating'] / 2.0  # Convert to 0.5-5.0 scale

            # Fetch film details
            film_slug = entry.get('slug')
            if film_slug:
                try:
                    film = letterboxdpy.movie.Movie(film_slug)

                    # Get runtime
                    if hasattr(film, 'runtime') and film.runtime:
                        result['runtime'] = film.runtime

                    # Get directors from crew
                    if hasattr(film, 'crew') and film.crew:
                        film_directors = film.crew.get('director', [])
                        result['directors'] = [d['name'] for d in film_directors]

                    # Get actors from cast
                    if hasattr(film, 'cast') and film.cast:
                        result['actors'] = [c['name'] for c in film.cast[:5]]
                except Exception:
                    pass  # Silently skip failed requests

            return result

        # Process films in parallel (max 20 concurrent for speed)
        total_minutes = 0
        directors = []
        actors = []
        rated_films = []

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {executor.submit(fetch_film_details, entry): i for i, entry in enumerate(diary_entries)}
            completed = 0

            for future in as_completed(futures):
                completed += 1
                if completed % 10 == 0 or completed == total_films:
                    print(f"Progress: {completed}/{total_films} films processed...", file=sys.stderr)

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

        # Calculate average rating
        avg_rating = round(sum(r[1] for r in rated_films) / len(rated_films), 1) if rated_films else 0.0

        # Top directors
        director_counts = Counter(directors).most_common(5)
        top_directors = [{"name": name, "count": count} for name, count in director_counts]

        # Top actors
        actor_counts = Counter(actors).most_common(3)
        top_actors = [{"name": name, "count": count} for name, count in actor_counts]

        # Top rated films
        rated_films.sort(key=lambda x: x[1], reverse=True)
        top_films = [{"title": title, "rating": rating} for title, rating in rated_films[:5]]

        # Monthly breakdown
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

        # Fetch user reviews
        print("Fetching reviews...", file=sys.stderr)
        reviews_list = []
        try:
            reviews_dict = user.get_reviews()
            if reviews_dict:
                # Reviews dict has nested structure with IDs
                for outer_key, outer_value in list(reviews_dict.items())[:10]:
                    if isinstance(outer_value, dict):
                        # Each outer value is itself a dict with review ID as key
                        for review_id, review_data in outer_value.items():
                            if isinstance(review_data, dict) and 'movie' in review_data:
                                reviews_list.append(review_data)
        except Exception as e:
            print(f"Warning: Could not fetch reviews: {e}", file=sys.stderr)

        # Build user data for AI analysis
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

        # Generate AI taste profile if API key is available
        groq_api_key = os.environ.get('GROQ_API_KEY')
        taste_profile = None
        if groq_api_key and reviews_list:
            print("Generating AI taste profile...", file=sys.stderr)
            taste_profile = generate_taste_profile(user_data, reviews_list, groq_api_key)

        # Add taste profile and review count to response
        user_data["ai_taste_profile"] = taste_profile
        user_data["reviews_count"] = len(reviews_list)

        return user_data

    except Exception as e:
        raise Exception(f"Failed to fetch Letterboxd data: {str(e)}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("username")
    parser.add_argument("year", type=int)
    args = parser.parse_args()

    # Fetch real Letterboxd data
    data = fetch_letterboxd_data(args.username, args.year)

    save_dir = f"receipts/{args.username}"
    os.makedirs(save_dir, exist_ok=True)
    save_path = f"{save_dir}/{args.year}.json"

    with open(save_path, "w") as f:
        json.dump(data, f, indent=2)

    print(json.dumps({"status": "success", "file": save_path}))

if __name__ == "__main__":
    main()

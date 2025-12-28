#!/usr/bin/env python3
"""Local development server for Python API"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add api/python to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api', 'python'))

# Import the fetch function
from ingest import fetch_letterboxd_data

app = Flask(__name__)
CORS(app)

@app.route('/api/ingest', methods=['GET', 'POST', 'OPTIONS'])
def ingest():
    if request.method == 'OPTIONS':
        return '', 200

    if request.method == 'GET':
        return jsonify({
            "message": "Letterboxd data ingestion API",
            "method": "POST",
            "body": {"username": "string", "year": "number"}
        })

    try:
        data = request.get_json()
        username = data.get('username')
        year = data.get('year')

        if not username or not year:
            return jsonify({"error": "Missing username or year"}), 400

        result = fetch_letterboxd_data(username, int(year))
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting local Python API server on http://localhost:5328")
    print("📋 Endpoint: http://localhost:5328/api/ingest")
    app.run(port=5328, debug=True)

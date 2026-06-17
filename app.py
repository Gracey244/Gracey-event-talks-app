import os
import urllib.request
import xml.etree.ElementTree as ET
import re
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "feed_cache.xml"

def fetch_and_parse_feed():
    xml_data = None
    
    # Try fetching from the web
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        # 8 seconds timeout
        with urllib.request.urlopen(req, timeout=8) as response:
            xml_data = response.read()
            # Cache the data locally
            try:
                with open(CACHE_FILE, 'wb') as f:
                    f.write(xml_data)
            except Exception as cache_err:
                print(f"Failed to write cache: {cache_err}")
    except Exception as fetch_err:
        print(f"Failed to fetch live feed: {fetch_err}. Trying local cache...")
        # Fallback to local cache if web fetch fails
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'rb') as f:
                xml_data = f.read()
        else:
            raise Exception(f"Failed to fetch live feed and no local cache was found. Original error: {fetch_err}")

    # Parse XML
    root = ET.fromstring(xml_data)
    
    # Namespaces (Atom feeds use http://www.w3.org/2005/Atom)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    for entry in root.findall('atom:entry', ns):
        title_elem = entry.find('atom:title', ns)
        date_str = title_elem.text if title_elem is not None else "Unknown Date"
        
        updated_elem = entry.find('atom:updated', ns)
        updated = updated_elem.text if updated_elem is not None else ""
        
        # Find alternate link
        link = ""
        for l in entry.findall('atom:link', ns):
            if l.get('rel') == 'alternate' or l.get('rel') is None:
                link = l.get('href')
                break
                
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        # Parse individual updates from content_html
        # Matches <h3>Type</h3> followed by content up to the next <h3> or end of content
        pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=(?:<h3>|$))', re.DOTALL | re.IGNORECASE)
        matches = pattern.findall(content_html)
        
        parsed_updates = []
        for type_str, body_html in matches:
            type_str = type_str.strip()
            body_html = body_html.strip()
            parsed_updates.append({
                'type': type_str,
                'content': body_html
            })
            
        # Fallback if no <h3> tags were found in the HTML content
        if not parsed_updates and content_html.strip():
            parsed_updates.append({
                'type': 'Update',
                'content': content_html.strip()
            })
            
        entries.append({
            'date': date_str,
            'updated': updated,
            'link': link,
            'updates': parsed_updates
        })
        
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        data = fetch_and_parse_feed()
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # Run Flask app locally on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)

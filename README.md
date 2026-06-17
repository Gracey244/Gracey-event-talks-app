# BigQuery Release Notes Explorer

A premium, responsive, and robust web application built using Python Flask, vanilla HTML, CSS, and JavaScript. The app acts as a monitor for the official Google Cloud BigQuery release notes feed, offering keyword filtering, category navigation, and quick social drafting.

## 🚀 Features

* **Atom Feed Ingestion**: Dynamically fetches and parses the live release notes feed from Google Cloud.
* **Smart Local Caching**: Implements a robust filesystem caching layer (`feed_cache.xml`) to serve as an instant fallback during network failures or offline development.
* **Category Navigation**: Instantly filter updates by type (Features, Announcements, Issues, Breaking Changes, and general Changes) from a sidebar dashboard.
* **Keyword Search**: Dynamic, instant client-side keyword matching.
* **X (Twitter) Integration**: Draft customizable tweets about any release. The app automatically formats the content and ensures it remains within the 280-character limit before opening X.

## 📂 Project Structure

```text
bq-release-notes/
├── templates/
│   └── index.html      # Primary client template and draft modal
├── static/
│   ├── app.js          # State management, filtering, and social sharing
│   └── style.css       # Premium custom glassmorphism theme stylesheet
├── app.py              # Flask backend server, Atom feed parsing, and cache management
├── feed_cache.xml      # Local cached XML payload (offline fallback)
├── requirements.txt    # Application dependencies
└── .gitignore          # Repository configuration
```

## 🛠️ Setup & Local Execution

### Prerequisites
* Python 3.11 or later.

### Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Gracey244/Gracey-event-talks-app.git
   cd Gracey-event-talks-app
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the App

Start the development server:
```bash
python app.py
```

The application will launch on **http://127.0.0.1:5000/**. Open this URL in your web browser.

## 📝 Dependencies

* **Flask**: A lightweight, extensible Python web framework.
* Python standard libraries (`urllib`, `xml.etree.ElementTree`, `re`) are utilized to keep dependencies minimal and installation fast.

// App State
let releaseNotes = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const loader = document.getElementById('loader');
const errorAlert = document.getElementById('error-alert');
const errorMessage = document.getElementById('error-message');
const errorRetryBtn = document.getElementById('error-retry-btn');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = refreshBtn.querySelector('.refresh-icon');
const exportCsvBtn = document.getElementById('export-csv-btn');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const tweetPreviewText = document.getElementById('tweet-preview-text');
const charCount = document.getElementById('char-count');
const modalCloseBtn = document.getElementById('modal-close-btn');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh & Export buttons
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    errorRetryBtn.addEventListener('click', fetchReleaseNotes);
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Search filter
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    // Category filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.type;
            renderFeed();
        });
    });

    // Modal Close
    modalCloseBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Textarea sync with preview & char counter
    tweetTextarea.addEventListener('input', () => {
        const text = tweetTextarea.value;
        tweetPreviewText.textContent = text;
        
        const length = text.length;
        charCount.textContent = length;

        // Visual warnings for char limit
        if (length > 280) {
            tweetTextarea.classList.add('invalid');
            charCount.className = 'char-counter danger';
            postTweetBtn.disabled = true;
        } else if (length > 250) {
            tweetTextarea.classList.remove('invalid');
            charCount.className = 'char-counter warning';
            postTweetBtn.disabled = false;
        } else {
            tweetTextarea.classList.remove('invalid');
            charCount.className = 'char-counter';
            postTweetBtn.disabled = false;
        }
    });

    // Copy to clipboard
    copyTweetBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(tweetTextarea.value)
            .then(() => showToast('Tweet text copied to clipboard!'))
            .catch(() => showToast('Failed to copy text.'));
    });

    // Open X (Twitter) Web Intent
    postTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length > 280) {
            showToast('Tweet exceeds 280 characters limit!');
            return;
        }
        const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(xUrl, '_blank');
        closeTweetModal();
    });
}

// Fetch Data from Flask API
async function fetchReleaseNotes() {
    showLoader();
    hideError();
    hideEmptyState();
    
    // Animate refresh icon spinner
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const response = await fetch('/api/release-notes');
        const result = await response.json();

        if (result.status === 'success') {
            releaseNotes = result.data;
            renderFeed();
        } else {
            showError(result.message || 'Unknown error occurred.');
        }
    } catch (err) {
        showError('Could not connect to the server. Make sure the Flask application is running.');
        console.error(err);
    } finally {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// Render Feed based on Filters and Search
function renderFeed() {
    feedContainer.innerHTML = '';
    let matchesFound = false;

    releaseNotes.forEach(entry => {
        // Filter updates inside the entry
        const filteredUpdates = entry.updates.filter(update => {
            const matchesType = (currentFilter === 'all') || (update.type.toLowerCase() === currentFilter);
            const rawText = stripHtml(update.content).toLowerCase();
            const matchesSearch = (searchQuery === '') || rawText.includes(searchQuery);
            return matchesType && matchesSearch;
        });

        if (filteredUpdates.length > 0) {
            matchesFound = true;
            
            // Create Date Group
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            // Date Header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            
            const dateBadge = document.createElement('span');
            dateBadge.className = 'date-badge';
            dateBadge.textContent = entry.date;
            
            const dateLine = document.createElement('div');
            dateLine.className = 'date-line';
            
            const alternateLink = document.createElement('a');
            alternateLink.className = 'date-link';
            alternateLink.href = entry.link || '#';
            alternateLink.target = '_blank';
            alternateLink.innerHTML = `
                Official Docs
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            `;

            dateHeader.appendChild(dateBadge);
            dateHeader.appendChild(dateLine);
            if (entry.link) {
                dateHeader.appendChild(alternateLink);
            }

            // Date Updates Container
            const updatesContainer = document.createElement('div');
            updatesContainer.className = 'date-updates';

            filteredUpdates.forEach(update => {
                const card = document.createElement('div');
                card.className = 'update-card';

                const cardHeader = document.createElement('div');
                cardHeader.className = 'update-card-header';

                const typeBadge = document.createElement('span');
                const lowerType = update.type.toLowerCase();
                typeBadge.className = `update-type-badge ${lowerType}`;
                typeBadge.textContent = update.type;

                const cardActions = document.createElement('div');
                cardActions.className = 'card-actions';

                const copyCardBtn = document.createElement('button');
                copyCardBtn.className = 'btn btn-secondary btn-sm';
                copyCardBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                `;
                copyCardBtn.addEventListener('click', () => {
                    const plainText = stripHtml(update.content);
                    navigator.clipboard.writeText(plainText)
                        .then(() => showToast('Update copied to clipboard!'))
                        .catch(() => showToast('Failed to copy.'));
                });

                const tweetBtn = document.createElement('button');
                tweetBtn.className = 'btn btn-secondary btn-sm';
                tweetBtn.innerHTML = `
                    <svg class="icon icon-twitter" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                    Tweet
                `;
                
                // Add event listener to open Tweet modal
                tweetBtn.addEventListener('click', () => {
                    openTweetModal(entry.date, update.type, stripHtml(update.content), entry.link);
                });

                cardActions.appendChild(copyCardBtn);
                cardActions.appendChild(tweetBtn);

                cardHeader.appendChild(typeBadge);
                cardHeader.appendChild(cardActions);

                const cardBody = document.createElement('div');
                cardBody.className = 'update-body';
                cardBody.innerHTML = update.content;

                // Adjust body links to open in a new tab
                cardBody.querySelectorAll('a').forEach(link => {
                    link.target = '_blank';
                });

                card.appendChild(cardHeader);
                card.appendChild(cardBody);
                updatesContainer.appendChild(card);
            });

            dateGroup.appendChild(dateHeader);
            dateGroup.appendChild(updatesContainer);
            feedContainer.appendChild(dateGroup);
        }
    });

    hideLoader();

    if (!matchesFound) {
        showEmptyState();
    } else {
        hideEmptyState();
    }
}

// Tweet Modal Operations
function openTweetModal(date, type, contentText, officialLink) {
    // Format initial draft
    // Clean text by replacing double spaces, newlines, etc.
    let cleanText = contentText
        .replace(/\s+/g, ' ')
        .replace(/\[.*?\]/g, '') // remove markdown link residuals if any
        .trim();

    const tag = `#BigQuery`;
    const header = `📢 BQ Release (${date}) | ${type.toUpperCase()}:\n`;
    const linkPart = `\n\nDocs: ${officialLink}`;
    
    // Determine maximum content text length to stay under 280 chars
    // 280 - header.length - linkPart.length - tag.length - 4 (spacing)
    const reservedLength = header.length + linkPart.length + tag.length + 5;
    const maxContentLength = 280 - reservedLength;

    if (cleanText.length > maxContentLength) {
        cleanText = cleanText.substring(0, maxContentLength - 3) + '...';
    }

    const tweetDraft = `${header}${cleanText} ${tag}${linkPart}`;

    tweetTextarea.value = tweetDraft;
    tweetPreviewText.textContent = tweetDraft;
    charCount.textContent = tweetDraft.length;
    charCount.className = 'char-counter';
    postTweetBtn.disabled = false;
    tweetTextarea.classList.remove('invalid');

    tweetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeTweetModal() {
    tweetModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scroll
}

// Toast System
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Helper Utilities
function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function showLoader() {
    loader.classList.remove('hidden');
    feedContainer.classList.add('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
    feedContainer.classList.remove('hidden');
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
    hideLoader();
    hideEmptyState();
}

function hideError() {
    errorAlert.classList.add('hidden');
}

function showEmptyState() {
    emptyState.classList.remove('hidden');
}

function hideEmptyState() {
    emptyState.classList.add('hidden');
}

// Export to CSV Functionality
function exportToCSV() {
    let csvRows = ['Date,Type,Description,Link'];
    let count = 0;
    
    releaseNotes.forEach(entry => {
        const filteredUpdates = entry.updates.filter(update => {
            const matchesType = (currentFilter === 'all') || (update.type.toLowerCase() === currentFilter);
            const rawText = stripHtml(update.content).toLowerCase();
            const matchesSearch = (searchQuery === '') || rawText.includes(searchQuery);
            return matchesType && matchesSearch;
        });
        
        filteredUpdates.forEach(update => {
            const date = entry.date.replace(/"/g, '""');
            const type = update.type.replace(/"/g, '""');
            const desc = stripHtml(update.content).trim().replace(/"/g, '""');
            const link = (entry.link || '').replace(/"/g, '""');
            
            csvRows.push(`"${date}","${type}","${desc}","${link}"`);
            count++;
        });
    });
    
    if (count === 0) {
        showToast('No updates to export!');
        return;
    }
    
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bq_release_notes_${currentFilter}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${count} items to CSV!`);
}

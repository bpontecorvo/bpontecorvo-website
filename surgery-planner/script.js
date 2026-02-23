// Utility functions
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function calculateProgress(startDate, endDate) {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // If today is before start date
    if (today < start) {
        return 0;
    }
    
    // If today is after end date
    if (today > end) {
        return 100;
    }
    
    // Calculate progress
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today - start) / (1000 * 60 * 60 * 24);
    
    return Math.round((elapsedDays / totalDays) * 100);
}

// Google Calendar integration
function createGoogleCalendarEvent(title, date, description = '') {
    const startDate = date.toISOString().split('T')[0];
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const eventDetails = {
        action: 'TEMPLATE',
        text: encodeURIComponent(title),
        dates: `${startDate}/${endDateStr}`,
        details: encodeURIComponent(description),
        location: ''
    };
    
    const url = `https://calendar.google.com/calendar/render?${Object.entries(eventDetails).map(([key, value]) => `${key}=${value}`).join('&')}`;
    return url;
}

function addToGoogleCalendar(surgeryDate, surgeryName) {
    const milestones = [
        { name: 'Out of Sling', date: addDays(surgeryDate, 21), description: '3 weeks post-surgery' },
        { name: 'Play Guitar', date: addDays(surgeryDate, 42), description: '6 weeks post-surgery' },
        { name: 'Bike/Run', date: addMonths(surgeryDate, 3), description: '3 months post-surgery' },
        { name: 'Climb Hard', date: addMonths(surgeryDate, 6), description: '6 months post-surgery' }
    ];
    
    // Create events for each milestone
    milestones.forEach(milestone => {
        const title = surgeryName ? `${surgeryName} - ${milestone.name}` : milestone.name;
        const description = milestone.description;
        const calendarUrl = createGoogleCalendarEvent(title, milestone.date, description);
        
        // Open each event in a new tab
        window.open(calendarUrl, '_blank');
    });
}

// Share link functionality
function createShareLink(surgeryDate, surgeryName) {
    const params = new URLSearchParams();
    params.set('date', surgeryDate.toISOString().split('T')[0]);
    if (surgeryName) {
        params.set('name', surgeryName);
    }
    return `${window.location.href.split('?')[0]}?${params.toString()}`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success message
        const button = document.getElementById('copy-link');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    });
}

// Calendar functionality
let currentCalendarMonth = 0; // 0 = surgery month, can navigate -2 to +3 months
let calendarSurgeryDate = null;
let calendarMilestones = {};

function getCalendarMonthOffset(offset) {
    const date = new Date(calendarSurgeryDate);
    date.setMonth(date.getMonth() + offset);
    return date;
}

function generateCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Generate 6 months: surgery month + 5 following months
    for (let i = 0; i < 6; i++) {
        const monthDate = getCalendarMonthOffset(i);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        // Create month container
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        
        // Create month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = `${monthNames[month]} ${year}`;
        monthContainer.appendChild(monthHeader);
        
        // Create month grid
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            monthGrid.appendChild(header);
        });
        
        // Generate calendar days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
        
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday
        
        const currentDate = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        while (currentDate <= endDate) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();
            
            // Check if this is the current month
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // Check if this is today
            if (currentDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Check if this is the surgery date
            if (calendarSurgeryDate && currentDate.getTime() === calendarSurgeryDate.getTime()) {
                dayElement.classList.add('surgery-date');
                dayElement.innerHTML += '<div class="milestone-label">Surgery</div>';
            }
            
            // Check if this is a milestone date
            const milestone = Object.entries(calendarMilestones).find(([key, date]) => 
                date && date.getTime() === currentDate.getTime()
            );
            
            if (milestone) {
                const [milestoneKey, milestoneDate] = milestone;
                dayElement.classList.add('milestone', milestoneKey);
                const label = getMilestoneLabel(milestoneKey);
                dayElement.innerHTML += `<div class="milestone-label">${label}</div>`;
            }
            
            monthGrid.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        monthContainer.appendChild(monthGrid);
        calendarGrid.appendChild(monthContainer);
    }
}

function getMilestoneLabel(key) {
    const labels = {
        'outOfSling': 'Out of Sling (3 weeks)',
        'guitar': 'Play Guitar (6 weeks)', 
        'bikeRun': 'Bike (2 months)',
        'ski': 'Ski (4 months)',
        'climb': 'Climb (6 months)'
    };
    return labels[key] || key;
}

function updateCalendarNavigation() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    // Disable previous button if we're at the earliest month (-2 from surgery)
    prevBtn.disabled = currentCalendarMonth <= -2;
    prevBtn.style.opacity = currentCalendarMonth <= -2 ? '0.5' : '1';
    prevBtn.style.cursor = currentCalendarMonth <= -2 ? 'not-allowed' : 'pointer';
    
    // Disable next button if we're at the latest month (+3 from surgery)
    nextBtn.disabled = currentCalendarMonth >= 3;
    nextBtn.style.opacity = currentCalendarMonth >= 3 ? '0.5' : '1';
    nextBtn.style.cursor = currentCalendarMonth >= 3 ? 'not-allowed' : 'pointer';
}

// Main application logic
function calculateRecoveryDates(surgeryDate) {
    return {
        outOfSling: addDays(surgeryDate, 21), // 3 weeks
        guitar: addDays(surgeryDate, 42),      // 6 weeks
        bikeRun: addMonths(surgeryDate, 2),    // 2 months (bike)
        ski: addMonths(surgeryDate, 4),        // 4 months (ski)
        climb: addMonths(surgeryDate, 6)       // 6 months
    };
}

function updateUI(dates, surgeryName) {
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';
    
    // Update milestone dates
    document.getElementById('out-of-sling-date').textContent = formatDate(dates.outOfSling);
    document.getElementById('guitar-date').textContent = formatDate(dates.guitar);
    document.getElementById('bike-run-date').textContent = formatDate(dates.bikeRun);
    document.getElementById('climb-date').textContent = formatDate(dates.climb);
    
    // Update progress bars
    const surgeryDate = new Date(document.getElementById('surgery-date').value);
    
    const milestones = [
        { date: dates.outOfSling, element: 'out-of-sling' },
        { date: dates.guitar, element: 'guitar' },
        { date: dates.bikeRun, element: 'bike-run' },
        { date: dates.climb, element: 'climb' }
    ];
    
    milestones.forEach(milestone => {
        const progress = calculateProgress(surgeryDate, milestone.date);
        const progressBar = document.querySelector(`#${milestone.element}-date`).parentElement.querySelector('.progress-fill');
        const progressText = document.querySelector(`#${milestone.element}-date`).parentElement.querySelector('.progress-text');
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}% complete`;
    });
    
    // Update calendar
    calendarSurgeryDate = surgeryDate;
    calendarMilestones = dates;
    currentCalendarMonth = 0;
    generateCalendar();
    updateCalendarNavigation();
    
    // Update button actions
    const addToCalendarBtn = document.getElementById('add-to-calendar');
    addToCalendarBtn.onclick = () => addToGoogleCalendar(surgeryDate, surgeryName);
    
    const copyLinkBtn = document.getElementById('copy-link');
    copyLinkBtn.onclick = () => copyToClipboard(createShareLink(surgeryDate, surgeryName));
}

function handleDateChange() {
    const surgeryDateInput = document.getElementById('surgery-date');
    const surgeryNameInput = document.getElementById('surgery-name');
    
    if (surgeryDateInput.value) {
        const surgeryDate = new Date(surgeryDateInput.value);
        const surgeryName = surgeryNameInput.value.trim();
        const dates = calculateRecoveryDates(surgeryDate);
        
        updateUI(dates, surgeryName);
        
        // Save to localStorage
        localStorage.setItem('surgeryDate', surgeryDate.toISOString());
        localStorage.setItem('surgeryName', surgeryName);
    }
}

function handleReset() {
    document.getElementById('surgery-date').value = '';
    document.getElementById('surgery-name').value = '';
    document.getElementById('results-section').style.display = 'none';
    localStorage.removeItem('surgeryDate');
    localStorage.removeItem('surgeryName');
}

function loadSavedData() {
    const savedDate = localStorage.getItem('surgeryDate');
    const savedName = localStorage.getItem('surgeryName');
    
    if (savedDate) {
        document.getElementById('surgery-date').value = new Date(savedDate).toISOString().split('T')[0];
        document.getElementById('surgery-name').value = savedName || '';
        handleDateChange();
    }
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const nameParam = urlParams.get('name');
    
    if (dateParam) {
        document.getElementById('surgery-date').value = dateParam;
        if (nameParam) {
            document.getElementById('surgery-name').value = nameParam;
        }
        handleDateChange();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for URL parameters first
    checkUrlParams();
    
    // If no URL params, check localStorage
    if (!new URLSearchParams(window.location.search).get('date')) {
        loadSavedData();
    }
    
    // Set minimum date to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    document.getElementById('surgery-date').min = todayStr;
    
    // Generate a default calendar view if no surgery date is set
    if (!calendarSurgeryDate) {
        // Use today's date as default for calendar display
        const defaultDate = new Date();
        calendarSurgeryDate = defaultDate;
        calendarMilestones = calculateRecoveryDates(defaultDate);
        currentCalendarMonth = 0;
        generateCalendar();
        updateCalendarNavigation();
    }
    
    // Event listeners
    document.getElementById('surgery-date').addEventListener('change', handleDateChange);
    document.getElementById('surgery-name').addEventListener('input', handleDateChange);
    document.getElementById('reset').addEventListener('click', handleReset);
    
    // Calendar navigation listeners
    document.getElementById('prev-month').addEventListener('click', function() {
        if (currentCalendarMonth > -2) {
            currentCalendarMonth--;
            generateCalendar();
            updateCalendarNavigation();
        }
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        if (currentCalendarMonth < 3) {
            currentCalendarMonth++;
            generateCalendar();
            updateCalendarNavigation();
        }
    });
    
    // Auto-save functionality
    setInterval(() => {
        const surgeryDateInput = document.getElementById('surgery-date');
        const surgeryNameInput = document.getElementById('surgery-name');
        
        if (surgeryDateInput.value) {
            localStorage.setItem('surgeryDate', new Date(surgeryDateInput.value).toISOString());
            localStorage.setItem('surgeryName', surgeryNameInput.value.trim());
        }
    }, 1000);
});

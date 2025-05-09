//constants
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

//DOM elements
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]'); //This ensures that the actual checkbox input get manipulate, which is the one that controls the toggle.
const toggleIcon = document.querySelector('#toggle-icon');

// Updates the toggle label and icon based on whether light mode is active
function toggleDarkLightMode(theme) { //isLight is a boolean -> false for dark mode
  //change the text based on the boolean
  const isLight = theme === LIGHT_THEME;
  toggleIcon.children[0].textContent = isLight ? 'Light Mode' : 'Dark Mode'; //first child element of the theme-switch-wrapper parent element
  toggleIcon.children[1].classList.replace(isLight ? 'fa-moon' : 'fa-sun', //second child element of the theme-switch-wrapper parent element
    isLight ? 'fa-sun' : 'fa-moon'
    //to replace the icon class
  );
}

// Handle theme switch
function switchTheme(event) {
  //isDark is just a boolean variable — it's used to clearly represent whether the current theme is dark.
  const isDark = event.target.checked; //to determine if dark mode is selected
  const selectedTheme = isDark ? DARK_THEME : LIGHT_THEME; //set the theme string based on checkbox
  document.documentElement.setAttribute('data-theme', selectedTheme); //to apply the theme as a data attribute on the <html> tag so CSS can react to it
  localStorage.setItem('theme', selectedTheme); //Save the selected theme to the browser so it remembers it on next visit
  toggleDarkLightMode(selectedTheme); // to update the icon/text display based on the theme.
  // if dark is true, isLight = false
}

// When the user changes the toggle switch, call switchTheme()
toggleSwitch.addEventListener('change', switchTheme);


//to apply saved theme on load
const currentTheme = localStorage.getItem('theme'); /// Get the saved theme from local storage (if any)
if (currentTheme) { //to check if one exists
  const isDark = currentTheme === DARK_THEME;
  document.documentElement.setAttribute('data-theme', currentTheme); //apply it to HTML tag
  toggleSwitch.checked = isDark; //set the checkbox switch to match the saved theme
  toggleDarkLightMode(currentTheme); // Update the label and icon accordingly
}

// Converts "HH:MM" to decimal
function parseTimeToDecimal(timeStr) {
  if (typeof timeStr !== 'string' || !timeStr.includes(":")) return 0;

  const [hours, minutes] = timeStr.split(":").map(Number);
  // Split time string into hours and minutes (e.g., "14:30" → ["14", "30"])

  return hours + minutes / 60;
  // Convert minutes into decimal (30 → 0.5), then add to hours

  //to split the string into an array using the colon (:) as the separator
  // .map(Number) -> converts each string element to a number using the built-in Number function
  //often used when parsing times, like converting "12:30" into [12, 30] for hours and minutes
}

// Converts "6pm" or "7:30am" to "18:00" or "07:30"
function convertTo24Hour(timeStr) {
  if (typeof timeStr !== 'string') return "00:00";

  timeStr = timeStr.toLowerCase().trim();
  const match = timeStr.match(/^(\d{1,2})(:(\d{2}))?\s*(am|pm)$/);

  if (!match) return "00:00"; // fallback to midnight

  let hour = parseInt(match[1]);
  const minutes = match[3] ? parseInt(match[3]) : 0;
  const period = match[4];

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateShift(startStr, endStr, breakMinutes, higherTimeStr) {
  const start = parseTimeToDecimal(startStr);
  const end = parseTimeToDecimal(endStr);
  const higherTime = parseTimeToDecimal(convertTo24Hour(higherTimeStr));
  const breakHours = breakMinutes / 60;

  const totalHours = end - start - breakHours;
  if (totalHours <= 0) return { before: 0, after: 0 };

  if (end <= higherTime) return { before: totalHours, after: 0 };
  if (start >= higherTime) return { before: 0, after: totalHours };

  const hoursBefore = higherTime - start;
  const hoursAfter = totalHours - hoursBefore;

  return { before: hoursBefore, after: hoursAfter };
}

//get rate based on day and time
function getRate(day, isAfterHigherTime, rates) {
  if (day === 'sun') return rates.sunday;
  if (day === 'sat') return rates.saturday;
  return isAfterHigherTime ? rates.weekdayHigher : rates.weekday;
}

function calculatePayForDay(day, start, end, breakMin, rates, higherRateTime) {
  const { before, after } = calculateShift(start, end, breakMin, higherRateTime);
  const payBefore = before * getRate(day, false, rates);
  const payAfter = after * getRate(day, true, rates);

  return {
    hours: before + after,
    pay: payBefore + payAfter
  };
}

function calculateRawHours(startStr, endStr, breakMinutes = 0) {
  const start = parseTimeToDecimal(startStr);
  const end = parseTimeToDecimal(endStr);
  const breakHours = breakMinutes / 60;

  let total = end - start - breakHours;
  return total > 0 ? total : 0;
}



// Generates HTML for a single day's inputs
function createDayInput(dayCode, dayName) {
  return `
    <div class="day-block">
      <label><strong>${dayName}</strong></label>
      <label>Start: <input type="time" name="start_${dayCode}"></label>
      <label>End: <input type="time" name="end_${dayCode}"></label>
      <label>Break (min): <input style:width:10px; type="number" name="break_${dayCode}" min="0" step="1" value="0"></label>
    </div>
  `;
}

//Adds a week's worth of shift inputs
let weekCount = 1; //to track how many weeks we've added 

// Adds a new set of shift inputs for the week
function addShift() {
  const container = document.getElementById("shiftsContainer");

  // Create the div for this week's shifts
  const div = document.createElement("div");
  div.className = "shift";

  // Fill it with 6 days (Monday to Saturday)
  div.innerHTML = `
    <h4>Week ${weekCount}</h4>
    <div class="week-row">
      ${createDayInput("mon", "Monday")}
      ${createDayInput("tue", "Tuesday")}
      ${createDayInput("wed", "Wednesday")}
      ${createDayInput("thu", "Thursday")}
      ${createDayInput("fri", "Friday")}
      ${createDayInput("sat", "Saturday")}
      ${createDayInput("sun", "Sunday")}
    </div>
  `;
  container.appendChild(div); //add to the page 
  weekCount++; //increase week counter
}

// Collects all filled-out shift inputs and returns them
function getAllShifts() {
  const shiftBlocks = document.querySelectorAll(".shift");
  const allShifts = [];

  const rates = {
    weekday: parseFloat(document.getElementById('weekdayRate').value) || 0,
    weekdayHigher: parseFloat(document.getElementById('weekdayHigherRate').value) || 0,
    saturday: parseFloat(document.getElementById('saturdayRate').value) || 0,
    sunday: parseFloat(document.getElementById('sundayRate').value) || 0,
  };
  const higherRateTimeStr = document.getElementById('higherRateTime').value.trim();
  const higherRateTime = higherRateTimeStr ? parseTimeToDecimal(convertTo24Hour(higherRateTimeStr)) : 0;

  for (const shift of shiftBlocks) {
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    for (const day of days) {
      const startInput = shift.querySelector(`input[name="start_${day}"]`);
      const endInput = shift.querySelector(`input[name="end_${day}"]`);
      const breakInput = shift.querySelector(`input[name="break_${day}"]`);

      if (startInput?.value && endInput?.value) {
        const breakMinutes = parseFloat(breakInput?.value || 0);
        const { hours, pay } = calculatePayForDay(
          day, startInput.value, endInput.value, breakMinutes, rates, higherRateTime
        );
        if (!isNaN(hours) && hours > 0) {
          allShifts.push({ hours, rate: pay / hours });
        }
      }
    }
  }

  return allShifts;
}


//Updates the total hours and pay shown on screen
function updateTotals() {
  const rates = {
    weekday: parseFloat(document.getElementById('weekdayRate').value),
    weekdayHigher: parseFloat(document.getElementById('weekdayHigherRate').value),
    saturday: parseFloat(document.getElementById('saturdayRate').value),
    sunday: parseFloat(document.getElementById('sundayRate').value),
  };

  const higherRateTime = document.getElementById('higherRateTime').value.trim();
  const hasInvalidRate = Object.values(rates).some(rate => isNaN(rate));

  const payDisplay = document.getElementById("totalsDisplay");
  const hourDisplay = document.getElementById("totalsHrsDisplay");

  if (hasInvalidRate || !higherRateTime) {
    payDisplay.innerHTML = `<h2">Please complete all rate fields to calculate pay</h2>`;
    hourDisplay.innerHTML = ``;
    return;
  }

  const shifts = getAllShifts();
  let totalHours = 0;
  let totalPay = 0;

  shifts.forEach(({ hours, rate }) => {
    console.log(`Shift: ${hours.toFixed(2)}h @ $${rate.toFixed(2)} → $${(hours * rate).toFixed(2)}`);
    totalHours += hours;
    totalPay += hours * rate;
});

  if (shifts.length === 0) {
    payDisplay.innerHTML = `<h2>No shift data entered.</h2>`;
    hourDisplay.innerHTML = ``;
    return;
  }

  // ✅ Show total hours
  hourDisplay.innerHTML = `<p>⏱️ <strong>Total Hours:</strong> ${totalHours.toFixed(2)} hrs</p>`;

  // ✅ Show pay
  payDisplay.innerHTML = `
    <p>💵 <strong>Payslip (before taxes):</strong> $${totalPay.toFixed(2)}</p>
    <a href="https://www.ato.gov.au/single-page-applications/calculatorsandtools?anchor=STC#STC/questions" target="_blank">👉🏻 Click here to calculate your taxes</a>
  `;
}


//Handles form submission and calculates flat rate comparison
document.getElementById("shiftForm").addEventListener("submit", function(e) {
  e.preventDefault(); // Stop page from reloading
  updateTotals();
});


// Add the first week of shifts when the page loads
addShift();

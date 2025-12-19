// function calculateShift(startStr, endStr, breakMinutes, higherTimeDecimal, nightStartDecimal, nightEndDecimal) {
//   let start = parseTimeToDecimal(startStr); //convert the start time to decimal hours
//   let end = parseTimeToDecimal(endStr); //convert the end time to decimal hours

//   //handle overnight shifts by adding 24 to the end
//   if (end <= start) end += 24;
//   //because before, shifts ending past midnight were ignored or treated as 0 hours

//   //night period 12am to 7am -> always on next day
//   const afternoonStart = higherTimeDecimal;
//   const afternoonEnd = nightStartDecimal + 24;

//   //night period 12am to 7am -> always on next day
//   let nightStart = nightStartDecimal + 24;
//   let nightEnd = nightEndDecimal + 24;

//   //calculate overlap between two periods --> how many hours overlap between two time ranges?
//   function overlap(aStart, aEnd, bStart, bEnd){ //to ensure no hours are double counted and negative overlaps are treated as 0
//     return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
//   }

//   // //wrap higher rate to next day if shift starts before 7pm
//   // let higherStart = higherTimeDecimal; //7pm
//   // if(higherStart <= start) higherStart += 24; //19 -> 43.00
//   // //if the shift starts before 7am then 7pm is TOMORROW (for the computer) but only for shifts that start before 7pm  

//   //split shifts 
//   let normalEnd = afternoonStart;
//   if(normalEnd <= start) normalEnd +=24;//only if shifts starts after 7pm
//   const normal = overlap(start, end, 0, normalEnd); //hours before higher rate time

//   const after = overlap(start, end, afternoonStart, afternoonEnd);   //hours after higher rate time but before night rate
//   const night = overlap(start, end, nightStart, nightEnd); //night hours

//   const totalRaw = normal + after + night; //total worked hours before break
//   if(totalRaw <= 0) return ({ normal: 0, after: 0, night: 0}) //no work or break return 0

//   const breakHours = breakMinutes / 60; //convert break time from minutes to hours
//   const factor = breakHours / totalRaw;
//   //subtract break proportionally across all zones 

//   return{
//     normal: normal * (1 - factor),
//     after: after * (1 - factor),
//     night: night * (1 - factor),
//   }
// }






// //*********!!!!!!
// nightEndDecimal = 7 (night ends at 7:00)

// start = 6 (shift starts at 6:00)

// workedHours = 5 (shift length)

// Step 1: Calculate night hours
// if (start < nightEndDecimal) { 
//   night = Math.min(workedHours, nightEndDecimal - start)
// }


// nightEndDecimal - start = 7 - 6 = 1

// workedHours = 5

// night = Math.min(5, 1) = 1 ✅

// ✅ Night hours = 1 (from 6:00 → 7:00)

// Step 2: Remaining hours
// const remaining = workedHours - night;


// remaining = 5 - 1 = 4 ✅

// These are the hours left after night hours (from 7:00 → 11:00 in this case).

// Step 3: Normal hours
// const dayStart = Math.max(start, nightEndDecimal);


// dayStart = max(6, 7) = 7 ✅

// Daytime starts after night ends, so 7:00.

// const dayEnd = Math.min(end, higherTimeDecimal);


// Let's assume higherTimeDecimal = 10 (overtime starts at 10:00)

// end = start + workedHours = 6 + 5 = 11

// dayEnd = min(11, 10) = 10 ✅

// normal = Math.max(0, dayEnd - dayStart);
// normal = Math.min(normal, remaining);


// normal = 10 - 7 = 3

// remaining = 4, so normal = min(3, 4) = 3 ✅

// ✅ Normal hours = 3 (from 7:00 → 10:00)

// Step 4: After-hours
// after = remaining - normal;


// after = 4 - 3 = 1 ✅

// ✅ After hours = 1 (from 10:00 → 11:00)

// Step 5: Final split
// Type	Hours	Time
// Night	1	6:00 → 7:00
// Normal	3	7:00 → 10:00
// After	1	10:00 → 11:00

// So the function works like a timeline:

// Count night hours first.

// Assign normal daytime hours.

// Everything left is after-hours.





// In your function:

// if (start < nightEndDecimal) { 
//   night = Math.min(workedHours, nightEndDecimal - start)
// }


// Here, nightEndDecimal is the time when the night period ends in the morning, e.g., 7 AM.

// start is your shift start.

// So this line is basically saying: “If my shift starts before the night period ends, count the hours from the shift start until the night period ends as night hours.”

// Notice a few things:

// The function assumes night hours are only the early-morning ones before nightEndDecimal.

// It never needs nightStartDecimal because:

// The way the function splits hours, the evening/night part that goes past the “normal” day is handled implicitly in the calculation with higherTimeDecimal and the overnight shift logic (end += 24).

// Essentially, night hours that occur in the “late night” (after the day ends) are counted automatically because end can go past 24, so subtracting start gives the correct duration.

// So nightStartDecimal is not needed in this version—it would only matter if you wanted to calculate night hours in both the evening and morning separately. Here, the function just cares about the morning cutoff (nightEndDecimal) and treats anything before that as night, plus the rest is handled with end += 24.

// ✅ In short: nightStart isn’t used because the calculation only needs the shift start, shift end, and the morning cutoff to split night vs day hours correctly.
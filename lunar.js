// Thuật toán chuyển đổi Dương lịch -> Âm lịch (Việt Nam), dựa trên công thức
// thiên văn phổ biến (Hồ Ngọc Đức). Múi giờ Việt Nam = +7.

function jdFromDate(dd, mm, yy) {
  var a = Math.floor((14 - mm) / 12);
  var y = yy + 4800 - a;
  var m = mm + 12 * a - 3;
  var jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function NewMoon(k) {
  var T = k / 1236.85;
  var T2 = T * T;
  var T3 = T2 * T;
  var dr = Math.PI / 180;
  var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  var deltat;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return Jd1 + C1 - deltat;
}

function SunLongitude(jdn) {
  var T = (jdn - 2451545.0) / 36525;
  var T2 = T * T;
  var dr = Math.PI / 180;
  var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  var L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
}

function getSunLongitude(dayNumber, timeZone) {
  return Math.floor(SunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI * 6);
}

function getNewMoonDay(k, timeZone) {
  return Math.floor(NewMoon(k) + 0.5 + timeZone / 24);
}

function getLunarMonth11(yy, timeZone) {
  var off = jdFromDate(31, 12, yy) - 2415021;
  var k = Math.floor(off / 29.530588853);
  var nm = getNewMoonDay(k, timeZone);
  var sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone) {
  var k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  var last = 0;
  var i = 1;
  var arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc != last && i < 14);
  return i - 1;
}

function convertSolar2Lunar(dd, mm, yy, timeZone) {
  var dayNumber = jdFromDate(dd, mm, yy);
  var k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  var monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  var a11 = getLunarMonth11(yy, timeZone);
  var b11 = a11;
  var lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  var lunarDay = dayNumber - monthStart + 1;
  var diff = Math.floor((monthStart - a11) / 29);
  var lunarLeap = 0;
  var lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    var leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff == leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

// ---------- Hàm dùng cho trang web ----------
function getVegetarianReminder(date){
  date = date || new Date();
  const [lunarDay] = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear(), 7);
  if (lunarDay === 1) {
    return "Hôm nay là mùng 1 âm lịch — có thể cân nhắc ăn chay nhé 🌱";
  }
  if (lunarDay === 14 || lunarDay === 15) {
    return `Hôm nay là ngày ${lunarDay} âm lịch — có thể cân nhắc ăn chay nhé 🌱`;
  }
  return null; // ngày thường, không cần hiện thông báo
}

window.getVegetarianReminder = getVegetarianReminder;


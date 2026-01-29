let slides = document.querySelectorAll('.slide');
let index = 0;

function showNextSlide() {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');
    index = (index + 1) % slides.length;
}

setInterval(showNextSlide, 3000);

function showSlide(n) { 
    slides.forEach(slide => slide.classList.remove('active'));
    slides[n].classList.add('active');
    index = (n + 1) % slides.length;
}  
function toggleMenu() {
  document.getElementById("navLinks").classList.toggle("active");
}

/* cart */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.phone,
    data.event,
    data.guests,
    data.time,
    data.service,
    data.address,
    data.diet
  ]);

  MailApp.sendEmail(
    "nwadireamblessed@gmail.com",
    "New NRI Mama Kitchen Booking",
    `
New Booking Received

Name: ${data.name}
Phone: ${data.phone}
Event: ${data.event}
Guests: ${data.guests}
Date: ${data.date}
`
  );

  return ContentService
    .createTextOutput(JSON.stringify({status:"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
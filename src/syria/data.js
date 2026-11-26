// Real cover scans from the Syrian Cassette Archives (syriancassettearchives.org), shown here as a design demo.
// Titles are read off each J-card; `year` only where the card prints it. Prices are part of the demo shop.
const c = (id) => `/syria/covers/sma-${id}.jpg`;
export const TAPES = [
  { id: "0853", img: c("0853"), ar: "ثلج ونار", en: "Thalj w Nar", artist: "Mayada El Hennawi", tag: "ميادة الحناوي", genre: "TARAB", price: 18 },
  { id: "0437", img: c("0437"), ar: "عتابات على العود", en: "Ataba on the Oud", artist: "Suleiman Ghali", tag: "سليمان غالي", genre: "ATABA", price: 14 },
  { img: "/syria/covers/x01.jpg", ar: "خليل خوشان", en: "Khalil Khoshan", artist: "Khalil Khoshan", tag: "خليل خوشان", genre: "SHAABI", price: 13 },
  { id: "0420", img: c("0420"), ar: "مواويل", en: "Mawawil", artist: "Habib Ali", tag: "حبيب علي", genre: "MAWAL", year: 1997, price: 12 },
  { id: "1012", img: c("1012"), ar: "أسمر", en: "Asmar", artist: "Samira Tawfiq", tag: "سميرة توفيق", genre: "FOLK", price: 17 },
  { id: "0325", img: c("0325"), ar: "طير الحباري", en: "Houbara Bird", artist: "Hamid Mansour", tag: "حميد منصور", genre: "JAZRAWI", price: 13 },
  { id: "0840", img: c("0840"), ar: "تقاسيم أمير البزق", en: "Taqasim, Prince of the Buzuq", artist: "Mohammed Abdel Karim", tag: "البزق", genre: "INSTRUMENTAL", price: 16 },
  { id: "0458", img: c("0458"), ar: "رسالة إلى الجولان", en: "Letter to the Golan", artist: "Salman al-Shaar & Hilmi Ghannam", tag: "الجولان", genre: "SUNG POETRY", price: 15 },
  { id: "0603", img: c("0603"), ar: "حفلة حلب", en: "Aleppo Concert", artist: "The Bandaly Family", tag: "حلب", genre: "POP", price: 14 },
  { img: "/syria/covers/x02.jpg", ar: "عتابات ٢٠٠٠", en: "Atabat 2000", artist: "Mohammed Al-Ali", tag: "محمد العلي", genre: "ATABA", year: 2000, price: 12 },
  { id: "0546", img: c("0546"), ar: "ستيريو عمر الكيلاني", en: "Stereo Omar al-Kilani", artist: "Omar al-Kilani shop", tag: "ستيريو", genre: "SHOP TAPE", price: 11 },
  { id: "0115", img: c("0115"), ar: "روح روحي", en: "Rouh Rouhi", artist: "Najwa Karam", tag: "نجوى كرم", genre: "POP", price: 15 },
  { id: "0424", img: c("0424"), ar: "مركز طارق", en: "Tareq Center", artist: "Tareq Center, Jenin", tag: "جنين", genre: "SHOP TAPE", price: 10 },
  { id: "0282", img: c("0282"), ar: "سليمان الشعار", en: "Suleiman al-Shaar", artist: "Suleiman al-Shaar", tag: "ورود", genre: "SUNG POETRY", price: 13 },
  { id: "0897", img: c("0897"), ar: "شريط فارغ", en: "Sednny SEL 60", artist: "Blank tape, side A", tag: "C-60", genre: "BLANK", price: 6 },
  { id: "0896", img: c("0896"), ar: "الفرقان", en: "Al-Furqan", artist: "Al-Furqan recordings", tag: "تسجيلات", genre: "SPOKEN WORD", price: 8 },
  { id: "0600", img: c("0600"), ar: "النسخة الأصلية", en: "Original Copy", artist: "Hi-Fi super stereo", tag: "Hi-Fi", genre: "SHAABI", price: 9 },
  { id: "0681", img: c("0681"), ar: "قائمة الأغاني", en: "Handwritten Track List", artist: "J-card insert", tag: "بخط اليد", genre: "INSERT", price: 7 },
];

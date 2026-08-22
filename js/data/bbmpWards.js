/**
 * @file bbmpWards.js
 * @description Canonical BBMP 198-Ward Directory & Zoning Reference for Bengaluru.
 * Maps Ward Numbers, English/Kannada Names, BBMP Administrative Zones, e-Aasthi Sub-Zones, and Verified Landmark Keywords.
 * Source: Bruhat Bengaluru Mahanagara Palike (BBMP) Official Delimitation Gazette & e-Aasthi Portal.
 * Updated: August 2026 — Comprehensive landmark, metro station, sub-layout, and revenue village directory.
 */

export const BBMP_ZONES = [
  { id: 'all', nameEn: 'All Zones', nameKn: 'ಎಲ್ಲಾ ವಲಯಗಳು' },
  { id: 'East', nameEn: 'East Zone', nameKn: 'ಪೂರ್ವ ವಲಯ', color: '#0284c7' },
  { id: 'West', nameEn: 'West Zone', nameKn: 'ಪಶ್ಚಿಮ ವಲಯ', color: '#7c3aed' },
  { id: 'South', nameEn: 'South Zone', nameKn: 'ದಕ್ಷಿಣ ವಲಯ', color: '#10b981' },
  { id: 'Mahadevapura', nameEn: 'Mahadevapura Zone', nameKn: 'ಮಹದೇವಪುರ ವಲಯ', color: '#f59e0b' },
  { id: 'Bommanahalli', nameEn: 'Bommanahalli Zone', nameKn: 'ಬೊಮ್ಮನಹಳ್ಳಿ ವಲಯ', color: '#ec4899' },
  { id: 'Yelahanka', nameEn: 'Yelahanka Zone', nameKn: 'ಯಲಹಂಕ ವಲಯ', color: '#06b6d4' },
  { id: 'Rajarajeshwari Nagar', nameEn: 'RR Nagar Zone', nameKn: 'ರಾಜರಾಜೇಶ್ವರಿನಗರ ವಲಯ', color: '#8b5cf6' },
  { id: 'Dasarahalli', nameEn: 'Dasarahalli Zone', nameKn: 'ದಾಸರಹಳ್ಳಿ ವಲಯ', color: '#f97316' }
];

export const BBMP_WARDS = [
  // --- YELAHANKA ZONE (Wards 1–11) ---
  {
    wardNo: 1,
    nameEn: 'Kempegowda Ward',
    nameKn: 'ಕೆಂಪೇಗೌಡ ವಾರ್ಡ್',
    zone: 'Yelahanka',
    subZone: 'Yelahanka',
    keywords: ['kempegowda', 'yelahanka satellite town', 'attur', 'sheshagiripura', 'harohalli', 'chikkabommasandra', 'rail wheel factory', 'rwf']
  },
  {
    wardNo: 2,
    nameEn: 'Chowdeshwari Ward',
    nameKn: 'ಚೌಡೇಶ್ವರಿ ವಾರ್ಡ್',
    zone: 'Yelahanka',
    subZone: 'Yelahanka',
    keywords: ['chowdeshwari', 'yelahanka old town', 'santhosh nagar', 'venkatala', 'maruthi nagar', 'kogilu cross', 'yelahanka police station']
  },
  {
    wardNo: 3,
    nameEn: 'Attur',
    nameKn: 'ಅತ್ತೂರು',
    zone: 'Yelahanka',
    subZone: 'Yelahanka',
    keywords: ['attur', 'atturu layout', 'mother dairy', 'attur lake', 'ananthapura', 'crpf campus', 'bmsit college', 'doddaballapur road']
  },
  {
    wardNo: 4,
    nameEn: 'Yelahanka Satellite Town',
    nameKn: 'ಯಲಹಂಕ ಉಪನಗರ',
    zone: 'Yelahanka',
    subZone: 'Yelahanka',
    keywords: ['yelahanka new town', 'satellite town', 'nes office', 'rajanukunte', 'seshadripuram college yelahanka', 'yelahanka 4th phase', 'yelahanka 5th phase']
  },
  {
    wardNo: 5,
    nameEn: 'Jakkur',
    nameKn: 'ಜಕ್ಕೂರು',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['jakkur', 'byatarayanapura', 'jakkuru lake', 'aerodrome', 'agrahara', 'jakkur flying club', 'amruthahalli', 'shivanahalli', 'jnc layout']
  },
  {
    wardNo: 6,
    nameEn: 'Thanisandra',
    nameKn: 'ತಣಿಸಂದ್ರ',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['thanisandra', 'byatarayanapura', 'manyata tech park', 'hegde nagar', 'rachenahalli', 'nagawara', 'thanisandra main road', 'bharatiya city', 'chokkanahalli']
  },
  {
    wardNo: 7,
    nameEn: 'Byatarayanapura',
    nameKn: 'ಬ್ಯಾಟರಾಯನಪುರ',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['byatarayanapura', 'bellary road', 'sahakara nagar', 'kodigehalli', 'bbmp zonal office byatarayanapura', 'amruthahalli police station', 'shankar nagar']
  },
  {
    wardNo: 8,
    nameEn: 'Kodigehalli',
    nameKn: 'ಕೊಡಿಗೇಹಳ್ಳಿ',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['kodigehalli', 'byatarayanapura', 'tindlu', 'thindlu', 'virupakshapura', 'sahakar nagar', 'kodigehalli railway station', 'tindlu main road', 'canara bank layout']
  },
  {
    wardNo: 9,
    nameEn: 'Vidyaranyapura',
    nameKn: 'ವಿದ್ಯಾರಣ್ಯಪುರ',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['vidyaranyapura', 'byatarayanapura', 'bel layout', 'doddabommasandra', 'sambram college', 'ams engineering college', 'vidyaranyapura main road', 'nandi garden']
  },
  {
    wardNo: 10,
    nameEn: 'Doddabommasandra',
    nameKn: 'ದೊಡ್ಡಬೊಮ್ಮಸಂದ್ರ',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['doddabommasandra', 'byatarayanapura', 'kuvempu nagar', 'nanjappa layout', 'bel circle', 'doddabommasandra lake', 'chikkabommasandra lake']
  },
  {
    wardNo: 11,
    nameEn: 'Kuvempu Nagar',
    nameKn: 'ಕುವೆಂಪು ನಗರ',
    zone: 'Yelahanka',
    subZone: 'Byatarayanapura',
    keywords: ['kuvempu nagar', 'byatarayanapura', 'jalahalli east', 'mes road', 'air force technical college', 'jalahalli cross', 'subroto mukherjee park']
  },

  // --- DASARAHALLI ZONE (Wards 12–15, 39, 41, 70–71) ---
  {
    wardNo: 12,
    nameEn: 'Shettihalli',
    nameKn: 'ಶೆಟ್ಟಿಹಳ್ಳಿ',
    zone: 'Dasarahalli',
    keywords: ['shettihalli', 'mallasandra', 'abbigere', 'kammagondanahalli', 'medahalli', 'chikkabanavara road', 'shettihalli ring road']
  },
  {
    wardNo: 13,
    nameEn: 'Mallasandra',
    nameKn: 'ಮಲ್ಲಸಂದ್ರ',
    zone: 'Dasarahalli',
    keywords: ['mallasandra', 'bagalagunte', 't dasarahalli', 'hesaraghatta main road', 'siddaganga school', 'mallasandra lake']
  },
  {
    wardNo: 14,
    nameEn: 'Bagalagunte',
    nameKn: 'ಬಾಗಲಗುಂಟೆ',
    zone: 'Dasarahalli',
    keywords: ['bagalagunte', 'havanur layout', 'hesaraghatta main road', 'sambhram hospital', 'manjunatha nagar dasarahalli', 'defense colony bagalagunte']
  },
  {
    wardNo: 15,
    nameEn: 'T Dasarahalli',
    nameKn: 'ಟಿ ದಾಸರಹಳ್ಳಿ',
    zone: 'Dasarahalli',
    keywords: ['dasarahalli', 'peenya 2nd stage', 'meenakshi layout', 'dasarahalli metro station', 'tumkur road', 'kalyana nagar dasarahalli']
  },
  {
    wardNo: 39,
    nameEn: 'Chokkasandra',
    nameKn: 'ಚೊಕ್ಕಸಂದ್ರ',
    zone: 'Dasarahalli',
    keywords: ['chokkasandra', 'peenya', 'tumkur road', 'industrial area', 'chokkasandra lake', 'jalahalli cross metro', 'wipro peenya']
  },
  {
    wardNo: 41,
    nameEn: 'Peenya Industrial Area',
    nameKn: 'ಪೀಣ್ಯ ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ',
    zone: 'Dasarahalli',
    keywords: ['peenya', 'industrial area', 'peenya 1st stage', 'factory', 'peenya metro station', 'goraguntepalya', 'peenya gymkhana']
  },
  {
    wardNo: 70,
    nameEn: 'Rajagopalanagar',
    nameKn: 'ರಾಜಗೋಪಾಲನಗರ',
    zone: 'Dasarahalli',
    keywords: ['rajagopalanagar', 'hegganahalli', 'dasarahalli', 'peenya 2nd stage', 'rajagopalanagar police station', 'ganapathi nagar']
  },
  {
    wardNo: 71,
    nameEn: 'Hegganahalli',
    nameKn: 'ಹೆಗ್ಗನಹಳ್ಳಿ',
    zone: 'Dasarahalli',
    keywords: ['hegganahalli', 'rajagopalanagar', 'peenya', 'sunkadakatte', 'hegganahalli cross', 'd group layout', 'vishwaneedam post']
  },

  // --- RAJARAJESHWARI NAGAR ZONE (Wards 16–17, 37–38, 40, 42, 69, 72–73, 129–130, 159–160, 198) ---
  {
    wardNo: 16,
    nameEn: 'Jalahalli',
    nameKn: 'ಜಾಲಹಳ್ಳಿ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['jalahalli cross', 'jalahalli village', 'air force station', 'bel market', 'hmt colony', 'jalahalli metro station', 'mathikere link road']
  },
  {
    wardNo: 17,
    nameEn: 'J P Park',
    nameKn: 'ಜೆ ಪಿ ಪಾರ್ಕ್',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['jp park', 'mathikere', 'yeshwanthpur', 'brindavan nagar', 'jayaprakash narayana biodiversity park', 'divanrapalya', 'gokula 1st stage']
  },
  {
    wardNo: 37,
    nameEn: 'Yeshwanthpura',
    nameKn: 'ಯಶವಂತಪುರ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['yeshwanthpur', 'yeshwantpur', 'railway station', 'tumkur road', 'yeshwanthpur metro', 'apmc yard', 'brigade gateway', 'world trade center bangalore']
  },
  {
    wardNo: 38,
    nameEn: 'H M T',
    nameKn: 'ಎಚ್ ಎಂ ಟಿ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['hmt', 'hmt layout', 'yeshwanthpur', 'goraguntepalya', 'hmt watch factory', 'peenya junction', 'goraguntepalya metro']
  },
  {
    wardNo: 40,
    nameEn: 'Dodda Bidarkallu',
    nameKn: 'ದೊಡ್ಡ ಬಿದರಕಲ್ಲು',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['dodda bidarkallu', 'bidarahalli', 'herohalli', 'nagasandra metro', 'ikea nagasandra', 'anchepalya', 'tumkur highway']
  },
  {
    wardNo: 42,
    nameEn: 'Lakshmidevinagar',
    nameKn: 'ಲಕ್ಷ್ಮಿದೇವಿನಗರ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['lakshmidevinagar', 'goraguntepalya', 'yeshwanthpur', 'nandini layout boundary', 'outer ring road west']
  },
  {
    wardNo: 69,
    nameEn: 'Laggere',
    nameKn: 'ಲಗ್ಗೆರೆ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['laggere', 'nagarabhavi', 'magadi road', 'outer ring road laggere', 'chowdeshwari nagar', 'preethi nagar', 'laggere bridge']
  },
  {
    wardNo: 72,
    nameEn: 'Herohalli',
    nameKn: 'ಹೀರೋಹಳ್ಳಿ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['herohalli', 'kengeri', 'bidarahalli', 'sunkadakatte', 'anand nagar herohalli', 'vishwaneedam', 'magadi main road']
  },
  {
    wardNo: 73,
    nameEn: 'Kottigepalya',
    nameKn: 'ಕೊಟ್ಟಿಗೆಪಾಳ್ಯ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['kottigepalya', 'laggere', 'nagarabhavi', 'summanahalli', 'magadi road tollgate', 'malathahalli cross', 'sreegandadakaval']
  },
  {
    wardNo: 129,
    nameEn: 'Jnanabharathi',
    nameKn: 'ಜ್ಞಾನಭಾರತಿ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['jnanabharathi', 'bangalore university', 'kengeri', 'jnanabharathi metro', 'nagarabhavi 2nd stage', 'mariyyappanapalya', 'nlsiu law school']
  },
  {
    wardNo: 130,
    nameEn: 'Ullalu',
    nameKn: 'ಉಲ್ಲಾಳು',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['ullal', 'ullalu', 'jnanabharathi', 'bangalore university', 'ullal upanagara', 'sir m vishveshwaraiah layout', 'mallathahalli lake']
  },
  {
    wardNo: 159,
    nameEn: 'Kengeri',
    nameKn: 'ಕೆಂಗೇರಿ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['kengeri', 'kengeri satellite town', 'mysore road', 'shirke layout', 'kengeri metro station', 'kengeri bus terminal', 'kommaghatta']
  },
  {
    wardNo: 160,
    nameEn: 'Rajarajeshwari Nagar',
    nameKn: 'ರಾಜರಾಜೇಶ್ವರಿ ನಗರ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['rr nagar', 'rajarajeshwarinagar', 'ideal homes', 'nimishamba temple', 'global village tech park', 'rr nagar arch', 'bantanapalay', 'jawarlal nehru road']
  },
  {
    wardNo: 198,
    nameEn: 'Hemmigepura',
    nameKn: 'ಹೆಮ್ಮಿಗೆಪುರ',
    zone: 'Rajarajeshwari Nagar',
    keywords: ['hemmigepura', 'kenchanahalli', 'rr nagar', 'kengeri satellite town', 'nice road link', 'channasandra rr nagar', 'banashankari 6th stage']
  },

  // --- EAST ZONE (Wards 18–24, 27–34, 46–50, 57–63, 78–80, 87–93, 110, 111–117) ---
  {
    wardNo: 18,
    nameEn: 'Radhakrishna Temple',
    nameKn: 'ರಾಧಾಕೃಷ್ಣ ದೇವಸ್ಥಾನ',
    zone: 'East',
    keywords: ['radhakrishna temple', 'sanjaynagar', 'geddalahalli', 'rmv 2nd stage', 'dollars colony sanjaynagar', 'ashwath nagar', 'boopasandra']
  },
  {
    wardNo: 19,
    nameEn: 'Sanjaya Nagar',
    nameKn: 'ಸಂಜಯ ನಗರ',
    zone: 'East',
    keywords: ['sanjaynagar', 'isro layout', 'geddalahalli', 'vaidya hospital', 'nagavara main road', 'rmv extension', 'aero club road']
  },
  {
    wardNo: 20,
    nameEn: 'Ganga Nagar',
    nameKn: 'ಗಂಗಾ ನಗರ',
    zone: 'East',
    keywords: ['ganganagar', 'rt nagar', 'dinnur main road', 'cbi road', 'hmt layout ganganagar', 'ganganagar market', 'bellary road ganganagar']
  },
  {
    wardNo: 21,
    nameEn: 'Hebbala',
    nameKn: 'ಹೆಬ್ಬಾಳ',
    zone: 'East',
    keywords: ['hebbal', 'hebbal flyover', 'baptist hospital', 'kempapura', 'hebbal lake', 'anand nagar hebbal', 'kanaka nagar', 'chola nagar']
  },
  {
    wardNo: 22,
    nameEn: 'Vishwanath Nagenahalli',
    nameKn: 'ವಿಶ್ವನಾಥ ನಾಗೇನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['nagenahalli', 'kanakanagar', 'manorayanapalya', 'vishwanatha nagenahalli', 'gundappa layout', 'kempapura main road']
  },
  {
    wardNo: 23,
    nameEn: 'Nagavara',
    nameKn: 'ನಾಗವಾರ',
    zone: 'East',
    keywords: ['nagawara', 'manyata tech park', 'outer ring road', 'arabic college', 'nagavara lake', 'lumbini gardens', 'junction hotel manyata']
  },
  {
    wardNo: 24,
    nameEn: 'HBR Layout',
    nameKn: 'ಎಚ್.ಬಿ.ಆರ್ ಬಡಾವಣೆ',
    zone: 'East',
    keywords: ['hbr layout', 'hennur cross', '1st stage', '2nd stage', '3rd block hbr', '4th block hbr', '5th block hbr', 'kalyan nagar boundary', 'nagawara ring road']
  },
  {
    wardNo: 27,
    nameEn: 'Banasawadi',
    nameKn: 'ಬಾಣಸವಾಡಿ',
    zone: 'East',
    keywords: ['banaswadi', 'hrbr layout', 'kammanahalli', 'chikka banaswadi', 'ombr layout', 'banaswadi railway station', 'subbaiahnapalya', 'dodda banaswadi']
  },
  {
    wardNo: 28,
    nameEn: 'Kammanahalli',
    nameKn: 'ಕಮ್ಮನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['kammanahalli', 'nehrunagar', 'kalyan nagar', 'oil mill road', 'kammanahalli main road', 'sena vihar', 'jal vayu vihar', 'kullappa circle']
  },
  {
    wardNo: 29,
    nameEn: 'Kacharkanahalli',
    nameKn: 'ಕಚರಕನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['kacharkanahalli', 'thomas town', 'lingarajapuram', 'hrbr 2nd block', 'kacharakanahalli lake', 'hennur main road']
  },
  {
    wardNo: 30,
    nameEn: 'Kadugondanahalli',
    nameKn: 'ಕಾಡುಗೊಂಡನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['kg halli', 'kadugondanahalli', 'nagawara main road', 'dr ambedkar medical college', 'periyar nagar', 'shampura']
  },
  {
    wardNo: 31,
    nameEn: 'Kushal Nagar',
    nameKn: 'ಕುಶಾಲ್ ನಗರ',
    zone: 'East',
    keywords: ['kushal nagar', 'tannery road', 'frazer town', 'pottery town', 'pulakeshinagar boundary', 'shampura main road']
  },
  {
    wardNo: 32,
    nameEn: 'Kaval Bairasandra',
    nameKn: 'ಕಾವಲ್ ಬೈರಸಂದ್ರ',
    zone: 'East',
    keywords: ['kaval byrasandra', 'rt nagar post', 'dinnur', 'sultanpalya main road', 'ambedkar layout', 'shampura cross']
  },
  {
    wardNo: 33,
    nameEn: 'Manorayanapalya',
    nameKn: 'ಮನೋರಾಯನಪಾಳ್ಯ',
    zone: 'East',
    keywords: ['manorayanapalya', 'sulthanpalya', 'rt nagar', 'dinnur', 'hmt layout rt nagar', 'matadahalli']
  },
  {
    wardNo: 34,
    nameEn: 'Gangenahalli',
    nameKn: 'ಗಂಗೇನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['gangenahalli', 'mekhri circle', 'dinnur', 'palace cross road', 'jayachamarajendra nagar post', 'vimanapura']
  },
  {
    wardNo: 46,
    nameEn: 'Jayachamarajendra Nagar',
    nameKn: 'ಜಯಚಾಮರಾಜೇಂದ್ರ ನಗರ',
    zone: 'East',
    keywords: ['jc nagar', 'munireddy palya', 'tannery road', 'nandidurga road', 'chinna garden', 'tv tower junction']
  },
  {
    wardNo: 47,
    nameEn: 'Devara Jeevanahalli',
    nameKn: 'ದೇವರ ಜೀವನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['dj halli', 'devara jeevanahalli', 'tannery road', 'modi road', 'railway parallel road dj halli']
  },
  {
    wardNo: 48,
    nameEn: 'Muneshwara Nagar',
    nameKn: 'ಮುನೇಶ್ವರ ನಗರ',
    zone: 'East',
    keywords: ['muneshwara nagar', 'lingarajapuram', 'oil mill road', 'kamanahalli post', 'st thomas town station']
  },
  {
    wardNo: 49,
    nameEn: 'Lingarajapura',
    nameKn: 'ಲಿಂಗರಾಜಪುರ',
    zone: 'East',
    keywords: ['lingarajapuram', 'kammanahalli', 'st thomas town', 'lingarajapuram flyover', 'oil mill road', 'hennur main road']
  },
  {
    wardNo: 50,
    nameEn: 'Benniganahalli',
    nameKn: 'ಬೆನ್ನಿಗಾನಹಳ್ಳಿ',
    zone: 'East',
    keywords: ['benniganahalli', 'kasturi nagar', 'old madras road', 'tin factory', 'benniganahalli metro station', 'pai layout', 'channasandra main road']
  },
  {
    wardNo: 57,
    nameEn: 'C V Raman Nagar',
    nameKn: 'ಸಿ ವಿ ರಾಮನ್ ನಗರ',
    zone: 'East',
    keywords: ['cv raman nagar', 'kaggadasapura', 'drdo township', 'bagmane tech park', 'binnamangala', 'ade township', 'lcs layout']
  },
  {
    wardNo: 58,
    nameEn: 'New Tippasandra',
    nameKn: 'ಹೊಸ ತಿಪ್ಪಸಂದ್ರ',
    zone: 'East',
    keywords: ['thippasandra', 'tippasandra', 'gm palya', 'indiranagar 3rd stage', 'bemo layout', 'tippasandra 80ft road', 'geetanjali layout']
  },
  {
    wardNo: 59,
    nameEn: 'Maruthi Seva Nagar',
    nameKn: 'ಮಾರುತಿ ಸೇವಾ ನಗರ',
    zone: 'East',
    keywords: ['maruthi sevanagar', 'banaswadi', 'cooke town', 'kammanahalli', 'banaswadi main road', 'jai bharath nagar', 'dodda banaswadi']
  },
  {
    wardNo: 60,
    nameEn: 'Sagayara Puram',
    nameKn: 'ಸಗಾಯಾರ ಪುರಂ',
    zone: 'East',
    keywords: ['sagayapuram', 'richards town', 'frazer town', 'mosque road boundary', 'davis road', 'cooke town boundary']
  },
  {
    wardNo: 61,
    nameEn: 'S K Garden',
    nameKn: 'ಎಸ್ ಕೆ ಗಾರ್ಡನ್',
    zone: 'East',
    keywords: ['sk garden', 'benson town', 'frazer town', 'millers tank bund road', 'benson cross road', 'cantonment railway station']
  },
  {
    wardNo: 62,
    nameEn: 'Ramaswamy Palya',
    nameKn: 'ರಾಮಸ್ವಾಮಿ ಪಾಳ್ಯ',
    zone: 'East',
    keywords: ['ramaswamypalya', 'kammanahalli', 'cooke town', 'oil mill road', 'wheelers road extension', 'st thomas town']
  },
  {
    wardNo: 63,
    nameEn: 'Jayamahal',
    nameKn: 'ಜಯಮಹಲ್',
    zone: 'East',
    keywords: ['jayamahal', 'benson town', 'palace grounds', 'nandidurga road', 'jayamahal extension', 'munireddy palya', 'fun world junction']
  },
  {
    wardNo: 78,
    nameEn: 'Pulakeshi Nagar',
    nameKn: 'ಪುಲಕೇಶಿ ನಗರ',
    zone: 'East',
    keywords: ['frazer town', 'pulakeshinagar', 'mosque road', 'coles park', 'cleveland town', 'spencer road', 'thomson road', 'albert bakery']
  },
  {
    wardNo: 79,
    nameEn: 'Sarvagna Nagar',
    nameKn: 'ಸರ್ವಜ್ಞ ನಗರ',
    zone: 'East',
    keywords: ['sarvagnanagar', 'cox town', 'richards town', 'wheeler road', 'itc factory flyover', 'cooke town', 'thomas cafe circle']
  },
  {
    wardNo: 80,
    nameEn: 'Hoysala Nagar (Indiranagar)',
    nameKn: 'ಹೊಯ್ಸಳ ನಗರ (ಇಂದಿರಾನಗರ)',
    zone: 'East',
    keywords: ['indiranagar', '100ft road', '12th main', 'cmh road', 'hoysala nagar', 'indiranagar metro station', 'binnamangala', 'chinmaya mission hospital']
  },
  {
    wardNo: 87,
    nameEn: 'HAL 2nd Stage (Indiranagar)',
    nameKn: 'ಎಚ್.ಎ.ಎಲ್ ೨ನೇ ಹಂತ',
    zone: 'East',
    keywords: ['hal 2nd stage', 'indiranagar', '100 feet road', 'defence colony', 'doopanahalli', 'kodihalli', 'domlur flyover junction', 'esic hospital indiranagar']
  },
  {
    wardNo: 88,
    nameEn: 'Jeevanbhima Nagar',
    nameKn: 'ಜೀವನ್ಭೀಮಾ ನಗರ',
    zone: 'East',
    keywords: ['jb nagar', 'jeevanbhimanagar', 'kodihalli', 'hal 3rd stage', 'suranjan das road', 'lic colony', 'nal road', 'leela palace junction']
  },
  {
    wardNo: 89,
    nameEn: 'Jogupalya',
    nameKn: 'ಜೋಗುಪಾಳ್ಯ',
    zone: 'East',
    keywords: ['jogupalya', 'halasuru', 'ulsoor', 'indiranagar 1st stage', 'cambridge layout', 'someshwara temple ulsoor', 'swami vivekananda road metro']
  },
  {
    wardNo: 90,
    nameEn: 'Halasuru (Ulsoor)',
    nameKn: 'ಹಲಸೂರು',
    zone: 'East',
    keywords: ['ulsoor', 'halasuru lake', 'someshwara temple', 'bazaar street', 'cmh road', 'halasuru metro station', 'trinity circle boundary', 'kensington road']
  },
  {
    wardNo: 91,
    nameEn: 'Bharathi Nagar',
    nameKn: 'ಭಾರತಿ ನಗರ',
    zone: 'East',
    keywords: ['bharathinagar', 'shivajinagar', 'commercial street', 'tasker town', 'safina plaza', 'infantry road', 'narayan pillai street']
  },
  {
    wardNo: 92,
    nameEn: 'Shivaji Nagar',
    nameKn: 'ಶಿವಾಜಿ ನಗರ',
    zone: 'East',
    keywords: ['shivajinagar', 'russell market', 'bowring hospital', 'lady curzon', 'st marys basilica', 'shivajinagar bus stand', 'broadway']
  },
  {
    wardNo: 93,
    nameEn: 'Vasanth Nagar',
    nameKn: 'ವಸಂತ ನಗರ',
    zone: 'East',
    keywords: ['vasanth nagar', 'cunningham road', 'millers road', 'cantonment station', 'mount carmel college', 'palace road', 'golf course', 'balabrooie guest house']
  },
  {
    wardNo: 110,
    nameEn: 'Sampangiramanagar',
    nameKn: 'ಸಂಪಂಗಿರಾಮನಗರ',
    zone: 'East',
    keywords: ['sampangiramanagar', 'kanteerava stadium', 'kasturba road', 'cubbon park', 'vidhana soudha', 'chancery pavilion', 'mission road']
  },
  {
    wardNo: 111,
    nameEn: 'Shanthala Nagar (MG Road)',
    nameKn: 'ಶಾಂತಲಾ ನಗರ (ಎಂ.ಜಿ ರಸ್ತೆ)',
    zone: 'East',
    keywords: ['mg road', 'brigade road', 'residency road', 'richmond town', 'ashok nagar', 'ub city', 'lavelle road', 'museum road', 'garuda mall', 'mg road metro']
  },
  {
    wardNo: 112,
    nameEn: 'Domlur',
    nameKn: 'ದೊಮ್ಲೂರು',
    zone: 'East',
    keywords: ['domlur', 'egl', 'embassy golf links', 'domlur layout', 'amarjyoti layout', 'domlur club', 'old airport road domlur', 'inner ring road domlur']
  },
  {
    wardNo: 113,
    nameEn: 'Konena Agrahara',
    nameKn: 'ಕೋನೇನ ಅಗ್ರಹಾರ',
    zone: 'East',
    keywords: ['konena agrahara', 'murugeshpalya', 'old airport road', 'isro', 'manipal hospital old airport road', 'kemp fort mall', 'vinayaka nagar konena']
  },
  {
    wardNo: 114,
    nameEn: 'Agaram',
    nameKn: 'ಅಗರಂ',
    zone: 'East',
    keywords: ['agaram', 'austin town', 'neelasandra', 'viveknagar', 'asc centre', 'agaram firing range', 'anepalya', 'victoria layout']
  },
  {
    wardNo: 115,
    nameEn: 'Vannarpet',
    nameKn: 'ವನ್ನಾರ್ಪೇಟೆ',
    zone: 'East',
    keywords: ['vannarpet', 'viveka nagar', 'austin town', 'ejipura', 'infant jesus church', 'bazaar street vannarpet', 'rose garden']
  },
  {
    wardNo: 116,
    nameEn: 'Neelasandra',
    nameKn: 'ನೀಲಸಂದ್ರ',
    zone: 'East',
    keywords: ['neelasandra', 'shanthinagar', 'austin town', 'viveknagar', 'anepalya junction', 'gajendra nagar', 'dr ambedkar nagar neelasandra']
  },
  {
    wardNo: 117,
    nameEn: 'Shanthinagar',
    nameKn: 'ಶಾಂತಿನಗರ',
    zone: 'East',
    keywords: ['shanthinagar', 'double road', 'koramangala 3rd block', 'richmond town', 'shanthinagar bus stand', 'kh road', 'langford town', 'langford gardens', 'akkithimmanahalli']
  },

  // --- MAHADEVAPURA ZONE (Wards 25–26, 51–56, 81–86, 149–150) ---
  {
    wardNo: 25,
    nameEn: 'Horamavu',
    nameKn: 'ಹೊರಮಾವು',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['horamavu', 'horamavu agara', 'kr pura', 'k r pura', 'banaswadi', 'kalkere', 'nanjappa garden', 'jayanthinagar', 'horamavu main road', 'babusapalya']
  },
  {
    wardNo: 26,
    nameEn: 'Ramamurthy Nagar',
    nameKn: 'ರಾಮಮೂರ್ತಿ ನಗರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['ramamurthy nagar', 'kasturi nagar', 'kr pura', 'k r pura', 'tc palya', 'kowdenahalli', 'raghavendra nagar', 'iti layout rm nagar', 'erannapalya']
  },
  {
    wardNo: 51,
    nameEn: 'Vijnanapura',
    nameKn: 'ವಿಜ್ಞಾನಪುರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['vijnanapura', 'dooravani nagar', 'iti colony', 'kr puram', 'k r pura', 'kr pura', 'drdo phase 2', 'mahadevapura flyover junction']
  },
  {
    wardNo: 52,
    nameEn: 'K R Pura',
    nameKn: 'ಕೆ ಆರ್ ಪುರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['kr puram', 'krishnarajapuram', 'k r pura', 'kr pura', 'iti gate', 'tc palya cross', 'kr puram railway station', 'kr puram hanging bridge', 'kr puram metro']
  },
  {
    wardNo: 53,
    nameEn: 'Basavanapura',
    nameKn: 'ಬಸವನಪುರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['basavanapura', 'k r pura', 'kr pura', 'kr puram', 'krishnarajapuram', 'battarahalli', 'seegehalli', 'devasandra', 'tc palya main road', 'ayappa nagar', 'medahalli cross']
  },
  {
    wardNo: 54,
    nameEn: 'Hudi',
    nameKn: 'ಹೂಡಿ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['hoodi', 'hudi', 'itpl road', 'kr pura', 'k r pura', 'whitefield', 'sadaramangala', 'hoodi metro station', 'seetharampalya', 'kodigehalli main road hoodi']
  },
  {
    wardNo: 55,
    nameEn: 'Devasandra',
    nameKn: 'ದೇವಸಂದ್ರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['devasandra', 'kr puram', 'k r pura', 'kr pura', 'kasturi nagar', 'rhb colony', 'devasandra main road', 'chikkadevasandra']
  },
  {
    wardNo: 56,
    nameEn: 'A Narayanapura',
    nameKn: 'ಎ ನಾರಾಯಣಪುರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['narayanapura', 'mahadevapura', 'kr pura', 'k r pura', 'drdo phase 1', 'kaggadasapura', 'singayyanapalya metro', 'garudacharpalya', 'phoenix marketcity']
  },
  {
    wardNo: 81,
    nameEn: 'Vijnana Nagar',
    nameKn: 'ವಿಜ್ಞಾನ ನಗರ',
    zone: 'Mahadevapura',
    subZone: 'K R Pura',
    keywords: ['vijnana nagar', 'kaggadasapura', 'kr pura', 'k r pura', 'malleshpalya', 'gm palya', 'jagadish nagar', 'b narayanapura', 'veranna palya']
  },
  {
    wardNo: 82,
    nameEn: 'HAL Airport',
    nameKn: 'ಎಚ್.ಎ.ಎಲ್ ವಿಮಾನ ನಿಲ್ದಾಣ',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['hal airport', 'murugeshpalya', 'wind tunnel road', 'old airport road', 'challaghatta', 'yamalur', 'bellandur lake north', 'embassy golf links rear']
  },
  {
    wardNo: 83,
    nameEn: 'Kadugodi',
    nameKn: 'ಕಾಡುಗೋಡಿ',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['kadugodi', 'hope farm', 'whitefield railway station', 'channasandra', 'kadugodi tree park metro', 'belathur', 'kumbena agrahara', 'seegehalli kadugodi']
  },
  {
    wardNo: 84,
    nameEn: 'Hagadur (Whitefield)',
    nameKn: 'ಹಗದೂರು (ವೈಟ್ಫೀಲ್ಡ್)',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['whitefield', 'hagadur', 'itpl', 'forum value mall', 'hopefarm', 'immadihalli', 'pattandur agrahara', 'prestige shantiniketan', 'vydehi hospital', 'itpl metro station']
  },
  {
    wardNo: 85,
    nameEn: 'Dodda Nekkundi',
    nameKn: 'ದೊಡ್ಡ ನೆಕ್ಕುಂದಿ',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['doddanekundi', 'marathahalli', 'kartik nagar', 'outer ring road', 'fern city', 'bagmane constellation tech park', 'mahaveer tuscan', 'chinappanahalli lake']
  },
  {
    wardNo: 86,
    nameEn: 'Marathahalli',
    nameKn: 'ಮಾರತ್ಹಳ್ಳಿ',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['marathahalli', 'marathahalli bridge', 'kalamandir', 'sanjay chs', 'spice garden', 'munnekolala', 'kundalahalli gate', 'brookefield', 'aecs layout']
  },
  {
    wardNo: 149,
    nameEn: 'Varthuru',
    nameKn: 'ವರ್ತೂರು',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['varthur', 'varthur lake', 'gunjur', 'panathur', 'balagere', 'sorahunase', 'varthur police station', 'valepura', 'kk english school varthur']
  },
  {
    wardNo: 150,
    nameEn: 'Bellanduru',
    nameKn: 'ಬೆಳ್ಳಂದೂರು',
    zone: 'Mahadevapura',
    subZone: 'Mahadevapura',
    keywords: ['bellandur', 'ecospace', 'outer ring road', 'green glen layout', 'sarjapur road', 'devarabisanahalli', 'kadubeesanahalli', 'cessna business park', 'rmz ecoworld', 'kasavanahalli']
  },

  // --- WEST ZONE (Wards 35–36, 43–45, 64–68, 74–77, 94–96, 97–101, 102, 107–109, 120–121, 135–141) ---
  {
    wardNo: 35,
    nameEn: 'Aramane Nagara',
    nameKn: 'ಅರಮನೆ ನಗರ',
    zone: 'West',
    keywords: ['palace ghattahalli', 'sadashivanagar', 'sankey tank', 'bellary road', 'iisc bangalore', 'indian institute of science', 'bashyam circle sadashivanagar', 'upper palace orchards']
  },
  {
    wardNo: 36,
    nameEn: 'Mattikere',
    nameKn: 'ಮತ್ತೀಕೆರೆ',
    zone: 'West',
    keywords: ['mathikere', 'msr college', 'gokula', 'yeshwantpur', 'ms ramaiah hospital', 'msrit', 'mathikere lake', 'kamala nehru extension']
  },
  {
    wardNo: 43,
    nameEn: 'Nandini Layout',
    nameKn: 'ನಂದಿನಿ ಬಡಾವಣೆ',
    zone: 'West',
    keywords: ['nandini layout', 'mahalakshmi layout', 'west of chord road', 'saraswathipuram', 'kanteerava studio', 'nandini layout circle', 'mahaganapathi nagar']
  },
  {
    wardNo: 44,
    nameEn: 'Marappana Palya',
    nameKn: 'ಮಾರಪ್ಪನ ಪಾಳ್ಯ',
    zone: 'West',
    keywords: ['marappana palya', 'mahalakshmi layout', 'nandini layout', 'gordhandas layout', 'yeshwanthpur industry', 'national public school yeshwantpur']
  },
  {
    wardNo: 45,
    nameEn: 'Malleshwaram',
    nameKn: 'ಮಲ್ಲೇಶ್ವರಂ',
    zone: 'West',
    keywords: ['malleshwaram', '8th cross', '18th cross', 'sampige road', 'margosa road', 'ctr benne dosa', 'veena stores', 'malleshwaram circle', 'kuvempu road']
  },
  {
    wardNo: 64,
    nameEn: 'Rajamahal',
    nameKn: 'ರಾಜಮಹಲ್',
    zone: 'West',
    keywords: ['rajamahal', 'malleshwaram', 'kadu malleshwara', 'rajamahal vilas', 'rmv 1st stage', 'sankey tank west', 'malleswaram railway station']
  },
  {
    wardNo: 65,
    nameEn: 'Kadumalleshwara',
    nameKn: 'ಕಡುಮಲ್ಲೇಶ್ವರ',
    zone: 'West',
    keywords: ['kadumalleshwara', 'malleshwaram', '17th cross', 'kadu mallikarjuna temple', 'nandi theertha', 'west park road', 'east park road']
  },
  {
    wardNo: 66,
    nameEn: 'Subramanya Nagar',
    nameKn: 'ಸುಬ್ರಹ್ಮಣ್ಯ ನಗರ',
    zone: 'West',
    keywords: ['subramanyanagar', 'rajajinagar', 'isckon temple', 'brigade gateway', 'orion mall', 'sandal soap factory metro', 'mahalakshmi metro station']
  },
  {
    wardNo: 67,
    nameEn: 'Nagapura',
    nameKn: 'ನಾಗಪುರ',
    zone: 'West',
    keywords: ['nagapura', 'mahalakshmi layout', 'iskcon temple', 'mahalakshmi temple hill', 'west of chord road nagapura', 'modi hospital road']
  },
  {
    wardNo: 68,
    nameEn: 'Mahalakshmipuram',
    nameKn: 'ಮಹಾಲಕ್ಷ್ಮಿಪುರಂ',
    zone: 'West',
    keywords: ['mahalakshmi layout', 'swimming pool', 'kurubarahalli', 'shankara mutt mahalakshmi', 'srinivasa nagar mahalakshmi', 'geetha colony']
  },
  {
    wardNo: 74,
    nameEn: 'Shakthiganapathi Nagar',
    nameKn: 'ಶಕ್ತಿಗಣಪತಿನಗರ',
    zone: 'West',
    keywords: ['shakthiganapathinagar', 'mahalakshmi layout', 'nagapura', 'kamalamma layout', 'kurubarahalli circle', 'basaveshwaranagar east']
  },
  {
    wardNo: 75,
    nameEn: 'Shankara Matha',
    nameKn: 'ಶಂಕರ ಮಠ',
    zone: 'West',
    keywords: ['shankara matha', 'mahalakshmi layout', 'nagapura', 'shankara mutt basaveshwaranagar', 'kurubarahalli pipe line', 'gruhalakshmi layout']
  },
  {
    wardNo: 76,
    nameEn: 'Gayathrinagar',
    nameKn: 'ಗಾಯತ್ರಿನಗರ',
    zone: 'West',
    keywords: ['gayathrinagar', 'malleshwaram', 'rajajinagar', 'hariram layout', 'swatantra palya', 'srirampura boundary']
  },
  {
    wardNo: 77,
    nameEn: 'Dattathreya Temple',
    nameKn: 'ದತ್ತಾತ್ರೇಯ ದೇವಸ್ಥಾನ',
    zone: 'West',
    keywords: ['dattathreya temple', 'gandhinagar', 'okalipuram', 'malleshwaram 1st cross', 'sheshadripuram college', 'link road sheshadripuram']
  },
  {
    wardNo: 94,
    nameEn: 'Gandhinagar',
    nameKn: 'ಗಾಂಧಿನಗರ',
    zone: 'West',
    keywords: ['gandhinagar', 'majestic', 'anand rao circle', 'subedhar chatram road', 'tribhuvan theatre', 'race course road', 'freedom park']
  },
  {
    wardNo: 95,
    nameEn: 'Subhashnagar',
    nameKn: 'ಸುಭಾಷನಗರ',
    zone: 'West',
    keywords: ['subhashnagar', 'gandhinagar', 'majestic', 'kempegowda bus station', 'ksrtc central bus stand', 'sangam theatre', 'majestic metro']
  },
  {
    wardNo: 96,
    nameEn: 'Okalipuram',
    nameKn: 'ಓಕಲಿಪುರಂ',
    zone: 'West',
    keywords: ['okalipuram', 'gandhinagar', 'sujatha theatre', 'majestic', 'krantivira sangolli rayanna station', 'bangalore city railway station', 'gopalapura']
  },
  {
    wardNo: 97,
    nameEn: 'Dayananda Nagar',
    nameKn: 'ದಯಾನಂದ ನಗರ',
    zone: 'West',
    keywords: ['dayanandanagar', 'rajajinagar 1st block', 'prakashnagar', 'harishchandra ghat', 'subramanya nagar post']
  },
  {
    wardNo: 98,
    nameEn: 'Prakash Nagar',
    nameKn: 'ಪ್ರಕಾಶ್ ನಗರ',
    zone: 'West',
    keywords: ['prakashnagar', 'rajajinagar', 'dr rajkumar road', 'prakash nagar metro', 'dr ambedkar nagar', 'gayathri nagar post']
  },
  {
    wardNo: 99,
    nameEn: 'Rajajinagar',
    nameKn: 'ರಾಜಾಜಿನಗರ',
    zone: 'West',
    keywords: ['rajajinagar', 'navrang circle', 'bashyam circle', 'dr rajkumar road', 'rajajinagar 2nd block', 'rajajinagar 3rd block', 'rajajinagar 4th block', 'rajajinagar 5th block', 'rajajinagar metro', 'esi hospital rajajinagar']
  },
  {
    wardNo: 100,
    nameEn: 'Basaveshwara Nagar',
    nameKn: 'ಬಸವೇಶ್ವರ ನಗರ',
    zone: 'West',
    keywords: ['basaveshwaranagar', 'bhavani nagar', 'khb colony', 'shankara mutt', 'saneguruvanahalli', 'basaveshwaranagar 3rd stage', 'water tank basaveshwaranagar']
  },
  {
    wardNo: 101,
    nameEn: 'Kamakshipalya',
    nameKn: 'ಕಾಮಾಕ್ಷಿಪಾಳ್ಯ',
    zone: 'West',
    keywords: ['kamakshipalya', 'magadi road', 'vijayanagar 2nd stage', 'kamakshipalya police station', 'kaveripura cross', 'saraswathi nagar']
  },
  {
    wardNo: 102,
    nameEn: 'Vrishabhavathi',
    nameKn: 'ವೃಷಭಾವತಿ',
    zone: 'West',
    keywords: ['vrishabhavathi', 'kamakshipalya', 'magadi road', 'vrishabhavathi valley', 'shivananda nagar', 'saneguruvanahalli south']
  },
  {
    wardNo: 107,
    nameEn: 'Shivanagar',
    nameKn: 'ಶಿವನಗರ',
    zone: 'West',
    keywords: ['shivanagar', 'rajajinagar', 'modi hospital', 'rajajinagar 6th block', 'manjunathanagar', 'west of chord road shivanagar']
  },
  {
    wardNo: 108,
    nameEn: 'Srirama Mandir',
    nameKn: 'ಶ್ರೀರಾಮ ಮಂದಿರ',
    zone: 'West',
    keywords: ['srirama mandir', 'rajajinagar', 'prakashnagar', 'rajajinagar 1st block n block', 'sri rama mandira temple', 'dr rajkumar road south']
  },
  {
    wardNo: 109,
    nameEn: 'Chickpete',
    nameKn: 'ಚಿಕ್ಕಪೇಟೆ',
    zone: 'West',
    keywords: ['chickpet', 'avenue road', 'balepet', 'mamulpet', 'chickpete metro station', 'bvk iyengar road', 'sultanpet', 'raja market']
  },
  {
    wardNo: 120,
    nameEn: 'Cottonpet',
    nameKn: 'ಕಾಟನ್ಪೇಟೆ',
    zone: 'West',
    keywords: ['cottonpet', 'majestic', 'akkipet', 'city railway station', 'cottonpet main road', 'ranasinghpet', 'mysore road entry']
  },
  {
    wardNo: 121,
    nameEn: 'Binnipete',
    nameKn: 'ಬಿನ್ನಿಪೇಟೆ',
    zone: 'West',
    keywords: ['binnipete', 'majestic', 'city railway station', 'okalipuram', 'binny mills', 'eta mall', 'sirsi circle', 'anjeneya temple binnypet']
  },
  {
    wardNo: 135,
    nameEn: 'Padarayanapura',
    nameKn: 'ಪಾದರಾಯಣಪುರ',
    zone: 'West',
    keywords: ['padarayanapura', 'chamrajpet', 'mysore road', 'goripalya', 'padarayanapura 8th main', 'jj r nagar boundary']
  },
  {
    wardNo: 136,
    nameEn: 'Jagjivanram Nagar',
    nameKn: 'ಜಗಜೀವನರಾಮ ನಗರ',
    zone: 'West',
    keywords: ['jagjivanram nagar', 'chamrajpet', 'rayapuram', 'jj nagar police station', 'valmiki nagar', 'mysore road bridge']
  },
  {
    wardNo: 137,
    nameEn: 'Rayapuram',
    nameKn: 'ರಾಯಪುರಂ',
    zone: 'West',
    keywords: ['rayapuram', 'chamrajpet', 'city railway station', 'sirsi road', 'binny layout', 'mysore road tollgate']
  },
  {
    wardNo: 138,
    nameEn: 'Chalavadipalya',
    nameKn: 'ಚಲವಾಡಿಪಾಳ್ಯ',
    zone: 'West',
    keywords: ['chalavadipalya', 'chamrajpet', 'kr market', 'tipu sultan summer palace', 'kalasipalyam new extension', 'victoria hospital boundary']
  },
  {
    wardNo: 139,
    nameEn: 'Krishnarajendra Market',
    nameKn: 'ಕೃಷ್ಣರಾಜೇಂದ್ರ ಮಾರ್ಕೆಟ್',
    zone: 'West',
    keywords: ['kr market', 'city market', 'kalasipalya', 'victoria hospital', 'kr market metro station', 'bangalore fort', 'vanivilas hospital', 'bmc medical college']
  },
  {
    wardNo: 140,
    nameEn: 'Chamarajapet',
    nameKn: 'ಚಾಮರಾಜಪೇಟೆ',
    zone: 'West',
    keywords: ['chamarajpet', 'bull temple road', '5th main', 'minto hospital', 'chamarajpet 1st main', 'chamarajpet 4th main', 'kannada sahitya parishat', 'uma theatre']
  },
  {
    wardNo: 141,
    nameEn: 'Azadnagar',
    nameKn: 'ಆಜಾದ್ನಗರ',
    zone: 'West',
    keywords: ['azad nagar', 'telecom layout', 'chamarajpet west', 'kaval byrasandra road', 'deepanjali nagar east', 'kasturba nagar']
  },

  // --- SOUTH ZONE (Wards 103–106, 118–119, 122–128, 131–134, 142–148, 151–158, 161–171, 172–173, 176, 184–185) ---
  {
    wardNo: 103,
    nameEn: 'Kaveripura',
    nameKn: 'ಕಾವೇರಿಪುರ',
    zone: 'South',
    keywords: ['kaveripura', 'govindarajanagar', 'magadi road', 'kamakshipalya south', 'prashanth nagar', 'kaveripura 7th cross']
  },
  {
    wardNo: 104,
    nameEn: 'Govindarajanagar',
    nameKn: 'ಗೋವಿಂದರಾಜನಗರ',
    zone: 'South',
    keywords: ['govindaraj nagar', 'vijayanagar', 'chord road', 'govindarajanagar metro', 'service road vijayanagar', 'm c layout']
  },
  {
    wardNo: 105,
    nameEn: 'Agrahara Dasarahalli',
    nameKn: 'ಅಗ್ರಹಾರ ದಾಸರಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['agrahara dasarahalli', 'govindarajanagar', 'magadi road', 'toll gate magadi road', 'dr rajkumar road junction', 'vijayanagar pipeline']
  },
  {
    wardNo: 106,
    nameEn: 'Dr Rajkumar',
    nameKn: 'ಡಾ. ರಾಜ್ಕುಮಾರ್',
    zone: 'South',
    keywords: ['dr rajkumar', 'govindarajanagar', 'chandra layout', 'kalyana nagar moodalapalya', 'bapuji layout govindarajanagar']
  },
  {
    wardNo: 118,
    nameEn: 'Sudham Nagar',
    nameKn: 'ಸುಧಾಮ್ ನಗರ',
    zone: 'South',
    keywords: ['sudhama nagar', 'wilson garden', 'lalbagh road', 'double road', 'urvashi theatre', 'lalbagh main gate', 'subbaiah circle', 'nimhans boundary']
  },
  {
    wardNo: 119,
    nameEn: 'Dharmaraya Swamy Temple',
    nameKn: 'ಧರ್ಮರಾಯ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
    zone: 'South',
    keywords: ['thigalarpet', 'nagarathpet', 'chickpet', 'otc road', 'karaga temple', 'kumbarpet', 'ranasinghpet east', 'cubbonpet']
  },
  {
    wardNo: 122,
    nameEn: 'Kempapura Agrahara',
    nameKn: 'ಕೆಂಪಾಪುರ ಅಗ್ರಹಾರ',
    zone: 'South',
    keywords: ['kempapura agrahara', 'vijayanagar', 'hampinagar', 'magadi road metro', 'hosahalli metro', 'leprosy hospital magadi road']
  },
  {
    wardNo: 123,
    nameEn: 'Vijayanagar',
    nameKn: 'ವಿಜಯನಗರ',
    zone: 'South',
    keywords: ['vijayanagar', 'maruthi mandir', 'ttmc bus station', 'pipeline road', 'vijayanagar metro station', 'rpc layout vijayanagar', 'club road vijayanagar', 'mc layout']
  },
  {
    wardNo: 124,
    nameEn: 'Hosahalli',
    nameKn: 'ಹೊಸಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['hosahalli', 'vijayanagar 1st stage', 'chord road', 'hosahalli metro station', 'vijayanagar water tank', 'chandra layout entry']
  },
  {
    wardNo: 125,
    nameEn: 'Marenahalli',
    nameKn: 'ಮಾರೆನಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['marenahalli', 'vijayanagar', 'rpc layout', 'hampi nagar 2nd stage', 'vijayanagar club', 'maruthi mandira road']
  },
  {
    wardNo: 126,
    nameEn: 'Maruthi Mandira',
    nameKn: 'ಮಾರುತಿ ಮಂದಿರ',
    zone: 'South',
    keywords: ['maruthi mandira', 'govindarajanagar', 'chandra layout', 'maruthi mandir vijayanagar', 'vijayanagar 2nd stage pipeline', 'income tax layout']
  },
  {
    wardNo: 127,
    nameEn: 'Moodalapalya',
    nameKn: 'ಮೂಡಲಪಾಳ್ಯ',
    zone: 'South',
    keywords: ['moodalapalya', 'govindarajanagar', 'chandra layout', 'moodalapalya circle', 'kalyananagar', 'nagarabhavi main road', 'shivaramaiah layout']
  },
  {
    wardNo: 128,
    nameEn: 'Nagarabhavi',
    nameKn: 'ನಾಗರಭಾವಿ',
    zone: 'South',
    keywords: ['nagarabhavi', 'chandra layout', 'bangalore university', 'nagarabhavi 1st stage', 'nagarabhavi circle', 'bdit college', 'kle law college', 'dr ambedkar institute of technology']
  },
  {
    wardNo: 131,
    nameEn: 'Nayandahalli',
    nameKn: 'ನಾಯಂಡಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['nayandahalli', 'mysore road', 'metro station', 'pantarpalya', 'nayandahalli junction', 'outer ring road nayandahalli', 'mysore road satellite bus station']
  },
  {
    wardNo: 132,
    nameEn: 'Attiguppe',
    nameKn: 'ಅತ್ತಿಗುಪ್ಪೆ',
    zone: 'South',
    keywords: ['attiguppe', 'vijayanagar', 'hampinagar', 'gali anjaneya', 'attiguppe metro station', 'vijayanagar 3rd stage', 'chandra layout 1st stage']
  },
  {
    wardNo: 133,
    nameEn: 'Hampinagar',
    nameKn: 'ಹಂಪಿನಗರ',
    zone: 'South',
    keywords: ['hampinagar', 'vijayanagar', 'attiguppe', 'rpc layout hampinagar', 'dr rajkumar park hampinagar', 'subbanna garden']
  },
  {
    wardNo: 134,
    nameEn: 'Bapujinagar',
    nameKn: 'ಬಾಪೂಜಿನಗರ',
    zone: 'South',
    keywords: ['bapujinagar', 'vijayanagar', 'deepanjalinagar', 'mysore road bapujinagar', 'new guddadahalli', 'padarayanapura south']
  },
  {
    wardNo: 142,
    nameEn: 'Sunkenahalli',
    nameKn: 'ಸುಂಕೇನಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['sunkenahalli', 'gandhi bazaar', 'basavanagudi', 'bull temple', 'doddaganeshana gudi', 'bms college of engineering', 'bugle rock', 'tagore circle']
  },
  {
    wardNo: 143,
    nameEn: 'Visvesvarapuram',
    nameKn: 'ವಿಶ್ವೇಶ್ವರಪುರಂ',
    zone: 'South',
    keywords: ['vv puram', 'food street', 'sajjan rao circle', 'basavanagudi', 'kr road', 'national college metro', 'vanivilas road', 'shankarpuram']
  },
  {
    wardNo: 144,
    nameEn: 'Siddapura',
    nameKn: 'ಸಿದ್ಧಾಪುರ',
    zone: 'South',
    keywords: ['siddapura', 'jayanagar 1st block', 'ashoka pillar', 'lalbagh west', 'siddapura police station', 'byrasandra main road', 'lalbagh south gate']
  },
  {
    wardNo: 145,
    nameEn: 'Hombegowda Nagar',
    nameKn: 'ಹೊಂಬೇಗೌಡ ನಗರ',
    zone: 'South',
    keywords: ['hombegowda nagar', 'wilson garden', 'dairy circle', 'nimhans', 'dr ambedkar medical institute', 'brand factory wilson garden', 'hosur road']
  },
  {
    wardNo: 146,
    nameEn: 'Lakkasandra',
    nameKn: 'ಲಕ್ಕಸಂದ್ರ',
    zone: 'South',
    keywords: ['lakkasandra', 'wilson garden', 'drdo', 'audugodi', 'lakkasandra metro', 'wilson garden 10th cross', 'drdo residential complex']
  },
  {
    wardNo: 147,
    nameEn: 'Adugodi',
    nameKn: 'ಆಡುಗೋಡಿ',
    zone: 'South',
    keywords: ['adugodi', 'bosch', 'dairy circle', 'koramangala 8th block', 'mico layout', 'nanjappa layout adugodi', 'police quarters adugodi', 'forum mall junction']
  },
  {
    wardNo: 148,
    nameEn: 'Ejipura',
    nameKn: 'ಈಜಿಪುರ',
    zone: 'South',
    keywords: ['ejipura', 'sony world', 'koramangala ring road', 'vivek nagar', 'ejipura flyover', 'srinivagilu', 'koramangala intermediate ring road']
  },
  {
    wardNo: 151,
    nameEn: 'Koramangala',
    nameKn: 'ಕೋರಮಂಗಲ',
    zone: 'South',
    keywords: ['koramangala', 'forum mall', '1st block', '2nd block', '3rd block', '4th block', '5th block', '6th block', '7th block', '8th block', '80 feet road', 'sony world signal', 'raheja arcade', 'jyoti nivas college', 'koramangala club']
  },
  {
    wardNo: 152,
    nameEn: 'Suddagunte Palya',
    nameKn: 'ಸುದ್ದಗುಂಟೆ ಪಾಳ್ಯ',
    zone: 'South',
    keywords: ['sg palya', 'christ university', 'bhavani nagar', 'tavarekere', 'hosur road', 'maruthi nagar sg palya', 'nexus koramangala mall', 'bhuvaneshwari nagar']
  },
  {
    wardNo: 153,
    nameEn: 'Jayanagar',
    nameKn: 'ಜಯನಗರ',
    zone: 'South',
    keywords: ['jayanagar', 'jayanagar 3rd block', 'jayanagar 4th block', 'jayanagar shopping complex', 'south end circle', 'jayanagar metro station', 'cool joint', 'maiayas']
  },
  {
    wardNo: 154,
    nameEn: 'Basavanagudi',
    nameKn: 'ಬಸವನಗುಡಿ',
    zone: 'South',
    keywords: ['basavanagudi', 'durgigudi', 'netkallappa circle', 'tagore circle', 'national college', 'gandhi bazaar main road', 'vidyarthi bhavan', 'mnkr park']
  },
  {
    wardNo: 155,
    nameEn: 'Hanumanth Nagar',
    nameKn: 'ಹನುಮಂತ ನಗರ',
    zone: 'South',
    keywords: ['hanumanthanagar', 'kumaraswamy layout', 'mount joy', 'ashoknagar', 'gavipuram guttahalli', 'kengal hanumanthaiah park', 'bms college for women']
  },
  {
    wardNo: 156,
    nameEn: 'Srinagar',
    nameKn: 'ಶ್ರೀನಗರ',
    zone: 'South',
    keywords: ['srinagar', 'pes university', 'banashankari 1st stage', 'hosakerehalli', 'srinagar 50 feet road', 'bank colony srinagar', 'nagendra block']
  },
  {
    wardNo: 157,
    nameEn: 'Gali Anjaneya Temple',
    nameKn: 'ಗಾಳಿ ಆಂಜನೇಯ ದೇವಸ್ಥಾನ',
    zone: 'South',
    keywords: ['gali anjaneya temple', 'vijayanagar', 'hampinagar', 'mysore road flyover', 'byatarayanapura mysore road', 'deepanjali nagar metro']
  },
  {
    wardNo: 158,
    nameEn: 'Deepanjalinagar',
    nameKn: 'ದೀಪಾಂಜಲಿನಗರ',
    zone: 'South',
    keywords: ['deepanjalinagar', 'vijayanagar', 'bapujinagar', 'deepanjalinagar metro', 'mysore road satellite bus station', 'goripalya west']
  },
  {
    wardNo: 161,
    nameEn: 'Hosakerehalli',
    nameKn: 'ಹೊಸಕೆರೆಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['hosakerehalli', 'banashankari 3rd stage', 'kathriguppe', 'pes university', 'hosakerehalli lake', 'nice road flyover', 'dattatreya nagar']
  },
  {
    wardNo: 162,
    nameEn: 'Girinagar',
    nameKn: 'ಗಿರಿನಗರ',
    zone: 'South',
    keywords: ['girinagar', 'banashankari', 'kathriguppe', 'girinagar 1st phase', 'girinagar 2nd phase', 'girinagar circle', 'seetha circle']
  },
  {
    wardNo: 163,
    nameEn: 'Kathriguppe',
    nameKn: 'ಕತ್ರಿಗುಪ್ಪೆ',
    zone: 'South',
    keywords: ['kathriguppe', 'banashankari', 'girinagar', 'kathriguppe circle', 'kamakhya theatre', 'bsk 3rd stage', 'ring road kathriguppe', 'big bazaar kathriguppe']
  },
  {
    wardNo: 164,
    nameEn: 'Vidyapeetha',
    nameKn: 'ವಿದ್ಯಾಪೀಠ',
    zone: 'South',
    keywords: ['vidyapeetha', 'banashankari', 'sunkenahalli', 'vidyapeetha circle', 'ashoknagar bsk 1st stage', 'chennammanakere achukattu', 'kims college']
  },
  {
    wardNo: 165,
    nameEn: 'Ganesh Mandir',
    nameKn: 'ಗಣೇಶ ಮಂದಿರ',
    zone: 'South',
    keywords: ['ganesh mandir', 'bsk 2nd stage', 'kadirenahalli', 'monotype', 'kadirenahalli underpass', 'banashankari bda complex', 'devegowda road']
  },
  {
    wardNo: 166,
    nameEn: 'Karisandra',
    nameKn: 'ಕರಿಸಂದ್ರ',
    zone: 'South',
    keywords: ['karisandra', 'banashankari 3rd stage', 'chennammanakere', 'karisandra layout', 'yediyur lake south', 'bsk 2nd stage 24th cross']
  },
  {
    wardNo: 167,
    nameEn: 'Yediyur',
    nameKn: 'ಯಡಿಯೂರು',
    zone: 'South',
    keywords: ['yediyur', 'yediyur lake', 'jayanagar 6th block', 'jayanagar 7th block', 'yediyur siddalingeshwara temple', 'south end circle metro', 'deepak nursing home']
  },
  {
    wardNo: 168,
    nameEn: 'Pattabhiramnagar',
    nameKn: 'ಪಟ್ಟಾಭಿರಾಮನಗರ',
    zone: 'South',
    keywords: ['pattabhiramanagar', 'jayanagar 4th t block', 'south end circle', 'jayanagar general hospital', 'sanjay gandhi hospital', 'ashoka pillar south']
  },
  {
    wardNo: 169,
    nameEn: 'Byrasandra',
    nameKn: 'ಬೈರಸಂದ್ರ',
    zone: 'South',
    keywords: ['byrasandra', 'jayanagar 1st block east', 'tilak nagar', 'byrasandra main road', 'rbi layout jayanagar', 'nimhans rear']
  },
  {
    wardNo: 170,
    nameEn: 'Jayanagar East',
    nameKn: 'ಜಯನಗರ ಪೂರ್ವ',
    zone: 'South',
    keywords: ['jayanagar east', 'tilaknagar', 'jayadeva hospital', 'jayanagar 9th block', 'jayanagar 4th block east', 'swagath garuda mall', 'east end circle']
  },
  {
    wardNo: 171,
    nameEn: 'Gurappanapalya',
    nameKn: 'ಗುರಪ್ಪನಪಾಳ್ಯ',
    zone: 'South',
    keywords: ['gurappanapalya', 'bannerghatta road', 'btm 1st stage', 'mico layout', 'jayadeva flyover', 'dairy circle south', 'masjid e bilal']
  },
  {
    wardNo: 172,
    nameEn: 'Madiwala',
    nameKn: 'ಮಡಿವಾಳ',
    zone: 'South',
    keywords: ['madiwala', 'madiwala market', 'st johns', 'venkateshwara layout', 'madiwala lake', 'madiwala police station', 'total mall madiwala', 'silk board north']
  },
  {
    wardNo: 173,
    nameEn: 'Jakkasandra',
    nameKn: 'ಜಕ್ಕಸಂದ್ರ',
    zone: 'South',
    keywords: ['jakkasandra', 'koramangala 1st block extn', 'hsr 5th sector', 'sarjapur road jakkasandra', 'st johns medical college', 'jakkasandra block']
  },
  {
    wardNo: 176,
    nameEn: 'BTM Layout',
    nameKn: 'ಬಿ.ಟಿ.ಎಂ ಬಡಾವಣೆ',
    zone: 'South',
    keywords: ['btm layout', 'btm 1st stage', 'btm 2nd stage', 'kuvempunagar', 'mico layout', 'ring road btm', 'udupi garden signal', 'gangothri circle', 'tavarekere main road']
  },
  {
    wardNo: 184,
    nameEn: 'Uttarahalli',
    nameKn: 'ಉತ್ತರಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['uttarahalli', 'poornaprajna layout', 'subramanyapura main road', 'uttarahalli lake', 'brigade komarla', 'chikkalasandra road', 'dr vishnuvardhan road']
  },
  {
    wardNo: 185,
    nameEn: 'Yelachenahalli',
    nameKn: 'ಯಲಚೇನಹಳ್ಳಿ',
    zone: 'South',
    keywords: ['yelachenahalli', 'kanakapura road', 'metro station', 'vikram nagar', 'yelachenahalli metro station', 'chunchaghatta main road', 'kumaraswamy layout 1st stage']
  },

  // --- BOMMANAHALLI ZONE (Wards 174–175, 177–183, 186–197) ---
  {
    wardNo: 174,
    nameEn: 'HSR Layout',
    nameKn: 'ಎಚ್.ಎಸ್.ಆರ್ ಬಡಾವಣೆ',
    zone: 'Bommanahalli',
    keywords: ['hsr layout', 'sector 1', 'sector 2', 'sector 3', 'sector 4', 'sector 5', 'sector 6', 'sector 7', 'agara lake', '27th main hsr', 'bdk park', 'parangi palya', 'silk board junction']
  },
  {
    wardNo: 175,
    nameEn: 'Bommanahalli',
    nameKn: 'ಬೊಮ್ಮನಹಳ್ಳಿ',
    zone: 'Bommanahalli',
    keywords: ['bommanahalli', 'hosur main road', 'garvebhavipalya', 'roopena agrahara', 'bommanahalli junction', 'virat nagar', 'bbmp bommanahalli zonal office']
  },
  {
    wardNo: 177,
    nameEn: 'J P Nagar',
    nameKn: 'ಜೆ ಪಿ ನಗರ',
    zone: 'Bommanahalli',
    keywords: ['jp nagar', '1st phase', '2nd phase', '3rd phase', '4th phase', '5th phase', 'sarakki', 'dalmia circle', 'rv dental college', 'ragigudda temple', 'jp nagar metro']
  },
  {
    wardNo: 178,
    nameEn: 'Sarakki',
    nameKn: 'ಸಾರಕ್ಕಿ',
    zone: 'Bommanahalli',
    keywords: ['sarakki', 'sarakki gate', 'jp nagar 6th phase', 'jaraganahalli', 'sarakki lake', 'kanakapura main road', 'banashankari metro boundary']
  },
  {
    wardNo: 179,
    nameEn: 'Shakambari Nagar',
    nameKn: 'ಶಾಕಾಂಬರಿ ನಗರ',
    zone: 'Bommanahalli',
    keywords: ['shakambari nagar', 'banashankari bus stand', 'sangam circle', 'banashankari metro station', 'bsk 2nd stage south', 'jayanagar 8th block south']
  },
  {
    wardNo: 180,
    nameEn: 'Banashankari Temple',
    nameKn: 'ಬನಶಂಕರಿ ದೇವಸ್ಥಾನ',
    zone: 'Bommanahalli',
    keywords: ['banashankari ammanavara temple', 'kanakapura road', 'kadirenahalli', 'banashankari temple circle', 'chunchgatta road', 'sangam circle south']
  },
  {
    wardNo: 181,
    nameEn: 'Kumaraswamy Layout',
    nameKn: 'ಕುಮಾರಸ್ವಾಮಿ ಬಡಾವಣೆ',
    zone: 'Bommanahalli',
    keywords: ['kumaraswamy layout', 'dayananda sagar college', 'isro layout', 'ks layout 1st stage', 'ks layout 2nd stage', 'kumaraswamy layout police station', 'vittal nagar']
  },
  {
    wardNo: 182,
    nameEn: 'Padmanabhanagar',
    nameKn: 'ಪದ್ಮನಾಭ ನಗರ',
    zone: 'Bommanahalli',
    keywords: ['padmanabhanagar', 'devegowda petrol bunk', 'kadirenahalli cross', 'carmel school', 'yellamma dasappa college', 'banashankari 2nd stage west']
  },
  {
    wardNo: 183,
    nameEn: 'Chikkalasandra',
    nameKn: 'ಚಿಕ್ಕಲ್ಲಸಂದ್ರ',
    zone: 'Bommanahalli',
    keywords: ['chikkalasandra', 'uttarahalli', 'subramanyapura', 'chikkalasandra circle', 'gowdanapalya', 'hanumantha nagar extn', 'isro layout boundary']
  },
  {
    wardNo: 186,
    nameEn: 'Jaraganahalli',
    nameKn: 'ಜರಗನಹಳ್ಳಿ',
    zone: 'Bommanahalli',
    keywords: ['jaraganahalli', 'jp nagar 6th phase', 'kanakapura road', 'jaraganahalli lake', 'ilyas nagar', 'metro cash and carry kanakapura road']
  },
  {
    wardNo: 187,
    nameEn: 'Puttenahalli',
    nameKn: 'ಪುಟ್ಟೇನಹಳ್ಳಿ',
    zone: 'Bommanahalli',
    keywords: ['puttenahalli', 'jp nagar 7th phase', 'brigade millennium', 'elita promenade', 'puttenahalli lake', 'natranga', 'woodrose club', 'rbi layout']
  },
  {
    wardNo: 188,
    nameEn: 'Bilekahalli',
    nameKn: 'ಬಿಳೇಕಹಳ್ಳಿ',
    zone: 'Bommanahalli',
    keywords: ['bilekahalli', 'bannerghatta road', 'vijaya bank layout', 'iim bangalore', 'fortis hospital bannerghatta road', 'apollo hospital bannerghatta', 'kodichikkanahalli', 'duo heights']
  },
  {
    wardNo: 189,
    nameEn: 'Hongasandra',
    nameKn: 'ಹೊಂಗಸಂದ್ರ',
    zone: 'Bommanahalli',
    keywords: ['hongasandra', 'garvebhavipalya', 'begur road', 'hongasandra lake', 'bandepalya', 'bommanahalli east', 'kodichikkanahalli main road']
  },
  {
    wardNo: 190,
    nameEn: 'Mangammana Palya',
    nameKn: 'ಮಂಗಮ್ಮನ ಪಾಳ್ಯ',
    zone: 'Bommanahalli',
    keywords: ['mangammanapalya', 'bommanahalli', 'bandepalya', 'roopena agrahara', 'sector 7 hsr link', 'hosur road east']
  },
  {
    wardNo: 191,
    nameEn: 'Singasandra',
    nameKn: 'ಸಿಂಗಸಂದ್ರ',
    zone: 'Bommanahalli',
    keywords: ['singasandra', 'electronic city phase 1', 'hosa road', 'kudlu gate', 'singasandra metro station', 'manipal county', 'kudlu main road', 'chikka thogur']
  },
  {
    wardNo: 192,
    nameEn: 'Begur',
    nameKn: 'ಬೇಗೂರು',
    zone: 'Bommanahalli',
    keywords: ['begur', 'begur fort', 'dlf new town', 'akshayanagar', 'hulimavu', 'begur lake', 'panchalingeshwara temple', 'nobonagar', 'begur woods']
  },
  {
    wardNo: 193,
    nameEn: 'Arakere',
    nameKn: 'ಅರಕೆರೆ',
    zone: 'Bommanahalli',
    keywords: ['arakere', 'bannerghatta road', 'arakere mico layout', 'meenakshi temple', 'meenakshi mall', 'arakere lake', 'panduranga nagar', 'hulimavu gate']
  },
  {
    wardNo: 194,
    nameEn: 'Gottigere',
    nameKn: 'ಗೊಟ್ಟಿಗೆರೆ',
    zone: 'Bommanahalli',
    keywords: ['gottigere', 'bannerghatta road', 'nice road junction', 'basavanapura gottigere', 'kothnur', 'kalena agrahara', 'royal meenakshi mall south', 'amc engineering college']
  },
  {
    wardNo: 195,
    nameEn: 'Konanakunte',
    nameKn: 'ಕೋಣನಕುಂಟೆ',
    zone: 'Bommanahalli',
    keywords: ['konanakunte', 'kanakapura road', 'forum south bengaluru mall', 'chunchgatta', 'konanakunte cross metro station', 'prestige falcon city', 'doddakallasandra']
  },
  {
    wardNo: 196,
    nameEn: 'Anjanapura',
    nameKn: 'ಅಂಜನಾಪುರ',
    zone: 'Bommanahalli',
    keywords: ['anjanapura', 'bda layout', 'lal bahadur shastri nagar', 'gottigere', 'silk institute metro station', 'anjanapura 8th block', 'anjanapura 11th block', 'kanakapura highway']
  },
  {
    wardNo: 197,
    nameEn: 'Vasanthapura',
    nameKn: 'ವಸಂತಪುರ',
    zone: 'Bommanahalli',
    keywords: ['vasanthapura', 'vallabha niketan', 'kumaraswamy layout 2nd stage', 'vasantha vallabharaya temple', 'chikkakallasandra south', 'maruthi layout vasanthapura']
  }
];

if (typeof window !== 'undefined') {
  window.BBMP_ZONES = BBMP_ZONES;
  window.BBMP_WARDS = BBMP_WARDS;
}

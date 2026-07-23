/**
 * განმარტებითი ლექსიკონი / Explanatory Glossary — shared content.
 *
 * Single source of truth for the on-site glossary page and the printable PDF.
 * Each term carries a Georgian and English label plus a short explanation in
 * both languages, and (where applicable) the GDSFF Safety Standards Rulebook
 * section it derives from. Range commands stay in English in both languages
 * (per rulebook §5) with a localized explanation.
 */

export const glossaryCategories = [
  { key: 'roles', en: 'Roles & ranks', ka: 'როლები და წოდებები' },
  { key: 'commands', en: 'Range commands', ka: 'ტირის ბრძანებები' },
  { key: 'safety', en: 'Safety terms', ka: 'უსაფრთხოების ტერმინები' },
  { key: 'penalties', en: 'Penalties & DQ', ka: 'ჯარიმები და დისკვალიფიკაცია' },
]

export const glossaryTerms = [
  // ---- Roles & ranks ----
  {
    cat: 'roles',
    cite: '§4.1',
    en: { term: 'Range Officer (RO)', def: 'The official who issues range commands, reads the stage briefing, watches the shooter for safety and rule compliance, and declares time, score, and penalties.' },
    ka: { term: 'ტირის ოფიცერი (RO)', def: 'ოფიციალური პირი, რომელიც გასცემს ბრძანებებს, კითხულობს ეტაპის ინსტრუქციას, აკვირდება მსროლელს უსაფრთხოებისა და წესების დაცვისთვის და აცხადებს დროს, ქულასა და ჯარიმებს.' },
  },
  {
    cat: 'roles',
    cite: '§4.2',
    en: { term: 'Chief Range Officer (CRO)', def: 'Primary authority over one course of fire and its ROs; ensures consistent rulings and settles scoring disputes at stage level.' },
    ka: { term: 'ტირის მთავარი ოფიცერი (CRO)', def: 'ერთი სავარჯიშოსა და მისი RO-ების მთავარი უფლებამოსილი პირი; უზრუნველყოფს წესების ერთგვაროვან გამოყენებას და წყვეტს ქულების დავებს ეტაპის დონეზე.' },
  },
  {
    cat: 'roles',
    cite: '§4.3',
    en: { term: 'Range Master (RM)', def: 'Overall authority over everyone and everything on the range during a match; rules on disqualifications and appeals and may stop or modify a match for safety.' },
    ka: { term: 'რეინჯ მასტერი (RM)', def: 'მატჩის განმავლობაში ტირზე ყველა პირსა და აქტივობაზე უფლებამოსილი პირი; წყვეტს დისკვალიფიკაციებსა და აპელაციებს და უსაფრთხოებისთვის შეუძლია მატჩის შეჩერება ან შეცვლა.' },
  },
  {
    cat: 'roles',
    cite: null,
    en: { term: 'Competitor / shooter', def: 'The participant who runs the course of fire under RO supervision.' },
    ka: { term: 'მონაწილე / მსროლელი', def: 'მონაწილე, რომელიც სავარჯიშოს ასრულებს RO-ის მეთვალყურეობით.' },
  },

  // ---- Range commands (English in both languages) ----
  {
    cat: 'commands', command: true, cite: '§5.1',
    en: { term: 'Make Ready', def: 'The shooter faces downrange, prepares equipment, and loads per the stage briefing. No movement from the start position beyond preparation.' },
    ka: { term: 'Make Ready', def: 'მსროლელი დგება საწყის პოზიციაზე, ამზადებს აღჭურვილობას და ტენის იარაღს ინსტრუქციის შესაბამისად. მოძრაობა მხოლოდ მომზადებისთვისაა.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.2',
    en: { term: 'Are You Ready?', def: 'Absence of any objection from the shooter signals readiness.' },
    ka: { term: 'Are You Ready?', def: 'მსროლელის მხრიდან წინააღმდეგობის არარსებობა ნიშნავს მზადყოფნას.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.3',
    en: { term: 'Standby', def: 'Warns that the start signal will follow within 1–4 seconds. The shooter must not move before the signal.' },
    ka: { term: 'Standby', def: 'აფრთხილებს, რომ სასტარტო სიგნალი გაისმის 1–4 წამში. მსროლელი არ უნდა დაიძრას სიგნალამდე.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.5',
    en: { term: 'Stop', def: 'The shooter must immediately cease firing, stop moving, remove the finger from the trigger guard, keep the muzzle downrange, and await instructions.' },
    ka: { term: 'Stop', def: 'მსროლელი დაუყოვნებლივ წყვეტს სროლას და მოძრაობას, იღებს თითს ჩახმახის სკობიდან, ტოვებს ლულას downrange მიმართულებით და ელოდება მითითებას.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.6',
    en: { term: 'Unload and Show Clear', def: 'The shooter removes the magazine, ejects any chambered round, and presents the empty chamber and magazine well for RO inspection.' },
    ka: { term: 'Unload and Show Clear', def: 'მსროლელი იღებს მჭიდს, ამოაგდებს პატრონშაპში არსებულ ვაზნას და აჩვენებს ცარიელ პატრონშაპსა და მჭიდის ბუდეს RO-ის დასათვალიერებლად.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.7',
    en: { term: 'If Clear, Hammer Down, Holster', def: 'The shooter closes the action, releases the hammer/striker by pulling the trigger toward the backstop, and holsters. Long guns: action open, chamber flag inserted.' },
    ka: { term: 'If Clear, Hammer Down, Holster', def: 'მსროლელი ხურავს საკეტს, უშვებს ჩახმახს ტყვიამჭერისკენ მიმართვისას თითის დაჭერით და ჩააგებს იარაღს. გრძელლულიანი: საკეტი ღია, უსაფრთხოების ალამი ჩადგმული.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.8',
    en: { term: 'Range Is Clear', def: 'The course of fire is over; officials and competitors may move forward to score and reset.' },
    ka: { term: 'Range Is Clear', def: 'სავარჯიშო დასრულებულია; ოფიციალურ პირებსა და მონაწილეებს შეუძლიათ წინ წასვლა ქულების დათვლისა და აღდგენისთვის.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.9',
    en: { term: 'Muzzle (warning)', def: 'A discretionary warning that the muzzle is approaching a safe-angle limit. The shooter must correct immediately.' },
    ka: { term: 'Muzzle (გაფრთხილება)', def: 'დისკრეციული გაფრთხილება, რომ ლულა უახლოვდება უსაფრთხო კუთხის ზღვარს. მსროლელმა დაუყოვნებლივ უნდა გამოასწოროს.' },
  },
  {
    cat: 'commands', command: true, cite: '§5.9',
    en: { term: 'Finger (warning)', def: 'A warning that the finger is inside the trigger guard during movement, reloading, or clearing a malfunction. A repeat may be escalated to a DQ.' },
    ka: { term: 'Finger (გაფრთხილება)', def: 'გაფრთხილება, რომ თითი ჩახმახის სკობშია მოძრაობის, გადატენვის ან შეფერხების აღმოფხვრის დროს. განმეორება შეიძლება DQ-მდე გამწვავდეს.' },
  },

  // ---- Safety terms ----
  {
    cat: 'safety', cite: '§2.1',
    en: { term: 'Cold range', def: 'A range where firearms stay unloaded and holstered or cased at all times, except under direct RO supervision on the line or inside a Safety Area.' },
    ka: { term: 'ცივი ტირი', def: 'ტირი, სადაც იარაღი ყოველთვის დაუტენავი და ბუდეში ან ჩასაწყობშია, გარდა სასროლ ხაზზე RO-ის უშუალო მეთვალყურეობისა ან უსაფრთხოების ზონისა.' },
  },
  {
    cat: 'safety', cite: '§2.2',
    en: { term: 'Safety Area', def: 'A marked zone for handling unloaded firearms without RO supervision. Handling ammunition there is prohibited and is a DQ offense.' },
    ka: { term: 'უსაფრთხოების ზონა', def: 'მონიშნული ზონა დაუტენავი იარაღის მართვისთვის RO-ის მეთვალყურეობის გარეშე. საბრძოლო მასალის მართვა აქ აკრძალულია და დისკვალიფიკაციის საფუძველია.' },
  },
  {
    cat: 'safety', cite: '§3.1',
    en: { term: 'The 180° rule', def: 'During a course of fire the muzzle must stay within the 180° arc facing the backstop — never more than 90° left or right of downrange. The arc moves with the shooter.' },
    ka: { term: '180°-ის წესი', def: 'სავარჯიშოს დროს ლულა უნდა დარჩეს ტყვიამჭერისკენ მიმართულ 180°-იან რკალში — არასოდეს 90°-ზე მეტად მარცხნივ ან მარჯვნივ. რკალი მსროლელთან ერთად გადაადგილდება.' },
  },
  {
    cat: 'safety', cite: '§3.2',
    en: { term: 'Muzzle safe angles', def: 'Stricter limits (for example vertical ones) a stage briefing may set beyond the 180°; announced before shooting and enforced identically.' },
    ka: { term: 'ლულის უსაფრთხო კუთხეები', def: 'უფრო მკაცრი ზღვრები (მაგ. ვერტიკალური), რომელსაც ეტაპის ინსტრუქცია 180°-ის დამატებით ადგენს; ცხადდება სროლამდე და აღსრულდება იდენტურად.' },
  },
  {
    cat: 'safety', cite: '§7.3',
    en: { term: 'Sweeping', def: 'Allowing the muzzle to point at any part of any person, including the shooter’s own body, during a course of fire. It is a DQ offense.' },
    ka: { term: 'სვიპინგი', def: 'ლულის მიმართვა ნებისმიერი ადამიანის ნაწილზე, საკუთარი სხეულის ჩათვლით, სავარჯიშოს დროს. ეს დისკვალიფიკაციის საფუძველია.' },
  },
  {
    cat: 'safety', cite: null,
    en: { term: 'Backstop / berm', def: 'The earth bank or barrier behind the targets that safely stops bullets (“downrange” faces it).' },
    ka: { term: 'ტყვიამჭერი ზღუდე', def: 'მიწაყრილი ან ბარიერი სამიზნეების უკან, რომელიც უსაფრთხოდ აჩერებს ტყვიებს („downrange" მისკენაა მიმართული).' },
  },
  {
    cat: 'safety', cite: '§2.4',
    en: { term: 'Eye & hearing protection', def: 'Eye protection is mandatory for everyone on range grounds; hearing protection is mandatory forward of the spectator line.' },
    ka: { term: 'თვალისა და სმენის დაცვა', def: 'თვალის დაცვა სავალდებულოა ტირის ტერიტორიაზე ყველასთვის; სმენის დაცვა — მაყურებელთა ხაზის წინ.' },
  },
  {
    cat: 'safety', cite: null,
    en: { term: 'Chamber flag', def: 'A visible plastic safety flag inserted into an open action to show a firearm is unloaded (used on long guns).' },
    ka: { term: 'ლულაში ჩასადები უსაფრთხოების ალამი', def: 'ხილული პლასტმასის უსაფრთხოების ალამი, რომელიც ჩაიდგმება ღია საკეტში/ლულაში და ცხადყოფს, რომ იარაღი დაუტენავია (გრძელლულიან იარაღზე).' },
  },
  {
    cat: 'safety', cite: '§8.2',
    en: { term: 'Reshoot', def: 'A fresh attempt offered when a range equipment failure (falling prop, target failure) interfered with the shooter’s run.' },
    ka: { term: 'ხელახალი სროლა', def: 'ახალი მცდელობა, რომელიც შესთავაზება, როცა ტირის აღჭურვილობის ხარვეზმა (ჩამოვარდნილი დეკორაცია, სამიზნის ხარვეზი) ხელი შეუშალა მსროლელს.' },
  },
  {
    cat: 'safety', cite: null,
    en: { term: 'Stage briefing', def: 'The written and read description of a stage — its procedures, start position, and any stricter safe angles — that the RO delivers before the run.' },
    ka: { term: 'ეტაპის ინსტრუქცია', def: 'ეტაპის წერილობითი და ხმამაღლა წაკითხული აღწერა — პროცედურები, საწყისი პოზიცია და უფრო მკაცრი უსაფრთხო კუთხეები — რომელსაც RO სროლამდე გადასცემს.' },
  },
  {
    cat: 'safety', cite: '§8.3',
    en: { term: 'Incident register', def: 'The log where every DQ, injury, or near-miss is recorded within 24 hours and reviewed at each Board meeting.' },
    ka: { term: 'ინციდენტების ჟურნალი', def: 'ჟურნალი, სადაც ყოველი DQ, დაზიანება ან კინაღამ-ინციდენტი აღირიცხება 24 საათში და განიხილება ყოველ გამგეობის სხდომაზე.' },
  },

  // ---- Penalties & DQ ----
  {
    cat: 'penalties', cite: '§6.1',
    en: { term: 'Procedural penalty', def: 'A points penalty for failing to follow the stage briefing’s procedures — applied per occurrence or per shot as the briefing defines.' },
    ka: { term: 'პროცედურული ჯარიმა', def: 'ქულობრივი ჯარიმა ეტაპის ინსტრუქციის პროცედურების შეუსრულებლობისთვის — თითოეულ შემთხვევაზე ან გასროლაზე, ინსტრუქციის მიხედვით.' },
  },
  {
    cat: 'penalties', cite: '§7',
    en: { term: 'Match disqualification (DQ)', def: 'Ends the person’s participation for that day. Reported to the RM before the competitor leaves the stage.' },
    ka: { term: 'მატჩიდან დისკვალიფიკაცია (DQ)', def: 'ასრულებს პირის მონაწილეობას მოცემული დღისთვის. ეცნობება RM-ს, სანამ მონაწილე ეტაპს დატოვებს.' },
  },
  {
    cat: 'penalties', cite: '§7.1',
    en: { term: 'Accidental / negligent discharge', def: 'Any unintentional shot — including during loading, reloading, or malfunction clearance — or a shot into the ground within 3 m or over the backstop. A DQ.' },
    ka: { term: 'შემთხვევითი / გაუფრთხილებელი გასროლა', def: 'ნებისმიერი უნებლიე გასროლა — დატენვის, გადატენვის ან შეფერხების აღმოფხვრის დროსაც — ან 3 მ-ში მიწაში / ტყვიამჭერზე ზემოთ. დისკვალიფიკაცია.' },
  },
  {
    cat: 'penalties', cite: '§7.4',
    en: { term: 'Dropping a firearm', def: 'Dropping or losing control of a loaded firearm at any time — or an unloaded one during a run — is a DQ. Only an official may retrieve it.' },
    ka: { term: 'იარაღის ჩამოვარდნა', def: 'დატენილი იარაღის ჩამოვარდნა ან კონტროლის დაკარგვა ნებისმიერ დროს — ან დაუტენავისა სავარჯიშოს დროს — დისკვალიფიკაციაა. მას მხოლოდ ოფიციალური პირი იღებს.' },
  },
]

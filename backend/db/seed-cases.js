/**
 * Seed 250+ realistic Namibian magistrate court cases
 *
 * Usage: node db/seed-cases.js
 * Run from the backend/ directory.
 */
const { db, getNextCaseNumber } = require('./database');
const { v4: uuidv4 } = require('uuid');

// ── Reference data ──────────────────────────────────────────
const PLAINTIFFS = [
  'State of Namibia', 'Minister of Justice', 'Namibia Revenue Agency',
  'Windhoek Municipality', 'City of Windhoek', 'Roads Authority Namibia',
  'NamWater', 'NamPower', 'Telecom Namibia', 'NamPost',
  'Bank of Namibia', 'First National Bank Namibia', 'Standard Bank Namibia',
  'Nedbank Namibia', 'ABN AMRO Namibia', 'Old Mutual Namibia',
  'Sanlam Namibia', 'Namibia Breweries', 'Mobile Telecom (MTC)',
  'Paratus Telecom', 'Namibia Airports Company', 'TransNamib Holdings',
  'NamPort', 'Meat Board of Namibia', 'Namibia Agricultural Union',
  'Ahmed & Associates Law Firm', 'Kangueehi Law Chambers',
  'Fisher, Quarmby & Partners', 'LorentzAngula Inc.',
  'Inheritance Recovery Agency', 'Namibia Credit Bureau',
  'Small Business Credit Guarantee Trust', 'NIPAM',
  'Social Security Commission', 'Motor Vehicle Accident Fund',
  'Karas Town Council', 'Swakopmund Municipality',
  'Walvis Bay Municipality', 'Rundu Town Council',
  'Oshakati Town Council', 'Etosha Fishing Corporation',
];

const DEFENDANTS = [
  'John Mwatale', 'Selma Iipinge', 'Tomas Shikongo', 'Ndapanda Amutenya',
  'Kativa Nghipondoka', 'Hosea Kafita', 'Penny Shipanga', 'Rally Katoma',
  'Festus Nangombe', 'Loide Kandombo', 'Tjeripo Kandjii', 'Anna Shaninga',
  'Erastus Shekupe', 'Johanna Mwandingi', 'Ben Nangoloh', 'Sylvia Ndjaleka',
  'Michael Kambinda', 'Gideon Hishoono', 'Alfeus Shaanika', 'David Nangolo',
  'Nakanyala Shembe', 'Rebecca Gaomab', 'John ya Otto', 'Tulonga Shikale',
  'Kornelius Shikukumwa', 'Ndinelago Shekutamba', 'Toivo Asino',
  'Linea Shikwambi', 'Sakarias Nangombe', 'Lazarus Shoopala',
  'Nuuyoma Amutenya', 'Adolf Hamutenya', 'Saima Nangula', 'Abed Shikongo',
  'Olivia Sheehama', 'Alina Neingo', 'Sylvia Nashandi', 'Tangeni Nampala',
  'Justina Nashongo', 'Julia Hamalwa', 'Fillemon Amakali', 'Isak Nghifikwa',
  'Sylvia Shihepo', 'Lucas Mbasela', 'Selma Munenguni', 'Eino Mwanyangapo',
  'Kletus Amupolo', 'Rauna Nuuyoma', 'Theo Hamutenya', 'Sylvia Nashima',
];

const OFFICERS = [
  'Magistrate Shikongo', 'Magistrate Katoma', 'Magistrate Kandara',
  'Magistrate Amutenya', 'Magistrate Nghipondoka', 'Magistrate Nangombe',
  'Magistrate Unengu', 'Magistrate Kasita', 'Magistrate McNally',
  'Magistrate Shaanika', 'Magistrate Manyarara', 'Magistrate Kaujeua',
];

const STATUSES = ['Open', 'Active', 'Pending', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const TYPES = ['Criminal', 'Civil', 'Family', 'Commercial', 'Labour'];

const TOWNS = [
  'Windhoek', 'Rundu', 'Oshakati', 'Swakopmund', 'Walvis Bay',
  'Otjiwarongo', 'Grootfontein', 'Tsumeb', 'Keetmanshoop',
  'Mariental', 'Lüderitz', 'Outjo', 'Ondangwa', 'Eenhana',
  'Nkurenkuru', 'Katima Mulilo', 'Opuwo', 'Omaruru', 'Karasburg',
  'Okahandja', 'Gobabis', 'Rehoboth', 'Usakos', 'Arandis',
  'Henties Bay', 'Oranjemund',
];

const TITLES_CRIMINAL = [
  'State v. {d} – Stock Theft', 'State v. {d} – Assault GBH',
  'State v. {d} – Housebreaking', 'State v. {d} – Theft of Motor Vehicle',
  'State v. {d} – Drug Possession', 'State v. {d} – Fraud',
  'State v. {d} – Robbery', 'State v. {d} – Rape',
  'State v. {d} – Murder', 'State v. {d} – Culpable Homicide',
  'State v. {d} – Assault Common', 'State v. {d} – Malicious Damage to Property',
  'State v. {d} – Possession of Stolen Goods', 'State v. {d} – Trespassing',
  'State v. {d} – Public Intoxication', 'State v. {d} – Resisting Arrest',
  'State v. {d} – Contravention of Road Ordinance',
  'State v. {d} – Illegal Hunting', 'State v. {d} – Poaching',
  'State v. {d} – Human Trafficking',
];

const TITLES_CIVIL = [
  '{p} v. {d} – Breach of Contract',
  '{p} v. {d} – Debt Recovery',
  '{p} v. {d} – Property Dispute',
  '{p} v. {d} – Personal Injury Claim',
  '{p} v. {d} – Defamation',
  '{p} v. {d} – Eviction Order',
  '{p} v. {d} – Specific Performance',
  '{p} v. {d} – Damages Claim',
  '{p} v. {d} – Interdict Application',
  '{p} v. {d} – Rental Arrears',
  '{p} v. {d} – Unlawful Occupation',
  '{p} v. {d} – Boundary Dispute',
  '{p} v. {d} – Insurance Claim',
  '{p} v. {d} – Professional Negligence',
  '{p} v. {d} – Reckless Driving Damages',
];

const TITLES_FAMILY = [
  'In re: Custody of Minor Child – {d}',
  '{p} v. {d} – Divorce Proceedings',
  'In re: Estate of {d}',
  '{p} v. {d} – Maintenance Claim',
  'In re: Adoption of Minor – {d}',
  'In re: Guardianship of {d}',
  '{p} v. {d} – Restitution of Conjugal Rights',
  'In re: Property Settlement – {d} Estate',
  '{p} v. {d} – Variation of Maintenance Order',
  'In re: Appointment of Curator – {d}',
];

const TITLES_COMMERCIAL = [
  '{p} v. {d} – Liquidation Application',
  '{p} v. {d} – Insolvency Proceedings',
  '{p} v. {d} – Business Debt Recovery',
  '{p} v. {d} – Shareholder Dispute',
  '{p} v. {d} – Partnership Dissolution',
  '{p} v. {d} – Breach of Fiduciary Duty',
  '{p} v. {d} – Intellectual Property Infringement',
  '{p} v. {d} – Unpaid Invoices',
  '{p} v. {d} – Franchise Agreement Breach',
  '{p} v. {d} – Company Asset Freeze',
];

const TITLES_LABOUR = [
  '{d} v. {p} – Unfair Dismissal',
  '{d} v. {p} – Constructive Dismissal',
  '{d} v. {p} – Wage Arrears',
  '{d} v. {p} – Unlawful Suspension',
  '{d} v. {p} – Discrimination at Workplace',
  '{d} v. {p} – Non-Payment of Benefits',
  '{d} v. {p} – Retrenchment Dispute',
  '{d} v. {p} – Breach of Employment Contract',
  '{d} v. {p} – Overtime Claim',
  '{d} v. {p} – Maternity Leave Violation',
];

const TITLE_POOLS = {
  Criminal: TITLES_CRIMINAL,
  Civil: TITLES_CIVIL,
  Family: TITLES_FAMILY,
  Commercial: TITLES_COMMERCIAL,
  Labour: TITLES_LABOUR,
};

// ── Helpers ──────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start = new Date(2024, 0, 1), end = new Date()) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function generateTitle(type, p, d) {
  const pool = TITLE_POOLS[type];
  const tpl = pick(pool);
  return tpl.replace('{p}', p).replace('{d}', d).substring(0, 200);
}

// ── Seed ──────────────────────────────────────────────────────
function seedCases(count = 260) {
  console.log(`Seeding ${count} Namibian magistrate cases...`);

  // Get the existing admin user
  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@moj.na'").get();
  if (!admin) {
    console.error('❌ No admin user found. Run the app first to seed the initial user.');
    process.exit(1);
  }
  const adminId = admin.id;

  // Check existing count
  const existingCount = db.prepare('SELECT COUNT(*) AS c FROM cases').get().c;
  console.log(`  Existing cases: ${existingCount}`);

  if (existingCount >= count) {
    console.log(`  Already have ${existingCount} cases — skipping.`);
    return;
  }

  const toCreate = count - existingCount;
  console.log(`  Creating ${toCreate} new cases...`);

  const insertCase = db.prepare(`
    INSERT INTO cases (id, case_number, title, case_type, status, priority, plaintiff, defendant, presiding_officer, hearing_date, next_action, description, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLog = db.prepare(
    'INSERT INTO case_logs (id, case_id, user_id, action, note, performed_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const insertAll = db.transaction(() => {
    for (let i = 0; i < toCreate; i++) {
      const id = uuidv4();
      const caseNumber = getNextCaseNumber();
      const type = pick(TYPES);
      const plaintiff = pick(PLAINTIFFS);
      const defendant = pick(DEFENDANTS);
      const status = pick(STATUSES);
      const priority = pick(PRIORITIES);
      const officer = pick(OFFICERS);
      const title = generateTitle(type, plaintiff, defendant);
      const hearingDate = status !== 'Closed' ? randomDate() : '';
      const createdAt = randomDate(new Date(2024, 0, 1), new Date());
      const updatedAt = createdAt;
      const town = pick(TOWNS);
      const description = `Case filed in ${town} Magistrate Court. ${title}. Hearing scheduled${hearingDate ? ' for ' + hearingDate : ' pending'}.`;

      insertCase.run(
        id, caseNumber, title, type, status, priority,
        plaintiff, defendant, officer, hearingDate,
        '', description, adminId, createdAt, updatedAt
      );

      const logDate = createdAt;
      insertLog.run(uuidv4(), id, adminId, 'Case Created', `Filed in ${town} Magistrate Court.`, logDate);

      if (status === 'Active') {
        insertLog.run(uuidv4(), id, adminId, 'Status Updated', 'Changed from Open to Active', createdAt);
      } else if (status === 'Closed') {
        insertLog.run(uuidv4(), id, adminId, 'Status Updated', 'Changed from Open to Active', createdAt);
        insertLog.run(uuidv4(), id, adminId, 'Status Updated', 'Changed from Active to Closed', createdAt);
        insertLog.run(uuidv4(), id, adminId, 'Judgment Entered', `Case concluded in ${town}.`, createdAt);
      } else if (status === 'Pending') {
        insertLog.run(uuidv4(), id, adminId, 'Note Added', 'Awaiting further particulars from both parties.', createdAt);
      }
    }
  });

  insertAll();

  const newCount = db.prepare('SELECT COUNT(*) AS c FROM cases').get().c;
  console.log(`✅ Done. Total cases: ${newCount}`);
}

// ── Run ───────────────────────────────────────────────────────
seedCases(260);
console.log('🎉 Seeding complete.');

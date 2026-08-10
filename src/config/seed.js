require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("./db");

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("🌱 Seeding database...");

    // Admin user
    const hash = await bcrypt.hash("Admin@1234", 12);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin User', 'admin@mugangasacco.rw', $1, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);

    // Editor user
    const editorHash = await bcrypt.hash("Editor@1234", 12);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Editor User', 'editor@mugangasacco.rw', $1, 'editor')
      ON CONFLICT (email) DO NOTHING;
    `, [editorHash]);

    // Site settings
    await client.query(`
      INSERT INTO site_settings (site_name, tagline, email, phone, address)
      VALUES ('Muganga SACCO', 'Save and Achieve', 'info@mugangasacco.rw', '+250 788 000 000', 'Kigali, Rwanda')
      ON CONFLICT DO NOTHING;
    `);

    // Feature toggles
    const toggles = [
      { key: 'online_applications', label: 'Online Applications', description: 'Enable online loan/savings applications', is_enabled: true },
      { key: 'digital_banking',     label: 'Digital Banking',     description: 'Show digital banking section',            is_enabled: true },
      { key: 'video_guides',        label: 'Video Guides',        description: 'Show video guides section',               is_enabled: true },
      { key: 'market_trends',       label: 'Market Trends',       description: 'Show market trends & insights page',      is_enabled: true },
    ];
    for (const t of toggles) {
      await client.query(`
        INSERT INTO feature_toggles (key, label, description, is_enabled)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO NOTHING;
      `, [t.key, t.label, t.description, t.is_enabled]);
    }

    // Social links
    const socials = [
      { platform: 'Facebook',  url: 'https://facebook.com/mugangasacco',  icon: 'facebook' },
      { platform: 'Twitter',   url: 'https://twitter.com/mugangasacco',   icon: 'twitter'  },
      { platform: 'LinkedIn',  url: 'https://linkedin.com/mugangasacco',  icon: 'linkedin' },
      { platform: 'Instagram', url: 'https://instagram.com/mugangasacco', icon: 'instagram'},
    ];
    for (const s of socials) {
      await client.query(`
        INSERT INTO social_links (platform, url, icon)
        VALUES ($1, $2, $3);
      `, [s.platform, s.url, s.icon]);
    }

    // Products
    const products = [
      { type: 'loan',    title: 'Giriwawe Home Loans',  description: 'Affordable housing loans for health workers',   interest_rate: 10, max_amount: 100000000, features: ['Up to 20 years repayment','Lowest rate in market','Government partnership'], is_featured: true,  featured_label: 'Featured',     cta_label: 'Apply Now'    },
      { type: 'loan',    title: 'Business Loans',        description: 'Grow your healthcare practice or side business', interest_rate: 12, max_amount: 50000000,  features: ['Repayment up to 5 years','No hidden fees','Fast approval process'],          is_featured: false, featured_label: null,           cta_label: 'Apply Now'    },
      { type: 'loan',    title: 'Emergency Loans',       description: 'Quick access to funds when you need them most',  interest_rate: 15, max_amount: 10000000,  features: ['Approval within 24 hours','Repayment up to 2 years','Minimal documentation'], is_featured: false, featured_label: null,           cta_label: 'Apply Now'    },
      { type: 'savings', title: 'Fixed Deposit',         description: 'Lock your savings for higher returns',           interest_rate: 12, min_amount: 1000000,   features: ['6-36 month terms','Guaranteed returns','Interest paid monthly'],              is_featured: true,  featured_label: 'Best Returns', cta_label: 'Open Account' },
      { type: 'savings', title: 'Voluntary Savings',     description: 'Flexible savings with competitive returns',      interest_rate:  8, min_amount: 0,         features: ['Save at your own pace','Withdraw anytime','Earn interest monthly'],            is_featured: false, featured_label: null,           cta_label: 'Open Account' },
      { type: 'savings', title: 'Junior Savings',        description: 'Build a future for your children',               interest_rate:  9, min_amount: 0,         features: ['No account fees','Financial education included','Parental control features'],   is_featured: false, featured_label: null,           cta_label: 'Open Account' },
    ];
    for (const p of products) {
      await client.query(`
        INSERT INTO products (type, title, description, interest_rate, min_amount, max_amount, features, is_featured, featured_label, cta_label)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10);
      `, [p.type, p.title, p.description, p.interest_rate, p.min_amount || null, p.max_amount || null, JSON.stringify(p.features), p.is_featured, p.featured_label, p.cta_label]);
    }

    // KPI Stats
    const kpis = [
      { label: 'Total Assets',      value: 'RWF 45.8B', change_pct: '+12.5%', is_positive: true },
      { label: 'Active Members',    value: '50,234',    change_pct: '+8.2%',  is_positive: true },
      { label: 'Loan Portfolio',    value: 'RWF 32.4B', change_pct: '+15.3%', is_positive: true },
      { label: 'Savings Deposits',  value: 'RWF 28.9B', change_pct: '+10.7%', is_positive: true },
    ];
    for (let i = 0; i < kpis.length; i++) {
      const k = kpis[i];
      await client.query(`
        INSERT INTO kpi_stats (label, value, change_pct, is_positive, sort_order)
        VALUES ($1,$2,$3,$4,$5);
      `, [k.label, k.value, k.change_pct, k.is_positive, i]);
    }

    await client.query("COMMIT");
    console.log("✅ Seeding completed!");
    console.log("👤 Admin:  admin@mugangasacco.rw  / Admin@1234");
    console.log("👤 Editor: editor@mugangasacco.rw / Editor@1234");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

seed();

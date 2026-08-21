require("dotenv").config();
const { pool } = require("./db");

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("🔄 Running migrations...");

    // ── ENUMS ──────────────────────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'editor', 'member');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        /* Safe check for product_type without destructive CASCADE drops */
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
          CREATE TYPE product_type AS ENUM ('loan', 'savings');
        END IF;
      END $$;

      DO $$ BEGIN
        CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE board_role AS ENUM ('chairperson', 'vice_chairperson', 'secretary', 'member');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE board_type AS ENUM ('board_of_directors', 'supervisory_board', 'management_team');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE management_role AS ENUM ('ceo', 'cfo', 'coo', 'manager', 'officer');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE tutorial_category AS ENUM ('getting_started', 'loans', 'digital_services', 'education', 'savings');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── USERS ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(120) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        user_role NOT NULL DEFAULT 'member',
        avatar      VARCHAR(500),
        is_active   BOOLEAN DEFAULT TRUE,
        last_login  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── REFRESH TOKENS ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token       TEXT NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── PRODUCTS ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type           product_type NOT NULL,
        title          VARCHAR(200) NOT NULL,
        description    TEXT,
        interest_rate  NUMERIC(5,2) NOT NULL,
        min_amount     BIGINT,
        max_amount     BIGINT,
        features       JSONB DEFAULT '[]',
        is_featured    BOOLEAN DEFAULT FALSE,
        featured_label VARCHAR(80),
        icon           VARCHAR(100),
        cta_label      VARCHAR(80) DEFAULT 'Apply Now',
        is_active      BOOLEAN DEFAULT TRUE,
        sort_order     INTEGER DEFAULT 0,
        created_by     UUID REFERENCES users(id),
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Products: add eligibility / documents / process / image ──────
    await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS eligibility        JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS required_documents  JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS application_process TEXT,
        ADD COLUMN IF NOT EXISTS image_url           TEXT,
        ADD COLUMN IF NOT EXISTS targeted_customers  JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS benefits            JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS required_forms      JSONB DEFAULT '[]';
    `);

    // ── OTHER SERVICES ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS other_services (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title               VARCHAR(200) NOT NULL,
        description         TEXT,
        interest_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,
        max_amount          BIGINT,
        features            JSONB DEFAULT '[]',
        eligibility         JSONB DEFAULT '[]',
        required_documents  JSONB DEFAULT '[]',
        application_process TEXT,
        is_featured         BOOLEAN DEFAULT FALSE,
        image_url           TEXT,
        is_active           BOOLEAN DEFAULT TRUE,
        sort_order          INTEGER DEFAULT 0,
        created_by          UUID REFERENCES users(id),
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Other Services: add targeted_customers / benefits / required_forms ──
    await client.query(`
      ALTER TABLE other_services
        ADD COLUMN IF NOT EXISTS targeted_customers  JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS benefits            JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS required_forms      JSONB DEFAULT '[]';
    `);

    // ── BOARD MEMBERS ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS board_members (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(150) NOT NULL,
        role        VARCHAR(100) NOT NULL DEFAULT 'member',
        board_type  board_type NOT NULL DEFAULT 'board_of_directors',
        bio         TEXT,
        image_url   VARCHAR(500),
        linkedin    VARCHAR(300),
        email       VARCHAR(255),
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE board_members ADD COLUMN IF NOT EXISTS board_type board_type NOT NULL DEFAULT 'board_of_directors';`);
    await client.query(`ALTER TABLE board_members ALTER COLUMN role TYPE VARCHAR(100) USING role::text;`);
    await client.query(`ALTER TABLE board_members ALTER COLUMN role SET DEFAULT 'member';`);

    // ── MANAGEMENT TEAM ────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS management_team (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(150) NOT NULL,
        role        VARCHAR(100) NOT NULL DEFAULT 'officer',
        role_title  VARCHAR(150),
        bio         TEXT,
        image_url   VARCHAR(500),
        linkedin    VARCHAR(300),
        email       VARCHAR(255),
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE management_team ALTER COLUMN role TYPE VARCHAR(100) USING role::text;`);
    await client.query(`ALTER TABLE management_team ALTER COLUMN role SET DEFAULT 'officer';`);

    // ── GOVERNANCE PRINCIPLES ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS governance_principles (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(100) NOT NULL,
        description TEXT,
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── CAREERS ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS careers (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title           VARCHAR(200) NOT NULL,
        department      VARCHAR(150),
        location        VARCHAR(150) DEFAULT 'Kigali',
        employment_type employment_type DEFAULT 'full-time',
        description     TEXT,
        requirements    JSONB DEFAULT '[]',
        benefits        JSONB DEFAULT '[]',
        salary_range    VARCHAR(100),
        is_active       BOOLEAN DEFAULT TRUE,
        deadline        DATE,
        posted_at       TIMESTAMPTZ DEFAULT NOW(),
        created_by      UUID REFERENCES users(id),
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── NEWS ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title         VARCHAR(300) NOT NULL,
        slug          VARCHAR(350) UNIQUE,
        excerpt       TEXT,
        content       TEXT,
        tag           VARCHAR(80),
        image_url     VARCHAR(500),
        is_featured   BOOLEAN DEFAULT FALSE,
        status        news_status DEFAULT 'draft',
        published_at  TIMESTAMPTZ,
        created_by    UUID REFERENCES users(id),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── TRENDS / STATS ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS kpi_stats (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label       VARCHAR(100) NOT NULL,
        value       VARCHAR(100) NOT NULL,
        change_pct  VARCHAR(20),
        is_positive BOOLEAN DEFAULT TRUE,
        icon        VARCHAR(50),
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS savings_trends (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period      VARCHAR(50) NOT NULL,
        amount      BIGINT NOT NULL,
        label       VARCHAR(100),
        year        SMALLINT,
        quarter     SMALLINT,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_distribution (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label       VARCHAR(100) NOT NULL,
        percentage  NUMERIC(5,2) NOT NULL,
        color       VARCHAR(20),
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS economic_insights (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(150) NOT NULL,
        body        TEXT NOT NULL,
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── VIDEO GUIDES ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_guides (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(250) NOT NULL,
        description TEXT,
        category    tutorial_category NOT NULL DEFAULT 'getting_started',
        duration    VARCHAR(20),
        thumbnail   VARCHAR(500),
        video_url   VARCHAR(500),
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        views       INTEGER DEFAULT 0,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── SETTINGS ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_name     VARCHAR(200) DEFAULT 'Muganga SACCO',
        tagline       VARCHAR(300),
        logo_url      VARCHAR(500),
        favicon_url   VARCHAR(500),
        email         VARCHAR(255),
        phone         VARCHAR(50),
        address       TEXT,
        about         TEXT,
        updated_by    UUID REFERENCES users(id),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS social_links (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform    VARCHAR(60) NOT NULL,
        url         VARCHAR(500) NOT NULL,
        icon        VARCHAR(60),
        is_active   BOOLEAN DEFAULT TRUE,
        sort_order  INTEGER DEFAULT 0,
        updated_by  UUID REFERENCES users(id),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hero_banners (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(250),
        subtitle    TEXT,
        image_url   VARCHAR(500),
        cta_label   VARCHAR(80),
        cta_link    VARCHAR(300),
        page        VARCHAR(80),
        is_active   BOOLEAN DEFAULT TRUE,
        sort_order  INTEGER DEFAULT 0,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_toggles (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key         VARCHAR(100) UNIQUE NOT NULL,
        label       VARCHAR(150),
        description TEXT,
        is_enabled  BOOLEAN DEFAULT TRUE,
        updated_by  UUID REFERENCES users(id),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── FORMS ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(300) NOT NULL,
        file_url    VARCHAR(500) NOT NULL,
        category    VARCHAR(50) DEFAULT 'other',
        is_active   BOOLEAN DEFAULT TRUE,
        sort_order  INTEGER DEFAULT 0,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── INDEXES ────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
      CREATE INDEX IF NOT EXISTS idx_news_featured ON news(is_featured);
      CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
      CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
      CREATE INDEX IF NOT EXISTS idx_careers_active ON careers(is_active);
      CREATE INDEX IF NOT EXISTS idx_video_category ON video_guides(category);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_board_sort ON board_members(sort_order);
    `);

    // ── NEWS: add section / subsection columns ──
    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS section VARCHAR(40) DEFAULT 'news'`);
    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS subsection VARCHAR(40)`);
    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS file_url VARCHAR(500)`);
    await client.query(`ALTER TABLE careers ADD COLUMN IF NOT EXISTS max_age INTEGER`);
    await client.query(`ALTER TABLE careers ADD COLUMN IF NOT EXISTS key_deliverables      JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE careers ADD COLUMN IF NOT EXISTS skills_competencies   JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE careers ADD COLUMN IF NOT EXISTS personal_attributes   JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE careers ADD COLUMN IF NOT EXISTS application_procedures TEXT`);

    // ── JOB APPLICATIONS ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        career_id           UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
        full_name           VARCHAR(200) NOT NULL,
        date_of_birth       DATE NOT NULL,
        phone               VARCHAR(20),
        email               VARCHAR(200),
        marital_status      VARCHAR(20) NOT NULL,
        gender              VARCHAR(10) NOT NULL,
        id_file_url         VARCHAR(500) NOT NULL,
        cv_file_url         VARCHAR(500) NOT NULL,
        academic_file_url   VARCHAR(500) NOT NULL,
        cover_letter_url    VARCHAR(500),
        reference_1_name    VARCHAR(200),
        reference_1_email   VARCHAR(200),
        reference_1_phone   VARCHAR(20),
        reference_2_name    VARCHAR(200),
        reference_2_email   VARCHAR(200),
        reference_2_phone   VARCHAR(20),
        reference_3_name    VARCHAR(200),
        reference_3_email   VARCHAR(200),
        reference_3_phone   VARCHAR(20),
        other_docs_url      VARCHAR(500),
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── DIGITAL SERVICES ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_services (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        icon_bg     VARCHAR(20)  DEFAULT '#e8f0eb',
        icon_color  VARCHAR(20)  DEFAULT '#2d6a4f',
        image_url   TEXT,
        features    JSONB        DEFAULT '[]',
        cta_label   VARCHAR(100),
        cta_link    VARCHAR(500),
        is_active   BOOLEAN      DEFAULT TRUE,
        sort_order  INTEGER      DEFAULT 0,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_digital_services_active ON digital_services(is_active);
      CREATE INDEX IF NOT EXISTS idx_digital_services_sort   ON digital_services(sort_order);
    `);

    // ── EXAM RESULTS ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id           SERIAL PRIMARY KEY,
        title        VARCHAR(255) NOT NULL,
        category     VARCHAR(50)  NOT NULL CHECK (category IN ('written', 'oral')),
        published_at DATE         NOT NULL,
        is_latest    BOOLEAN      NOT NULL DEFAULT FALSE,
        file_url     TEXT         NOT NULL,
        is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_exam_results_category   ON exam_results(category);
      CREATE INDEX IF NOT EXISTS idx_exam_results_active     ON exam_results(is_active);
      CREATE INDEX IF NOT EXISTS idx_exam_results_published  ON exam_results(published_at DESC);
    `);

    await client.query("COMMIT");
    console.log("✅ All migrations completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

migrate();
import bcrypt from 'bcryptjs';
import { db } from './database.ts';
import { awardPointsOnce, recomputeUserAchievements } from '../utils/points.ts';

export function seedDatabase(): void {
  const existingCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (existingCount > 0) {
    return;
  }

  const studentPass = bcrypt.hashSync('SkillBound2025', 10);
  const adminPass = bcrypt.hashSync('AdminSkill2025', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (
      full_name, email, password_hash, role, bio, location, major, year,
      experience_level, availability, avatar_url, points, total_sessions,
      rating_avg, rating_count, is_active, is_reported, report_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoUsers = [
    {
      name: 'Maya Lin',
      email: 'maya.lin@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Visual Arts & HCI junior focused on Figma component systems, user research, and responsive web layouts. Looking to sharpen Python automation and data structures.',
      location: 'Columbia University',
      major: 'Visual Arts & HCI',
      year: 'Junior',
      exp: 'Advanced',
      avail: 'Weekdays after 3:30 PM · Butler Library',
      points: 0,
      sessions: 2,
      rAvg: 5.0,
      rCnt: 2,
      reported: 0,
      reason: '',
    },
    {
      name: 'Alex Patel',
      email: 'alex.patel@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Passionate about backend algorithms, databases, and Python scripting. Looking to exchange technical foundations for visual layout, Figma component systems, and graphic design fundamentals.',
      location: 'Columbia University',
      major: 'Computer Science',
      year: 'Senior',
      exp: 'Advanced',
      avail: 'Mon, Wed, Fri after 4:00 PM · Butler Library Rm 301',
      points: 0,
      sessions: 8,
      rAvg: 4.9,
      rCnt: 4,
      reported: 0,
      reason: '',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Computer Science junior building full-stack React and Python automation pipelines. Eager to learn UI/UX prototyping and Figma auto-layout.',
      location: 'Columbia University',
      major: 'Computer Science',
      year: 'Junior',
      exp: 'Intermediate',
      avail: 'Tues & Thurs afternoons · Science Commons',
      points: 0,
      sessions: 6,
      rAvg: 5.0,
      rCnt: 3,
      reported: 0,
      reason: '',
    },
    {
      name: 'Sofia Rodriguez',
      email: 'sofia.rodriguez@barnard.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Data Science junior working on SQL analytics dashboards and Pandas pipelines. Happy to trade SQL mastery for user research and wireframing tips.',
      location: 'Barnard College',
      major: 'Data Science',
      year: 'Junior',
      exp: 'Advanced',
      avail: 'Thursdays 4:00 PM · Science & Engineering Library',
      points: 0,
      sessions: 12,
      rAvg: 5.0,
      rCnt: 5,
      reported: 0,
      reason: '',
    },
    {
      name: 'Jordan Lee',
      email: 'jordan.lee@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Economics & Statistics sophomore focused on econometrics and quantitative business analysis. Seeking conversational Spanish practice for study abroad.',
      location: 'Columbia University',
      major: 'Economics & Stats',
      year: 'Sophomore',
      exp: 'Intermediate',
      avail: 'Flexible weekends · Campus Study Room or Online',
      points: 0,
      sessions: 4,
      rAvg: 4.8,
      rCnt: 2,
      reported: 0,
      reason: '',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Cognitive Science master student specializing in usability testing and research synthesis. Looking for photography lighting and storytelling coaching.',
      location: 'Columbia University',
      major: 'Cognitive Science',
      year: 'Graduate',
      exp: 'Advanced',
      avail: 'Mon & Wed mornings · Northwest Corner Bldg',
      points: 0,
      sessions: 15,
      rAvg: 5.0,
      rCnt: 6,
      reported: 0,
      reason: '',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Architecture sophomore working with studio photography, composition, and Adobe Lightroom. Wants to learn public speaking and presentation communication.',
      location: 'Columbia University',
      major: 'Architecture',
      year: 'Sophomore',
      exp: 'Intermediate',
      avail: 'Fridays 1:00 PM - 5:00 PM · Avery Hall',
      points: 0,
      sessions: 5,
      rAvg: 4.7,
      rCnt: 2,
      reported: 0,
      reason: '',
    },
    {
      name: 'David Kim',
      email: 'david.kim@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Business & Marketing senior leading campus growth campaigns and financial modeling. Excited to pick up modern Web Development (React & Tailwind).',
      location: 'New York Campus',
      major: 'Business & Marketing',
      year: 'Senior',
      exp: 'Advanced',
      avail: 'Evenings after 6:00 PM · Lerner Hall',
      points: 0,
      sessions: 7,
      rAvg: 4.8,
      rCnt: 3,
      reported: 0,
      reason: '',
    },
    {
      name: 'Liam Patel',
      email: 'liam.patel@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Web developer and jazz guitarist building interactive frontend applications with React and TypeScript. Looking to learn digital marketing analytics.',
      location: 'New York Campus',
      major: 'Computer Engineering',
      year: 'Sophomore',
      exp: 'Intermediate',
      avail: 'Wed & Sat afternoons · Mudd Hall',
      points: 0,
      sessions: 3,
      rAvg: 4.9,
      rCnt: 2,
      reported: 0,
      reason: '',
    },
    {
      name: 'Jessica Lin',
      email: 'jessica.lin@barnard.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Bilingual Communications & Spanish literature student offering conversational Spanish and executive communication coaching. Wants to learn time management and photography.',
      location: 'Barnard College',
      major: 'Communications',
      year: 'Junior',
      exp: 'Intermediate',
      avail: 'Tue & Thu mornings · Milstein Center',
      points: 0,
      sessions: 5,
      rAvg: 4.9,
      rCnt: 2,
      reported: 1,
      reason: 'Late cancellation reported once by peer (under review)',
    },
    {
      name: 'Taylor Brooks',
      email: 'taylor.brooks@columbia.edu',
      hash: studentPass,
      role: 'student',
      bio: 'Music theory & personal productivity coach teaching acoustic guitar, music production, and habit systems. Looking to learn Web Development and Python.',
      location: 'Remote / Online',
      major: 'Music Technology',
      year: 'Senior',
      exp: 'Advanced',
      avail: 'Daily 5:00 PM - 8:00 PM · Online / Dodge Hall',
      points: 0,
      sessions: 4,
      rAvg: 4.6,
      rCnt: 2,
      reported: 0,
      reason: '',
    },
    {
      name: 'SkillBound Admin',
      email: 'admin@skillbound.edu',
      hash: adminPass,
      role: 'admin',
      bio: 'Campus Skill Exchange Moderator & Platform Administrator.',
      location: 'Columbia University',
      major: 'Administration',
      year: 'Staff',
      exp: 'Advanced',
      avail: 'Mon-Fri 9:00 AM - 5:00 PM',
      points: 0,
      sessions: 0,
      rAvg: 5.0,
      rCnt: 0,
      reported: 0,
      reason: '',
    },
  ];

  const userIds: Record<string, number> = {};
  for (const u of demoUsers) {
    const info = insertUser.run(
      u.name, u.email, u.hash, u.role, u.bio, u.location, u.major, u.year,
      u.exp, u.avail, '', u.points, u.sessions, u.rAvg, u.rCnt, 1, u.reported, u.reason
    );
    userIds[u.email] = Number(info.lastInsertRowid);
  }

  const insertSkill = db.prepare(`
    INSERT INTO skills (user_id, name, category, direction, proficiency, description, peers_taught)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const skillsData: Array<[string, string, string, 'teach' | 'learn', string, string, number]> = [
    // Maya Lin
    ['maya.lin@columbia.edu', 'Figma & UI Systems', 'Graphic Design', 'teach', 'Advanced', 'Component architecture, auto-layout, design tokens, and interactive prototyping.', 2],
    ['maya.lin@columbia.edu', 'User Research & Usability', 'Personal Development', 'teach', 'Intermediate', 'Conducting user interviews, synthesizing affinity maps, and unmoderated test setup.', 1],
    ['maya.lin@columbia.edu', 'Responsive Web Basics', 'Web Development', 'teach', 'Intermediate', 'Semantic HTML5, CSS Grid/Flexbox, Tailwind CSS, and accessible layout patterns.', 1],
    ['maya.lin@columbia.edu', 'Python Scripting & Automation', 'Programming', 'learn', 'Beginner', 'Automating data cleaning scripts and learning Pandas basics for coursework.', 0],
    ['maya.lin@columbia.edu', 'Data Structures & Algorithms', 'Programming', 'learn', 'Beginner', 'Preparing for tech interviews; focusing on binary trees, recursion, and time complexity.', 0],

    // Alex Patel
    ['alex.patel@columbia.edu', 'Python Scripting & Automation', 'Programming', 'teach', 'Advanced', 'Data pipelines, automation scripts, Pandas, and algorithm problem solving.', 5],
    ['alex.patel@columbia.edu', 'SQL & Relational Databases', 'Programming', 'teach', 'Intermediate', 'Query optimization, schema architecture, and PostgreSQL join logic.', 2],
    ['alex.patel@columbia.edu', 'Data Structures & Algorithms', 'Programming', 'teach', 'Advanced', 'Binary search trees, graph traversal, and technical interview prep.', 3],
    ['alex.patel@columbia.edu', 'Graphic Design & Figma UI', 'Graphic Design', 'learn', 'Beginner', 'Color harmony, auto-layout rules, component nesting, and portfolio design.', 0],
    ['alex.patel@columbia.edu', 'Responsive Web Basics', 'Web Development', 'learn', 'Beginner', 'Modern layout patterns with CSS Grid and responsive typography.', 0],

    // Marcus Vance
    ['marcus.vance@columbia.edu', 'Python Scripting & Automation', 'Programming', 'teach', 'Intermediate', 'Backend Python scripts, REST API integration, and clean tooling.', 3],
    ['marcus.vance@columbia.edu', 'Figma & UI Systems', 'Graphic Design', 'learn', 'Beginner', 'Learning Figma component libraries and rapid clickable prototypes.', 0],

    // Sofia Rodriguez
    ['sofia.rodriguez@barnard.edu', 'SQL Query Optimization', 'Programming', 'teach', 'Advanced', 'Window functions, query plan tuning, and analytics dashboards.', 6],
    ['sofia.rodriguez@barnard.edu', 'Python Data Analysis', 'Programming', 'teach', 'Advanced', 'Pandas, NumPy, and exploratory visual storytelling.', 4],
    ['sofia.rodriguez@barnard.edu', 'User Research & Usability', 'Personal Development', 'learn', 'Beginner', 'Usability testing protocols and stakeholder interview synthesis.', 0],

    // Jordan Lee
    ['jordan.lee@columbia.edu', 'Financial & Business Modeling', 'Business', 'teach', 'Intermediate', 'Unit economics, valuation spreadsheets, and microeconomic forecasting.', 2],
    ['jordan.lee@columbia.edu', 'Conversational Spanish', 'Languages', 'learn', 'Beginner', 'Everyday campus conversation and pronunciation for study abroad.', 0],

    // Priya Sharma
    ['priya.sharma@columbia.edu', 'User Research & Usability', 'Communication', 'teach', 'Advanced', 'Moderated usability sessions, research synthesis, and clear presentation.', 7],
    ['priya.sharma@columbia.edu', 'Portrait Photography', 'Photography', 'learn', 'Beginner', 'Natural window lighting, framing, and DSLR aperture control.', 0],

    // Elena Rostova
    ['elena.rostova@columbia.edu', 'Portrait & Studio Photography', 'Photography', 'teach', 'Advanced', 'Composition, studio lighting, and Lightroom color grading.', 3],
    ['elena.rostova@columbia.edu', 'Public Speaking & Communication', 'Communication', 'learn', 'Beginner', 'Structuring persuasive studio critiques and keynote confidence.', 0],

    // David Kim
    ['david.kim@columbia.edu', 'Digital Marketing Strategy', 'Marketing', 'teach', 'Advanced', 'Growth funnels, copywriting, campaign analytics, and brand positioning.', 4],
    ['david.kim@columbia.edu', 'Business Pitching', 'Business', 'teach', 'Advanced', 'Investor deck narrative and crisp startup storytelling.', 2],
    ['david.kim@columbia.edu', 'React & Web Development', 'Web Development', 'learn', 'Beginner', 'Building interactive single-page web applications with React.', 0],

    // Liam Patel
    ['liam.patel@columbia.edu', 'React & Web Development', 'Web Development', 'teach', 'Advanced', 'Modern React hooks, TypeScript components, and state architecture.', 2],
    ['liam.patel@columbia.edu', 'Acoustic Guitar Basics', 'Music', 'teach', 'Intermediate', 'Chord progressions, fingerpicking, and rhythm ear training.', 1],
    ['liam.patel@columbia.edu', 'Digital Marketing Strategy', 'Marketing', 'learn', 'Beginner', 'Audience segmentation and product launch growth channels.', 0],

    // Jessica Lin
    ['jessica.lin@barnard.edu', 'Conversational Spanish', 'Languages', 'teach', 'Advanced', 'Fluent conversation practice, idioms, and academic writing.', 3],
    ['jessica.lin@barnard.edu', 'Public Speaking & Communication', 'Communication', 'teach', 'Intermediate', 'Debate framing, active listening, and confident delivery.', 2],
    ['jessica.lin@barnard.edu', 'Portrait & Studio Photography', 'Photography', 'learn', 'Beginner', 'Manual exposure basics and campus editorial photography.', 0],

    // Taylor Brooks
    ['taylor.brooks@columbia.edu', 'Music Production & Guitar', 'Music', 'teach', 'Advanced', 'Songwriting, Ableton Live mixing, and acoustic arrangement.', 3],
    ['taylor.brooks@columbia.edu', 'Time Management & Focus', 'Personal Development', 'teach', 'Intermediate', 'Weekly academic planning and sustainable study systems.', 2],
    ['taylor.brooks@columbia.edu', 'Python Scripting & Automation', 'Programming', 'learn', 'Beginner', 'Writing small utilities and automating audio file workflows.', 0],
  ];

  for (const [email, name, cat, dir, prof, desc, taught] of skillsData) {
    insertSkill.run(userIds[email], name, cat, dir, prof, desc, taught);
  }

  // Learning Requests
  const insertReq = db.prepare(`
    INSERT INTO learning_requests (sender_id, receiver_id, teach_skill_name, learn_skill_name, proposed_slot, proposed_location, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const mayaId = userIds['maya.lin@columbia.edu'];
  const alexId = userIds['alex.patel@columbia.edu'];
  const marcusId = userIds['marcus.vance@columbia.edu'];
  const sofiaId = userIds['sofia.rodriguez@barnard.edu'];
  const elenaId = userIds['elena.rostova@columbia.edu'];
  const davidId = userIds['david.kim@columbia.edu'];
  const liamId = userIds['liam.patel@columbia.edu'];
  const priyaId = userIds['priya.sharma@columbia.edu'];
  const jordanId = userIds['jordan.lee@columbia.edu'];

  // Marcus -> Maya (Pending)
  insertReq.run(
    marcusId,
    mayaId,
    'Python Scripting & Automation',
    'Figma & UI Systems',
    'Tomorrow, 3:30 PM',
    'Butler Library, Room 302',
    'Hey Maya! Saw your Figma component tutorials. Would love to trade 1 hour on auto-layout for 1 hour on backend Python scripts for your capstone.',
    'Pending'
  );

  // Sofia -> Maya (Accepted)
  const sofiaReqId = Number(
    insertReq.run(
      sofiaId,
      mayaId,
      'SQL Query Optimization',
      'User Research & Usability',
      'Thursday, 4:00 PM',
      'Science & Engineering Library',
      'Let us meet at Science & Engineering Library this Thursday at 4 PM to swap SQL optimization and user research methods!',
      'Accepted'
    ).lastInsertRowid
  );

  // Elena -> Maya (Rejected)
  insertReq.run(
    elenaId,
    mayaId,
    'Portrait & Studio Photography',
    'Figma & UI Systems',
    'Friday, 2:00 PM',
    'Avery Hall',
    'Would love to trade studio photography tips for Figma basics.',
    'Rejected'
  );

  // Maya -> Alex (Accepted -> links to upcoming session)
  const alexReqId = Number(
    insertReq.run(
      mayaId,
      alexId,
      'Figma & UI Systems',
      'Python Scripting & Automation',
      'Saturday, 4:00 PM',
      'Butler Library, Room 301',
      'Hi Alex! Saw your profile on Discover. Happy to swap 1-for-1 Figma design critique for Python scripting.',
      'Accepted'
    ).lastInsertRowid
  );

  // Maya -> David (Pending Sent)
  insertReq.run(
    mayaId,
    davidId,
    'Responsive Web Basics',
    'Digital Marketing Strategy',
    'Next Monday, 5:30 PM',
    'Lerner Hall',
    'Would love to learn digital growth funnels in exchange for Tailwind/HTML layout coaching.',
    'Pending'
  );

  // Sessions
  const insertSession = db.prepare(`
    INSERT INTO sessions (request_id, teacher_id, learner_id, title, teach_skill_name, learn_skill_name, date_str, time_str, location, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Upcoming Session between Alex (teacher of Python) and Maya (learner of Python / teaches Figma)
  insertSession.run(
    alexReqId,
    alexId,
    mayaId,
    'Python Scripting & Figma Systems Swap',
    'Python Scripting & Automation',
    'Figma & UI Systems',
    '2026-11-21',
    '4:00 PM – 5:00 PM',
    'Butler Library, Room 301',
    'Hands-on walkthrough of Python data processing scripts in exchange for Figma design system component setup.',
    'Upcoming'
  );

  // Completed Session between Sofia and Maya (needs Maya's review!)
  const sofiaSessionId = Number(
    insertSession.run(
      sofiaReqId,
      sofiaId,
      mayaId,
      'SQL Optimization & User Research Swap',
      'SQL Query Optimization',
      'User Research & Usability',
      '2026-11-10',
      '4:00 PM – 5:00 PM',
      'Science & Engineering Library',
      'Covered SQL index tuning, query plan analysis, and foundational user interview heuristics.',
      'Completed'
    ).lastInsertRowid
  );

  // Completed Session between Marcus and Maya (already reviewed)
  const marcusCompletedSessionId = Number(
    insertSession.run(
      null,
      marcusId,
      mayaId,
      'Backend Python APIs & Figma Prototyping',
      'Python Scripting & Automation',
      'Figma & UI Systems',
      '2026-11-04',
      '3:30 PM – 4:30 PM',
      'Science Commons',
      'Walked through FastAPI routes and interactive Figma prototype flows.',
      'Completed'
    ).lastInsertRowid
  );

  // Cancelled Session
  insertSession.run(
    null,
    elenaId,
    mayaId,
    'Studio Photography & Figma Basics',
    'Portrait & Studio Photography',
    'Figma & UI Systems',
    '2026-11-02',
    '2:00 PM – 3:00 PM',
    'Avery Hall',
    'Cancelled due to conflicting architecture studio review.',
    'Cancelled'
  );

  // Additional Completed Session for Alex & Liam so leaderboard has rich data
  const liamSessionId = Number(
    insertSession.run(
      null,
      liamId,
      alexId,
      'React Architecture & Algorithms Swap',
      'React & Web Development',
      'Data Structures & Algorithms',
      '2026-11-08',
      '5:00 PM – 6:00 PM',
      'Mudd Hall',
      'Covered React state patterns and graph traversal problems.',
      'Completed'
    ).lastInsertRowid
  );

  // Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, tags_json, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    marcusCompletedSessionId,
    mayaId,
    marcusId,
    5,
    JSON.stringify(['Helpful', 'Knowledgeable', 'Well prepared']),
    'Marcus explained Python scripting step-by-step and brought great real-world datasets!'
  );
  insertReview.run(
    marcusCompletedSessionId,
    marcusId,
    mayaId,
    5,
    JSON.stringify(['Friendly', 'Good communication', 'Well prepared']),
    'Maya helped me reorganize my entire Figma component library in under an hour.'
  );
  insertReview.run(
    liamSessionId,
    alexId,
    liamId,
    5,
    JSON.stringify(['Helpful', 'Knowledgeable']),
    'Clear breakdown of TypeScript hooks and clean component structure.'
  );

  // Conversations & Messages
  const insertConv = db.prepare(`
    INSERT INTO conversations (participant1_id, participant2_id, last_message_at)
    VALUES (?, ?, datetime('now'))
  `);
  const insertMsg = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const conv1Id = Number(insertConv.run(Math.min(mayaId, alexId), Math.max(mayaId, alexId)).lastInsertRowid);
  insertMsg.run(conv1Id, alexId, 'Hey Maya! Excited for our Python ↔ Figma swap at Butler Library Room 301.', 1, '2026-11-18 14:10:00');
  insertMsg.run(conv1Id, mayaId, 'Same here! I prepared a Figma auto-layout starter file we can walk through together.', 1, '2026-11-18 14:15:00');
  insertMsg.run(conv1Id, alexId, 'Awesome, I will bring a couple of Pandas CSV cleaning scripts for your coursework.', 0, '2026-11-18 16:02:00');

  const conv2Id = Number(insertConv.run(Math.min(mayaId, sofiaId), Math.max(mayaId, sofiaId)).lastInsertRowid);
  insertMsg.run(conv2Id, sofiaId, 'Thanks for the awesome user research session! Let me know if you have follow-up SQL questions.', 1, '2026-11-11 10:00:00');
  insertMsg.run(conv2Id, mayaId, 'Thank you Sofia! The query plan tips saved me hours on my project.', 1, '2026-11-11 10:12:00');

  // Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run(mayaId, 'request', 'New Skill Exchange Request', 'Marcus Vance wants to swap Python Scripting for Figma & UI Systems.', '/requests', 0);
  insertNotif.run(mayaId, 'message', 'New Message from Alex Patel', 'Awesome, I will bring a couple of Pandas CSV cleaning scripts.', '/messages', 0);
  insertNotif.run(mayaId, 'session', 'Upcoming Session Reminder', 'Python Scripting & Figma Systems Swap at Butler Library, Room 301.', '/sessions', 1);

  // Award initial points idempotently so leaderboard & points history are 100% consistent
  awardPointsOnce(mayaId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(mayaId, 'session_learn', sofiaSessionId, 50, 'Completed learning session: SQL Query Optimization');
  awardPointsOnce(mayaId, 'session_learn', marcusCompletedSessionId, 50, 'Completed learning session: Backend Python APIs');
  awardPointsOnce(mayaId, 'positive_review', marcusCompletedSessionId, 10, 'Received 5-star review from Marcus Vance');

  awardPointsOnce(alexId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(alexId, 'session_teach', 'seed_1', 30, 'Taught Python Scripting');
  awardPointsOnce(alexId, 'session_learn', liamSessionId, 50, 'Completed learning session: React & Web Development');
  awardPointsOnce(alexId, 'positive_review', 'seed_rev_1', 10, 'Received positive peer review');

  awardPointsOnce(sofiaId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(sofiaId, 'session_teach', sofiaSessionId, 30, 'Taught SQL Query Optimization');
  awardPointsOnce(sofiaId, 'session_learn', 'seed_sofia_1', 50, 'Completed peer learning exchange');
  awardPointsOnce(sofiaId, 'session_teach', 'seed_sofia_2', 30, 'Taught Python Data Analysis');

  awardPointsOnce(marcusId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(marcusId, 'session_teach', marcusCompletedSessionId, 30, 'Taught Backend Python APIs');
  awardPointsOnce(marcusId, 'positive_review', marcusCompletedSessionId, 10, 'Received 5-star review from Maya Lin');

  awardPointsOnce(priyaId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(priyaId, 'session_teach', 'seed_priya_1', 30, 'Taught User Research & Usability');
  awardPointsOnce(priyaId, 'session_learn', 'seed_priya_2', 50, 'Completed learning session');
  awardPointsOnce(priyaId, 'session_teach', 'seed_priya_3', 30, 'Taught Usability Heuristics');

  awardPointsOnce(liamId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(liamId, 'session_teach', liamSessionId, 30, 'Taught React & Web Development');
  awardPointsOnce(liamId, 'positive_review', liamSessionId, 10, 'Received 5-star review from Alex Patel');

  awardPointsOnce(davidId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(davidId, 'session_teach', 'seed_david_1', 30, 'Taught Digital Marketing Strategy');

  awardPointsOnce(jordanId, 'profile_complete', 'initial', 20, 'Completed campus profile');
  awardPointsOnce(elenaId, 'profile_complete', 'initial', 20, 'Completed campus profile');

  for (const email of Object.keys(userIds)) {
    if (email !== 'admin@skillbound.edu') {
      recomputeUserAchievements(userIds[email]);
    }
  }
}

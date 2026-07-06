// ============================================================
// SUPABASE INIT (safe — must never break the rest of the app)
// ============================================================
const SUPABASE_URL = "https://vmvsxxtaqtvaotrooafq.supabase.co";
const SUPABASE_KEY = "sb_publishable_LEnh4oxd15-H9WbrUxlttQ_M046BB5u";

let supabaseClient = null;

try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase connected:", supabaseClient);
  } else {
    console.error("Supabase SDK not found on window. Auth will be disabled.");
  }
} catch (err) {
  console.error("Supabase failed to initialize. Continuing without auth:", err);
}

// ============================================================
// STATIC QUESTION BANK (Your Core Questions)
// ============================================================
const QUESTION_BANK = {
  "Ice Breakers": [
    "What made you smile this week?", "What is one small thing that makes your day better?",
    "What is your favorite way to spend a free evening?", "What is something most people do not know about you?",
    "What was the best part of your day today?", "Are you more of a morning person or a night person?",
    "What is one thing you are really good at?", "What is your comfort food?",
    "What app do you use too much?", "What is one habit you want to build?",
    "What is your favorite place in your city?", "What is one thing you always notice about people?",
    "What kind of music gives you energy?", "What is your favorite season and why?",
    "What is one thing you would like to try this year?", "What is your favorite smell?",
    "What is a simple thing that always makes you happy?", "What is your favorite way to relax?",
    "What is one thing you are proud of this month?", "What do you usually do when you have free time?",
    "What is your favorite drink?", "What is your favorite day of the week?",
    "What is one small goal you have right now?", "What is something you can talk about for hours?",
    "What is your favorite thing about your hometown?", "What is one thing you want to learn?",
    "What is your favorite memory from school?", "What is something that gives you energy?",
    "What is one thing you always carry with you?", "What is your favorite way to start the day?"
  ],
  "Travel": [
    "If you could live in any country for one year, where would you go?", "What city surprised you the most?",
    "Beach, mountains, or city trip?", "What is your dream travel route?",
    "What is the best food you have tried while traveling?", "Would you rather travel alone or with friends?",
    "What country feels mysterious to you?", "What is one place in Russia you want to visit?",
    "What is your best travel memory?", "What travel mistake taught you something?",
    "What country would you visit again?", "Do you prefer hotels, apartments, or camping?",
    "What is the longest trip you have ever taken?", "What is the most beautiful place you have seen?",
    "What city would you like to explore at night?", "What travel item is always in your bag?",
    "Would you rather travel by plane, train, or car?", "What is your favorite airport or train station experience?",
    "What is one country you know almost nothing about but want to visit?", "Do you plan trips carefully or improvise?",
    "What is your perfect weekend trip?", "What place feels overrated to you?",
    "What place feels underrated to you?", "What is the scariest travel experience you had?",
    "Would you rather travel to the past or the future?", "What local tradition from another country do you like?",
    "What is the best souvenir you have bought?", "What language would help you travel more easily?",
    "What is your favorite type of landscape?", "Where would you go if you had a free ticket tomorrow?"
  ],
  "Funny": [
    "What is the funniest misunderstanding you have ever had?", "If animals could talk, which animal would be the rudest?",
    "What is the most useless superpower you can imagine?", "What is your most embarrassing small mistake?",
    "If your life had a soundtrack, what song would play today?", "What food do you secretly judge people for liking?",
    "What is something silly you believed as a child?", "If you had to rename yourself, what name would you choose?",
    "What would you do if you became invisible for one hour?", "What is a harmless lie people often tell?",
    "What is the worst advice you have ever heard?", "What is the weirdest thing in your room?",
    "What is a funny habit you have?", "What is the strangest compliment you have received?",
    "What would your pet say about you?", "What is the funniest thing you have seen online recently?",
    "What is your most irrational fear?", "What job would be terrible if people had to sing all day?",
    "What would you do if you woke up as a cat?", "What is the funniest excuse for being late?",
    "What is the weirdest food combination you like?", "If your phone could talk, what would it complain about?",
    "What is something adults do that is actually childish?", "What is the worst name for a restaurant?",
    "What is the funniest thing a child has said to you?", "What is one thing you are bad at but still enjoy?",
    "What is the most dramatic reaction to a small problem?", "If you opened a useless business, what would it sell?",
    "What is the funniest way to introduce yourself?", "What is a normal thing that feels illegal?"
  ],
  "Deep": [
    "What does success mean to you?", "What advice would you give your younger self?",
    "What are you currently trying to improve in yourself?", "What makes a person truly interesting?",
    "What is a fear you want to overcome?", "What kind of life do you want in ten years?",
    "What is something money cannot buy?", "What is one decision that changed your life?",
    "What do you want people to remember about you?", "What does freedom mean to you?",
    "What is one lesson life taught you recently?", "What makes you feel alive?",
    "What kind of people inspire you?", "What is something you are still healing from?",
    "What does a peaceful life look like to you?", "What is one thing you wish people understood better?",
    "What is the difference between being busy and being productive?", "What is one belief you changed your mind about?",
    "What is something you need to forgive yourself for?", "What makes a friendship strong?",
    "What does loyalty mean to you?", "What is one thing you would never sell for money?",
    "What does happiness mean to you?", "What is something you are grateful for today?",
    "What is the hardest truth to accept?", "What kind of legacy do you want to leave?",
    "What is a moment that made you stronger?", "What do you think people worry about too much?",
    "What is something simple that feels meaningful?", "What is one question you ask yourself often?"
  ],
  "Career": [
    "What would your dream job look like?", "What skill would help you earn more money?",
    "Would you rather work for yourself or for a company?", "What is one business idea you find interesting?",
    "What is the best work advice you have heard?", "What motivates you more: money, freedom, or recognition?",
    "What job would you never want to do?", "What is one thing you learned from work?",
    "What makes a good leader?", "Would you rather be a specialist or a generalist?",
    "What is the hardest part of your work?", "What is one skill everyone should learn?",
    "What makes a workplace toxic?", "What makes a workplace healthy?",
    "Would you rather earn more or have more free time?", "What is one mistake people make in business?",
    "What kind of boss would you be?", "What is a job that deserves more respect?",
    "What is one thing you want to build in your career?", "What is your biggest work-related goal?",
    "What makes a person professional?", "What is the best way to deal with stress at work?",
    "What is one business you would never start?", "What is one business you would love to own?",
    "What do customers really care about?", "What makes service excellent?",
    "What is one thing you learned from a difficult customer?", "What is better: talent or discipline?",
    "What is one thing you would change about your work life?", "What does financial freedom mean to you?"
  ],
  "Movies": [
    "What movie can you watch again and again?", "Which character do you relate to?",
    "What film ending disappointed you?", "Would you rather live in a comedy, action movie, or fantasy movie?",
    "What movie made you think deeply?", "What series are you watching now?",
    "Which actor always makes a movie better?", "What is your favorite movie quote?",
    "What movie would you recommend to everyone?", "What childhood cartoon do you still like?",
    "What movie villain do you secretly like?", "What movie made you cry?",
    "What movie made you laugh the most?", "What series is overrated?",
    "What series is underrated?", "What movie world would you like to visit?",
    "What character would be your best friend?", "What movie do you hate but everyone loves?",
    "What movie do you love but others dislike?", "What is the best movie soundtrack?",
    "Do you prefer movies or series?", "What movie genre do you never get tired of?",
    "What movie scene do you remember clearly?", "What actor would play you in a movie?",
    "What movie taught you something?", "What film should never get a remake?",
    "What movie has the best atmosphere?", "What is your favorite animated movie?",
    "What movie would you show to a foreign friend?", "What movie changed your mood completely?"
  ],
  "Food": [
    "What food could you eat every day?", "What dish represents your family?",
    "What is the best café or restaurant in your city?", "Do you prefer cooking or ordering food?",
    "What food do you dislike that everyone else seems to love?", "What is your perfect breakfast?",
    "What country has the best cuisine?", "Sweet or salty?",
    "What is one dish you want to learn to cook?", "What is your guilty pleasure snack?",
    "What is your favorite street food?", "What food reminds you of childhood?",
    "What is the best thing to eat late at night?", "What is your favorite homemade dish?",
    "What drink do you order most often?", "What is one food you will never try again?",
    "What is the best sauce?", "What is the most overrated food?",
    "What is the most underrated food?", "What is your favorite dessert?",
    "Would you rather eat only meat or only vegetables for a week?", "What is the perfect food for a cold day?",
    "What food makes people happy?", "What is your favorite barbecue food?",
    "What is one dish you cook well?", "What food trend you do not understand?",
    "What food would you miss abroad?", "What is better: simple food or fancy food?",
    "What is your favorite comfort meal?", "What food would serve to impress guests?"
  ],
  "Dreams": [
    "What is one big dream you rarely talk about?", "If money was not a problem, what would you do?",
    "What kind of house would you like to live in?", "What would your perfect weekend look like?",
    "What is one thing you want to experience at least once?", "What would you do if you had one year completely free?",
    "What does your ideal morning look like?", "What is a dream you had as a child?",
    "What goal are you afraid to start?", "What would make this year unforgettable for you?",
    "What is one place you dream of visiting?", "What skill do you dream of mastering?",
    "What would your perfect life look like?", "What would you do if you knew you could not fail?",
    "What is one thing you want to own someday?", "What kind of family life do you dream about?",
    "What is one dream you already achieved?", "What dream changed as you got older?",
    "What would you build if you had unlimited resources?", "What is one adventure you want to have?",
    "What would your dream business be?", "What would your dream vacation look like?",
    "What is one thing you want to do before turning 40?", "What would make you feel truly successful?",
    "What is one dream that scares you?", "What future version of yourself do you want to meet?",
    "What is one goal you want to start this month?", "What would your ideal city look like?",
    "What is one thing you want to be remembered for?", "What dream is worth working hard for?"
  ],
  "Tech & AI": [
    "Will AI replace creative jobs entirely, or just make them easier?", "What is an old piece of technology you miss?",
    "If you could install any skill directly into your brain, what would it be?", "Are smart devices making us dumber?",
    "Would you agree to live in a perfectly designed virtual reality forever?", "What is the most annoying thing about social media?",
    "How much screen time is too much for an adult?", "What technology from sci-fi movies do you want to see invented next?",
    "Do you remember life before smartphones? What was better about it?", "Would you trust a self-driving car to take you across the country?",
    "What app completely changed how you live your life?", "If you could delete one social media platform from existence, which would it be?"
  ],
  "Mindset & Habits": [
    "What is a bad habit you broke, and how did you do it?", "Why is it so hard to say 'no' to people sometimes?",
    "What triggers your stress the most, and how do you cool down?", "Do you think people can genuinely change their core personality?",
    "What does your morning routine say about your current mental state?", "How do you handle negative criticism?",
    "What is the best psychological trick you know for dealing with people?", "Do you listen to understand or listen to reply?",
    "What is something you pretend to care about just to be polite?", "How long can you sit completely alone with your thoughts?"
  ]
};

// ============================================================
// COMBINATORIAL ENGINE (Generates thousands of extra variations)
// ============================================================
const COMBINATORS = {
  templates: [
    "If you could combine {thing1} and {thing2}, what would happen?",
    "What is the absolute best advice regarding {topic} you would give to {target}?",
    "How will technology completely transform our approach to {topic} in 10 years?",
    "Would you rather deal with a lifetime of {annoyance} or never experience {pleasure} again?",
    "What is the most underrated aspect of {topic} that nobody talks about?",
    "In your opinion, does {concept1} always lead to {concept2}?",
    "If you had to write a book titled 'The Secret of {topic}', what would the first chapter say?",
    "What is the biggest myth people actively believe about {topic}?"
  ],
  tokens: {
    thing1: ["modern AI", "gourmet food", "space travel", "social media", "cryptocurrency", "classic cinema"],
    thing2: ["daily habits", "ancient philosophy", "career goals", "romantic relationships", "mental health"],
    topic: ["personal finance", "emotional growth", "modern dating", "career scaling", "remote work", "creative writing"],
    target: ["a teenager", "your future self", "a starting entrepreneur", "someone moving abroad"],
    annoyance: ["slow internet connections", "bad restaurant service", "toxic coworkers", "micromanagers"],
    pleasure: ["home-cooked meals", "spontaneous solo travel", "deep late-night conversations", "financial safety"],
    concept1: ["extreme discipline", "complete freedom", "unlimited money", "total isolation"],
    concept2: ["genuine happiness", "massive career success", "mental burnout", "artistic inspiration"]
  }
};

// Flatten out the base bank questions safely
const staticQuestions = Object.entries(QUESTION_BANK).flatMap(([category, qs]) =>
  qs.map((text, idx) => ({ id: `${category}-${idx}`, category, text }))
);

// Procedural generator to append thousands of algorithmic options seamlessly
function generateDynamicQuestions() {
  const dynamicList = [];
  let counter = 0;
  
  for (const template of COMBINATORS.templates) {
    const neededTokens = [...template.matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
    
    if (neededTokens.length === 2) {
      const arr1 = COMBINATORS.tokens[neededTokens[0]];
      const arr2 = COMBINATORS.tokens[neededTokens[1]];
      if (arr1 && arr2) {
        for (const t1 of arr1) {
          for (const t2 of arr2) {
            let qText = template.replace(`{${neededTokens[0]}}`, t1).replace(`{${neededTokens[1]}}`, t2);
            dynamicList.push({
              id: `Dynamic-2B-${counter++}`,
              category: "Deep",
              text: qText
            });
          }
        }
      }
    } else if (neededTokens.length === 1) {
      const arr = COMBINATORS.tokens[neededTokens[0]];
      if (arr) {
        for (const t of arr) {
          let qText = template.replace(`{${neededTokens[0]}}`, t);
          dynamicList.push({
            id: `Dynamic-1B-${counter++}`,
            category: "Ice Breakers",
            text: qText
          });
        }
      }
    }
  }
  return dynamicList;
}

// Assemble static and dynamically generated questions into one single production pool
const allQuestions = [...staticQuestions, ...generateDynamicQuestions()];
let selectedCategory = 'All';

// ============================================================
// QUESTION FUNCTIONS
// ============================================================
function initQuestions() {
  const select = document.getElementById('categorySelect');
  if (!select) return;

  select.innerHTML = ['All', ...Object.keys(QUESTION_BANK)]
    .map(c => `<option>${c}</option>`)
    .join('');

  select.addEventListener('change', () => {
    selectedCategory = select.value;
    updateStats();
  });

  updateStats();
}

let seenCache = [];

function getSeen() {
  return seenCache;
}

function setSeen(seen) {
  seenCache = seen;
  localStorage.setItem('gsc_seen_questions', JSON.stringify(seen));
}

function pool() {
  return allQuestions.filter(q => selectedCategory === 'All' || q.category === selectedCategory);
}

async function nextQuestion() {
  const seen = getSeen();
  const available = pool().filter(q => !seen.includes(q.id));

  if (!available.length) {
    document.getElementById('questionText').textContent =
      'All questions in this category have been shown. Reset to start again.';
    updateStats();
    return;
  }

  const q = available[Math.floor(Math.random() * available.length)];
  seen.push(q.id);
  setSeen(seen);

  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (data && data.user) {
        await supabaseClient
          .from('user_question_history')
          .upsert({
            user_id: data.user.id,
            question_id: q.id,
            category: q.category,
            question_text: q.text,
            action: 'seen'
          });
      }
    } catch (e) {
      console.error("Failed to sync question view to Supabase:", e);
    }
  }

  document.getElementById('questionText').textContent = q.text;
  document.getElementById('questionCounter').textContent = '#' + String(seen.length).padStart(3, '0');
  updateStats();
}

async function resetQuestions() {
  setSeen([]);
  localStorage.removeItem('gsc_seen_questions');

  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (data && data.user) {
        const { error } = await supabaseClient
          .from('user_question_history')
          .delete()
          .eq('user_id', data.user.id);

        if (error) {
          console.error('Reset question history error:', error);
        }
      }
    } catch (e) {
      console.error("Supabase connection error during reset:", e);
    }
  }

  document.getElementById('questionText').textContent = 'Questions reset. Tap Next Question.';
  document.getElementById('questionCounter').textContent = '#001';
  updateStats();
}

function updateStats() {
  const seen = getSeen();
  const currentPool = pool();
  const seenInCategory = currentPool.filter(q => seen.includes(q.id)).length;

  document.getElementById('answeredCount').textContent = seen.length;
  document.getElementById('uniqueCount').textContent = seenInCategory;
  document.getElementById('remainingCount').textContent = Math.max(0, currentPool.length - seenInCategory);
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================
async function loadQuestionHistory(user) {
  if (!supabaseClient || !user) return;

  const { data, error } = await supabaseClient
    .from('user_question_history')
    .select('question_id')
    .eq('user_id', user.id);

  if (error) {
    console.error('Load question history error:', error);
    return;
  }

  const seen = (data || []).map(row => row.question_id);
  setSeen(seen);
  updateStats();

  console.log('Question history loaded:', seen);
}

async function initAuth() {
  if (!supabaseClient) {
    renderAuthState(null);
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) console.error("getSession error:", error);
    
    renderAuthState(data && data.session ? data.session.user : null);

    if (data && data.session) {
      await loadQuestionHistory(data.session.user);
    }

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      renderAuthState(session ? session.user : null);
      if (session) {
        await loadQuestionHistory(session.user);
      }
    });
   
  } catch (err) {
    console.error("Auth init failed:", err);
    renderAuthState(null);
  }
}

async function openAuth() {
  if (!supabaseClient) {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('hidden');
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://www.galstyansspeakingclub.ru"
    }
  });

  if (error) {
    alert(error.message);
    console.error(error);
  }
}

function closeAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

async function logout() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) console.error("Logout error:", error);
  renderAuthState(null);
}

function renderAuthState(user) {
  const authButton = document.getElementById('authButton');
  const loggedOutBlock = document.getElementById('accountLoggedOut');
  const loggedInBlock = document.getElementById('accountLoggedIn');
  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const avatarEl = document.getElementById('userAvatar');

  if (user) {
    const meta = user.user_metadata || {};
    const displayName = meta.full_name || meta.name || user.email || 'Member';
    const avatarUrl = meta.avatar_url || meta.picture || '';
    ensureUserProfile(user);

    if (authButton) authButton.textContent = 'My Account';
    if (loggedOutBlock) loggedOutBlock.classList.add('hidden');
    if (loggedInBlock) loggedInBlock.classList.remove('hidden');
    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = user.email || '';

    if (avatarEl) {
      if (avatarUrl) {
        avatarEl.src = avatarUrl;
        avatarEl.classList.remove('hidden');
      } else {
        avatarEl.classList.add('hidden');
      }
    }

    closeAuth();
  } else {
    if (authButton) authButton.textContent = 'Login / Register';
    if (loggedOutBlock) loggedOutBlock.classList.remove('hidden');
    if (loggedInBlock) loggedInBlock.classList.add('hidden');
  }
}

async function ensureUserProfile(user) {
  if (!supabaseClient || !user) return;

  const meta = user.user_metadata || {};
  const profile = {
    id: user.id,
    full_name: meta.full_name || meta.name || user.email || 'Member',
    avatar_url: meta.avatar_url || meta.picture || '',
    role: 'member'
  };

  const { error } = await supabaseClient
    .from('user_profiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) {
    console.error('Profile upsert error:', error);
  } else {
    console.log('User profile synced:', profile);
  }
}

// ============================================================
// LOCAL DEMO PROFILE (unchanged — kept for later Supabase migration)
// ============================================================
function attachMemberForm() {
  const form = document.getElementById('memberForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {
      name: document.getElementById('memberName').value,
      telegram: document.getElementById('memberTelegram').value,
      level: document.getElementById('memberLevel').value,
      interests: document.getElementById('memberInterests').value,
      visits: 0
    };
    localStorage.setItem('gsc_profile', JSON.stringify(profile));
    renderProfile();
  });
}

function renderProfile() {
  const profile = JSON.parse(localStorage.getItem('gsc_profile') || 'null');
  if (!profile) return;

  const card = document.getElementById('profileCard');
  if (!card) return;

  const remaining = 7 - (profile.visits % 7 || 0);
  card.classList.remove('hidden');
  card.innerHTML = `
    <h3>GSC Member</h3>
    <p><b>${profile.name}</b> · ${profile.level}</p>
    <p>Telegram: ${profile.telegram || '—'}</p>
    <p>Interests: ${profile.interests || '—'}</p>
    <p>Meetups attended: <b>${profile.visits}</b></p>
    <p>Next free meetup in: <b>${remaining === 7 ? 7 : remaining}</b></p>
  `;
}

function saveAttendance() {
  const name = document.getElementById('adminName').value.trim();
  const visits = Number(document.getElementById('adminVisits').value || 0);
  if (!name) return;

  const data = JSON.parse(localStorage.getItem('gsc_attendance') || '{}');
  data[name] = visits;
  localStorage.setItem('gsc_attendance', JSON.stringify(data));

  const profile = JSON.parse(localStorage.getItem('gsc_profile') || 'null');
  if (profile && profile.name.toLowerCase() === name.toLowerCase()) {
    profile.visits = visits;
    localStorage.setItem('gsc_profile', JSON.stringify(profile));
    renderProfile();
  }

  renderAttendance();
}

function renderAttendance() {
  const data = JSON.parse(localStorage.getItem('gsc_attendance') || '{}');
  const list = document.getElementById('attendanceList');
  if (!list) return;

  list.innerHTML = Object.entries(data)
    .map(([name, visits]) => `
      <div class="attendance-item">
        <span>${name}</span>
        <b>${visits} visits · ${visits % 7 === 6 ? 'next is free' : (7 - visits % 7) + ' until free'}</b>
      </div>
    `)
    .join('');
}

// ============================================================
// BOOT — question system must work even if Supabase/auth fails
// ============================================================
initQuestions();
attachMemberForm();
renderProfile();
renderAttendance();
initAuth();

// ============================================================
// GLOBAL EXPORTS (required for inline onclick="" handlers)
// ============================================================
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.nextQuestion = nextQuestion;
window.resetQuestions = resetQuestions;
window.logout = logout;
window.saveAttendance = saveAttendance;

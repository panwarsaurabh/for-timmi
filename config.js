/* =====================================================================
   ✏️  EDIT ME — everything on the website comes from this file.
   You never need to touch the code in /js or /css.
   - Photos: put files in photos/<folder>/ and write the path in `src`.
     Leave src: "" to show a pretty placeholder instead.
   - Text inside `backticks` can span multiple lines.
   - In the letter, wrap words in *stars* to make them glow.
   ===================================================================== */
window.CONFIG = {
  name: "Vimran",       // used everywhere on the site
  heroName: "Vimran",   // the big glowing particle name on the first screen
  from: "Saurabh",
  dog: "Noddy",

  // Optional soft background music, starts when she opens the gift.
  // Put an mp3 in the music/ folder and write its path, e.g. "music/ambient.mp3".
  // Leave "" to hide the music button.
  music: "",

  // Words that scroll along the bottom of the first screen
  marquee: ["the brightest soul", "my favorite person", "Noddy's best human", "queen of adventures", "forever my girl"],

  // ---------------------------------------------------------------- LETTER
  letter: `Happy birthday to the girl who makes every ordinary day feel like an *adventure*.
Thank you for your laugh, your kindness, your terrible jokes and the way you hug Noddy like he is a little cloud.
Every year with you is my *favorite* year — and this one is going to be the best yet.
I made this little universe because one card was never going to be enough to hold how much I *love you*.`,

  // ---------------------------------------------------------------- TRAVEL
  // { src, place, date, caption }
  travel: [
    { src: "", place: "Goa",       date: "2023", caption: "Sunsets, sea breeze and you" },
    { src: "", place: "Manali",    date: "2023", caption: "Snow fights we both pretended to win" },
    { src: "", place: "Udaipur",   date: "2024", caption: "City of lakes, girl of my dreams" },
    { src: "", place: "Bali",      date: "2024", caption: "Our tropical little escape" },
    { src: "", place: "Rishikesh", date: "2025", caption: "Brave enough to raft, scared of a frog" },
    { src: "", place: "Paris",     date: "2025", caption: "Croissants for breakfast, lunch and dinner" },
  ],

  // -------------------------------------------------------------- US (YOU & ME)
  // { src, date, caption, note }
  us: [
    { src: "", date: "The beginning", caption: "The day it all started", note: "I knew. I just knew." },
    { src: "", date: "Our first trip", caption: "Two backpacks, one heart", note: "You packed. I forgot the charger." },
    { src: "", date: "The big day",   caption: "Forever, officially", note: "Best yes of my life." },
    { src: "", date: "Home",          caption: "Our little world", note: "Wherever you are is home." },
  ],
  // The photo revealed through the heart at the end of the "Us" chapter
  usFinale: { src: "", caption: "forever & always" },

  // --------------------------------------------------------------- FRIENDS
  // { src, caption }
  friends: [
    { src: "", caption: "girls' night 💃" },
    { src: "", caption: "brunch club" },
    { src: "", caption: "road trip chaos" },
    { src: "", caption: "the birthday crew" },
    { src: "", caption: "besties since forever" },
    { src: "", caption: "dance floor legends" },
    { src: "", caption: "sunday squad" },
    { src: "", caption: "chai & gossip" },
    { src: "", caption: "concert night" },
  ],

  // ----------------------------------------------------------------- NODDY
  noddyLine: "Woof! Happy birthday mumma! I love you more than treats 🦴",
  noddy: [
    { src: "", caption: "fluffiest boy" },
    { src: "", caption: "zoomies o'clock" },
    { src: "", caption: "mumma's shadow" },
    { src: "", caption: "nap champion" },
    { src: "", caption: "cloud in a harness" },
    { src: "", caption: "caught stealing socks" },
  ],

  // ---------------------------------------------------------------- VIDEOS
  // Upload to YouTube as "Unlisted". The id is the part after "v=" in the link:
  // https://www.youtube.com/watch?v=dQw4w9WgXcQ  ->  id: "dQw4w9WgXcQ"
  videos: [
    { id: "", name: "Priya",  note: "college roommate" },
    { id: "", name: "Aman",   note: "the cousin" },
    { id: "", name: "Mom",    note: "love you beta" },
    { id: "", name: "Neha",   note: "work bestie" },
  ],

  // -------------------------------------------------------------- PLAYLIST
  // Make a YouTube playlist (set it to Unlisted or Public). The id is after "list=":
  // https://www.youtube.com/playlist?list=PLxxxxxxxx  ->  playlistId: "PLxxxxxxxx"
  playlistId: "",
  // Song names shown next to the record (same order as the playlist)
  songs: [
    { title: "Perfect", artist: "Ed Sheeran" },
    { title: "Tum Hi Ho", artist: "Arijit Singh" },
    { title: "Golden Hour", artist: "JVKE" },
    { title: "Kesariya", artist: "Arijit Singh" },
    { title: "Lover", artist: "Taylor Swift" },
  ],

  // ------------------------------------------------------------ WISH WALL
  // See README.md → "Wish wall setup". Until filled in, the wall runs in demo mode.
  wall: {
    formId: "",            // from the form link: docs.google.com/forms/d/e/<formId>/viewform
    fields: {              // from "Get pre-filled link"
      name: "entry.0000000000",
      message: "entry.0000000000",
      color: "entry.0000000000",
    },
    csvUrl: "",            // Sheet → File → Share → Publish to web → CSV link
  },
  // Shown on the wall only while csvUrl is empty (demo mode)
  sampleWishes: [
    { name: "Priya", message: "Happiest birthday to the most beautiful soul! Can't wait to celebrate you 💖", color: "pink" },
    { name: "Aman", message: "Another year of being awesome. Cake is on me this time!", color: "sun" },
    { name: "Neha", message: "You make the office bearable and life brighter. Love you!", color: "sky" },
    { name: "Mom", message: "My darling, may all your dreams come true. Always proud of you.", color: "lilac" },
    { name: "Rohan", message: "Happy birthday Vimran! Next trip, I'm coming too ✈️", color: "mint" },
    { name: "Ananya", message: "To many more dance nights and midnight maggi 🍜", color: "coral" },
  ],

  // ---------------------------------------------------------------- FINALE
  candles: 5,
  finaleWish: "Happy birthday, my love.",
};

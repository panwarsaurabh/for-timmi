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
Every year with you is my *favorite* year and this one is going to be the best yet.
I made this little universe because one card was never going to be enough to hold how much I *love you*.`,

  // ---------------------------------------------------------------- TRAVEL
  // { src, place, date, caption }
  travel: [
    { src: "photos/travel/udaipur.jpg",  place: "Udaipur",   date: "", caption: "City of lakes, girl of my dreams" },
    { src: "photos/travel/varanasi.jpg", place: "Varanasi",  date: "", caption: "Ghats, aartis and your hand in mine" },
    { src: "photos/travel/nasik.jpg",    place: "Nasik",     date: "", caption: "A sunset by the water, just the two of us" },
    { src: "photos/travel/dubai.jpg",    place: "Dubai",     date: "", caption: "Desert sun, city lights, my favourite view" },
    { src: "photos/travel/bali.jpg",     place: "Bali",      date: "", caption: "Our tropical little escape" },
    { src: "photos/travel/vietnam.jpg",  place: "Vietnam",   date: "", caption: "Lanterns, noodles and a million memories" },
    { src: "photos/travel/capetown.jpg", place: "Cape Town", date: "", caption: "The edge of the world, still not far enough to stop loving you" },
  ],

  // -------------------------------------------------------------- US (YOU & ME)
  // { src, date, caption, note }
  us: [
    { src: "photos/us/us-start.jpg",   date: "The beginning", caption: "The day it all started", note: "I knew. I just knew." },
    { src: "photos/us/us-trip.jpg",    date: "Our first trip", caption: "Two backpackers, one heart", note: "You packed. I forgot the charger." },
    { src: "photos/us/us-forever.jpg", date: "The big day",   caption: "Forever, officially", note: "Best yes of my life." },
    { src: "photos/us/us-home.jpg",    date: "Home",          caption: "Our little world", note: "Wherever you are is home." },
  ],
  // The photo revealed through the heart at the end of the "Us" chapter
  usFinale: { src: "photos/us/us-forever.jpg", caption: "forever & always" },

  // -------------------------------------------------------- THROUGH MY LENS
  // Nothing to fill in here: drop your photos of her into photos/lens/ and run
  //   powershell -ExecutionPolicy Bypass -File tools\resize-photos.ps1
  // It shrinks them and lists them all automatically.

  // --------------------------------------------------------------- FRIENDS
  // { src, caption }
  // caption is optional: leave "" for a blank polaroid strip, or write e.g. "girls' night 💃"
  friends: [
    { src: "photos/friends/friends-001.jpg", caption: "" },
    { src: "photos/friends/friends-002.jpg", caption: "" },
    { src: "photos/friends/friends-003.jpg", caption: "" },
    { src: "photos/friends/friends-004.jpg", caption: "" },
    { src: "photos/friends/friends-005.jpg", caption: "" },
    { src: "photos/friends/friends-006.jpg", caption: "" },
    { src: "photos/friends/friends-007.jpg", caption: "" },
    { src: "photos/friends/friends-008.jpg", caption: "" },
    { src: "photos/friends/friends-009.jpg", caption: "" },
    { src: "photos/friends/friends-010.jpg", caption: "" },
    { src: "photos/friends/friends-011.jpg", caption: "" },
    { src: "photos/friends/friends-012.jpg", caption: "" },
    { src: "photos/friends/friends-013.jpg", caption: "" },
    { src: "photos/friends/friends-014.jpg", caption: "" },
    { src: "photos/friends/friends-015.jpg", caption: "" },
    { src: "photos/friends/friends-016.jpg", caption: "" },
    { src: "photos/friends/friends-017.jpg", caption: "" },
    { src: "photos/friends/friends-018.jpg", caption: "" },
    { src: "photos/friends/friends-019.jpg", caption: "" },
    { src: "photos/friends/friends-020.jpg", caption: "" },
    { src: "photos/friends/friends-021.jpg", caption: "" },
    { src: "photos/friends/friends-022.jpg", caption: "" },
    { src: "photos/friends/friends-023.jpg", caption: "" },
    { src: "photos/friends/friends-024.jpg", caption: "" },
    { src: "photos/friends/friends-025.jpg", caption: "" },
    { src: "photos/friends/friends-026.jpg", caption: "" },
    { src: "photos/friends/friends-027.jpg", caption: "" },
    { src: "photos/friends/friends-028.jpg", caption: "" },
    { src: "photos/friends/friends-029.jpg", caption: "" },
    { src: "photos/friends/friends-030.jpg", caption: "" },
    { src: "photos/friends/friends-031.jpg", caption: "" },
    { src: "photos/friends/friends-032.jpg", caption: "" },
    { src: "photos/friends/friends-033.jpg", caption: "" },
    { src: "photos/friends/friends-034.jpg", caption: "" },
    { src: "photos/friends/friends-035.jpg", caption: "" },
    { src: "photos/friends/friends-036.jpg", caption: "" },
    { src: "photos/friends/friends-037.jpg", caption: "" },
    { src: "photos/friends/friends-038.jpg", caption: "" },
    { src: "photos/friends/friends-039.jpg", caption: "" },
    { src: "photos/friends/friends-040.jpg", caption: "" },
    { src: "photos/friends/friends-041.jpg", caption: "" },
    { src: "photos/friends/friends-042.jpg", caption: "" },
    { src: "photos/friends/friends-043.jpg", caption: "" },
    { src: "photos/friends/friends-044.jpg", caption: "" },
    { src: "photos/friends/friends-045.jpg", caption: "" },
    { src: "photos/friends/friends-046.jpg", caption: "" },
    { src: "photos/friends/friends-047.jpg", caption: "" },
  ],

  // ----------------------------------------------------------------- NODDY
  noddyLine: "Woof! Happy birthday mumma! I love you more than treats 🦴",
  noddy: [
    { src: "photos/noddy/noddy-001.jpg", caption: "mumma's baby" },
    { src: "photos/noddy/noddy-002.jpg", caption: "king of the couch" },
    { src: "photos/noddy/noddy-003.jpg", caption: "nap buddies" },
    { src: "photos/noddy/noddy-004.jpg", caption: "snuggle o'clock" },
    { src: "photos/noddy/noddy-005.jpg", caption: "chief cake inspector" },
    { src: "photos/noddy/noddy-006.jpg", caption: "cuddle champion" },
    { src: "photos/noddy/noddy-007.jpg", caption: "little explorers" },
    { src: "photos/noddy/noddy-008.jpg", caption: "kisses incoming" },
    { src: "photos/noddy/noddy-009.jpg", caption: "date night with mumma" },
    { src: "photos/noddy/noddy-010.jpg", caption: "sunset watchers" },
    { src: "photos/noddy/noddy-011.jpg", caption: "garden besties" },
    { src: "photos/noddy/noddy-012.jpg", caption: "the goodest boy" },
  ],

  // ---------------------------------------------------------------- AWARDS
  // Tap a card to "open the envelope". icon = any emoji, note = the funny citation.
  awardsYear: 2026,
  awards: [
    { icon: "🐶", title: "Official Noddy's Favourite Human", note: "Unanimous decision by a panel of one very fluffy judge." },
    { icon: "🙈", title: "Lifetime Achievement Award for Being Careless, Always", note: "Keys, phone, sunglasses, charger… lost with style, every single time." },
    { icon: "🧠", title: "2026 CEO of Overthinking", note: "Has replayed every conversation since 2019. Twice." },
    { icon: "🏥", title: "Achiever's Award for Maximum Hospital Visits", note: "The reception desk knows her by name. Loyalty points pending." },
    { icon: "🛂", title: "Outstanding Contribution to International Travel: Forgot the Passport at the Airport", note: "Packed three outfits per day, five pairs of shoes… and zero passports." },
    { icon: "📐", title: "Gold Medal in Perfectionism", note: "Re-folded the towels I already folded. Re-arranged the cushions. Re-wrote this award twice." },
  ],

  // ---------------------------------------------------------------- VIDEOS
  // Upload to YouTube as "Unlisted" and paste the link. Shorts links play in a tall vertical frame.
  // Or skip YouTube: put a small .mp4 in videos/ and use { file: "videos/name.mp4", ... } (phone videos play vertical).
  // note is optional (shown under the name).
  videos: [
    { link: "https://youtu.be/UJbrYCuRutc", name: "Kalpana & Allen", note: "" },
    { link: "https://youtu.be/JyFR8lhuUso", name: "Gaurav & Taruna", note: "" },
    { link: "https://youtube.com/shorts/7EWBM2xdhJw", name: "Saumya", note: "" },
    { link: "https://youtube.com/shorts/miHB3dmu5kM", name: "Bhaiya & Bhabhi", note: "" },
    { link: "https://youtube.com/shorts/BxPg9g9Jc-E", name: "Shilpi", note: "" },
    { link: "https://youtube.com/shorts/qpG4j3O_SPY", name: "Mom", note: "" },
    { link: "https://youtube.com/shorts/N4kl5Y16hOQ", name: "Dad", note: "" },
    { link: "https://youtube.com/shorts/OwOV_dd5vmU", name: "Mausi", note: "" },
    { link: "https://youtube.com/shorts/L9N7QJy7tTI", name: "Nikhil", note: "" },
    { file: "videos/Ajay.mp4", name: "Ajay", note: "" },
    { file: "videos/Arshi.mp4", name: "Arshi", note: "" },
    { file: "videos/Shubhashish.mp4", name: "Shubhashish", note: "" },
    { file: "videos/Vanshika.mp4", name: "Vanshika", note: "" },
    { file: "videos/Arpita.mp4", name: "Arpita", note: "" },
  ],

  // -------------------------------------------------------------- PLAYLIST
  // Make a YouTube playlist (set it to Unlisted or Public). The id is after "list=":
  // https://www.youtube.com/playlist?list=PLxxxxxxxx  ->  playlistId: "PLxxxxxxxx"
  playlistId: "PLAwFy1Qw0NLI",
  // Songs shown next to the record (same order as the playlist).
  // id = the song's YouTube video id (after "v=" in its link), so tapping a song starts that song.
  songs: [
    { title: "The Best of Both Worlds", artist: "Hannah Montana", id: "pAWseFS4eAk" },
    { title: "Girlfriend", artist: "Avril Lavigne", id: "Bg59q4puhmg" },
    { title: "Chaudhary", artist: "Mame Khan", id: "7pcihp6u8Iw" },
    { title: "Victory Lap Five", artist: "Fred again..", id: "0wRYvsfhsR8" },
    { title: "Darmiyaan (Unplugged)", artist: "Raghav Kaushik", id: "f5vaem1fvGk" },
    { title: "Channa Ve", artist: "Akhil Nasha", id: "epm7tAtEvYA" },
    { title: "O Saajna", artist: "Akhil Nasha", id: "96QlVTYpOlI" },
    { title: "A Sky Full of Stars", artist: "Coldplay", id: "KWuyx6yZ21U" },
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
  // Wishes collected by hand. Always shown on the wall (together with any that come in via the Google Form).
  // color: pink, sun, sky, lilac, mint or coral. Use `backticks` so a message can span several lines.
  wishes: [
    { name: "Abhimanyu", color: "pink", message: `Happy Birthday, Vimmi! ❤️🥳

It's crazy how much time has passed and how much life has changed since our school days. We've grown up, gone through so many different phases of life, made countless memories, yet it's really special to have some friendships that just stay constant through it all.

I'm genuinely glad to have had you as a part of my journey all these years.

Wishing you endless happiness, love, success and all the beautiful things life has to offer. May life always give you reasons to smile and may all your dreams come true.

Stay blessed and keep being the amazing person you are. Lots of love! ❤️` },
    { name: "Arpita", color: "coral", message: `Happy birthday, Vimran! 🧡
Who would have thought that even after 10 years, we'd still be wishing each other on our birthdays?

We have come such a long way, from knowing each other as each other's first crush to watching eachother get married. 🥹

When I look back, I wish we could all go back in time and relive those little moments just one more time.

I wish you all the happiness, love, laughter and everything beautiful that life has to offer. May you always have reasons to smile and may life be kind to you.

Here's to all the memories we've made and all the ones yet to come. 🧡` },
    { name: "Shikha", color: "sun", message: `Happy birthday, Vimmi! Seriously, you were such an amazing roommate back in Sunbeam. From our great egg roll missions to that birthday when we took money from you and bought you chocolates, we've had some pretty legendary memories. I'm really happy you're doing well and wish you loads of smiles and success in the years ahead. Hope today brings you the same kind of goofy joy we had back then… minus the borrowed birthday money!` },
    { name: "Rohit", color: "sky", message: `Happy Birthday Vimran ✨
Cheers to you and all the happiness coming your way
Have the best birthday 🥳` },
    { name: "Mummy", color: "lilac", message: `मेरी प्यारी विमरन,

जन्मदिन की बहुत-बहुत शुभकामनाएँ! 🎂❤️

जिस दिन तुम हमारे घर आईं, उस दिन से घर में और भी रौनक आ गई। तुम सिर्फ़ मेरी बहू नहीं, मेरी बेटी हो। तुम्हारी हँसी, तुम्हारा प्यार और सबका ख़्याल रखने का तुम्हारा तरीका हम सबके दिल को छू जाता है।

भगवान तुम्हें ढेर सारी ख़ुशियाँ, अच्छी सेहत और हर क़दम पर सफलता दें। तुम्हारे सारे सपने पूरे हों और तुम्हारा जीवन हमेशा प्यार और मुस्कुराहटों से भरा रहे।

हमेशा ऐसे ही खिलखिलाती रहो।

ढेर सारे प्यार और आशीर्वाद के साथ,
मम्मी 🙏❤️` },
  ],

  // ---------------------------------------------------------------- FINALE
  candles: 5,
  finaleWish: "Happy birthday, my love.",
};

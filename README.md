# for-timmi 💖

A birthday website for Timmi, built as a single page that scrolls through ten chapters:

1. a gift-box intro
2. a particle "TIMMI" that turns into a heart
3. a love letter
4. a travel journey
5. "You & Me"
6. the squad
7. Noddy
8. video messages
9. a live wish wall
10. her playlist and a cake with candles to blow out

**Everything you need to change is in [`config.js`](config.js).** You never have to touch `js/` or `css/`.

---

## 1. Preview it on your computer

The site has to be opened through a small local web server. Double-clicking `index.html` won't work, because browsers block JavaScript modules from `file://`.

```powershell
cd for-timmi
python -m http.server 8000
```

Then open http://localhost:8000. Refresh the page after each change you make to `config.js`.

## 2. Add photos

1. Copy photos into the matching folder:

   | Folder | Chapter |
   |---|---|
   | `photos/travel/` | Around the World |
   | `photos/us/` | You & Me |
   | `photos/friends/` | The Squad |
   | `photos/noddy/` | Noddy |

2. Shrink them so the site loads fast. Phone photos are usually 3–8MB each. Keep your originals somewhere else, because this overwrites the copies:

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\resize-photos.ps1
   ```

   iPhone `.heic` photos don't work in browsers. Open them in the Windows Photos app and use **Save as → .jpg** first.

3. In `config.js`, write each file's path in `src`:

   ```js
   { src: "photos/travel/goa.jpg", place: "Goa", date: "2023", caption: "Sunsets, sea breeze and you" },
   ```

   You can add or remove as many entries as you like. Any entry with `src: ""` shows a colorful placeholder.

`usFinale` is the photo revealed through the big heart at the end of "You & Me", so pick your favorite one of the two of you.

## 3. Video messages from friends

1. Upload each video to YouTube and set **Visibility: Unlisted**. Only people with the link can see it.
2. Copy the ID, which is the part after `v=` in the link. For example, the ID in `https://www.youtube.com/watch?v=dQw4w9WgXcQ` is `dQw4w9WgXcQ`.
3. Add it to the `videos` list in `config.js` with the friend's name:

   ```js
   { id: "dQw4w9WgXcQ", name: "Priya", note: "college roommate" },
   ```

## 4. Her playlist

1. On YouTube, create a playlist of her favorite songs and set it to **Unlisted** or **Public**.
2. Copy the ID, which is the part after `list=` in the playlist link. Paste it into `playlistId`.
3. Update the `songs` list so the names match the playlist order. Clicking a song starts the playlist at that song.

Some official music videos block embedding and show "Video unavailable". If that happens, swap in the "Official Audio" or "Lyrics" upload of the same song.

## 5. Wish wall setup (Google Form + Sheet, about 10 minutes)

This lets anyone with the link pin a wish to the wall. It's free and nobody has to log in.

1. **Create the form.** Go to [forms.google.com](https://forms.google.com) and start a blank form. Add exactly three questions:
   - **Name** (Short answer)
   - **Message** (Paragraph)
   - **Color** (Short answer)

   Then check **Settings → Responses**: turn *Collect email addresses* off, and make sure *Limit to 1 response* is off. That setting forces people to sign in, which breaks posting from the site.
2. **Link a Sheet.** In the form's **Responses** tab, click **Link to Sheets → Create a new spreadsheet**.
3. **Publish the Sheet as CSV.**
   1. In the spreadsheet, go to **File → Share → Publish to web**.
   2. Pick the **Form Responses 1** sheet and **Comma-separated values (.csv)**, then click **Publish**.
   3. Copy the link it gives you and paste it into `wall.csvUrl`.
4. **Get the form IDs.**
   1. In the form, open the **⋮** menu and choose **Get pre-filled link**.
   2. Type `a`, `b` and `c` into the three fields, click **Get link**, then **Copy link**.
   3. You'll get a link like this:

      ```
      https://docs.google.com/forms/d/e/1FAIpQLSc...XYZ/viewform?usp=pp_url&entry.111111=a&entry.222222=b&entry.333333=c
      ```

   4. Fill in `config.js` from that link:

      ```js
      wall: {
        formId: "1FAIpQLSc...XYZ",         // the part between /e/ and /viewform
        fields: { name: "entry.111111", message: "entry.222222", color: "entry.333333" },
        csvUrl: "https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv",
      },
      ```

5. **Test it.** Open the site, write a test wish, and check that a new row appears in the Sheet. Then delete the test row.

What to expect once it's live:
- **Delay:** Google refreshes the published CSV about every 5 minutes. The person who posts sees their wish immediately, and everyone else sees it after that delay. The wall also checks for new wishes every minute while it's open.
- **Moderation:** delete a row in the Sheet and that wish disappears from the wall.
- **Privacy:** the published CSV is readable by anyone who finds its link. That's fine for birthday wishes, but don't add fields like email or phone number.
- **Demo mode:** until `csvUrl` is filled in, the wall shows the `sampleWishes` from `config.js`, and new wishes are only stored on that device.

## 6. The rest of `config.js`

- `letter`: your love letter. Wrap words in `*stars*` to make them glow pink.
- `marquee`: the phrases that scroll along the bottom of the first screen.
- `noddyLine`: what Noddy says in his speech bubble.
- `candles`: how many candles are on the cake.
- `finaleWish`: the last line she reads.
- `music` (optional): soft background music that starts when she opens the gift. Put an mp3 in `music/` and set `music: "music/your-song.mp3"`.

## 7. Put it online (GitHub Pages)

```powershell
git add .
git commit -m "Birthday site for Timmi"
git push
```

Then on GitHub, open the repo and go to **Settings → Pages**. Set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, and click **Save**. After a minute or two the site is live at:

**https://panwarsaurabh.github.io/for-timmi/**

Keep in mind that the site and repo are public. Anyone with the link can see the photos, so leave out anything you wouldn't want shared.

---

### What's inside

- `index.html`: page structure
- `config.js`: all of your content
- `css/style.css`: the look
- `js/main.js`: intro, smooth scroll, cursor, music
- `js/webgl.js`: the shader background and particle text (Three.js)
- `js/chapters.js`: every chapter's animations, the lightbox and the cake
- `js/wall.js`: the wish wall

The site uses GSAP, Lenis, Three.js, SplitType and canvas-confetti, loaded from a CDN. There's nothing to install or build.

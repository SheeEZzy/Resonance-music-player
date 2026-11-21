 /* JavaScript program for the BSIT-1A Extended project: Spotify/Music Player
Lavina, Linux. de la Cerna, Joseph. Bono, Chino. Canada, Miguel.
App name: Resonance*/

// ---------- SHARED PLAYER ELEMENTS ----------
// The audio player and its play button, used by almost every part below.
const player = document.getElementById("player");
const playBtn = document.getElementById("play-btn");

// |=-=-=-=-=-=-=-=-=- SETTINGS STORAGE =-=-=-=-=-=-=-=-=-|
// Every switch on the Settings page is saved in the browser.
const SETTINGS_KEY = "rsnce-settings";
const DEFAULT_SETTINGS = { motion: true, colorsync: true, themebg: true, lyricSize: "md", autoplay: true };
let settings = Object.assign({}, DEFAULT_SETTINGS);
try { settings = Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}); } catch (e) {}

function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
}

// |=-=-=-=-=-=-=-=-=- LEFT SIDEBAR =-=-=-=-=-=-=-=-=-|
// The left menu: moving between pages (Home, Library, Premium)
// and the "New playlist" button.
const navLinks = document.querySelectorAll("[data-view]");
const views = document.querySelectorAll(".view");
const mainContent = document.querySelector(".main-content");

function showView(name) {
    if (!document.getElementById("view-" + name)) name = "home";   // if the page name is unknown, show Home

    views.forEach(function (v) {
        v.hidden = v.id !== "view-" + name;
    });
    navLinks.forEach(function (l) {
        l.classList.toggle("active", l.dataset.view === name);
    });
    const gear = document.getElementById("settings-btn");
    if (gear) gear.classList.toggle("active", name === "settings");
    mainContent.classList.toggle("home-bg", name === "home"); // only the Home page shows the big background picture
    mainContent.scrollTop = 0;
}

navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
        e.preventDefault();                  // keeps the page from reloading, so the music keeps playing
        showView(link.dataset.view);
        history.replaceState(null, "", "#" + link.dataset.view);
    });
});

showView(location.hash.slice(1) || "home");


// the "New playlist" button in the left menu
document.getElementById("side-create").addEventListener("click", function (e) {
    e.preventDefault();
    showView("library");
    createPlaylist();
});

// |=-=-=-=-=-=-=-=-=-=- MAIN CONTENT =-=-=-=-=-=-=-=-=-=-=-|
// The middle of the page: search, filters, song list,
// playlists, premium plans and the greeting.

// Search bar (in the top bar)
const search = document.querySelector(".search-bar");

search.addEventListener("input", function () {
    const q = search.value.toLowerCase();

    // typing anything takes the user to the Library page
    if (q && document.getElementById("view-library").hidden) {
        showView("library");
        history.replaceState(null, "", "#library");
    }
    
    // checked on every key press, so cards added later are included too
    document.querySelectorAll(".card").forEach(function (card) {
        card.style.display = card.textContent.toLowerCase().includes(q) ? "" : "none";
    });
});



// Library filters: All / Music / Playlists
const filterButtons = document.querySelectorAll(".redirectory");

filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        const filter = btn.dataset.filter;

        filterButtons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        document.querySelectorAll("[data-category]").forEach(function (el) {
            const show = filter === "all" || el.dataset.category === filter;
            el.style.display = show ? "" : "none";
        });
    });
});



// The songs in the library, and what is lined up to play
const songlist = Array.from(document.querySelectorAll(".card[data-src]"));
let currentindex = 0;
let queue = [];                              // the songs the player goes through (their positions in the list)

// clicking a song lines up every song in the library
songlist.forEach(function (card, i) {
    card.addEventListener("click", function () {
        queue = allSongsQueue();
        playsong(i);
    });
});

// Playlists, saved in the browser so they are still there next time
let playlists = [];
try { playlists = JSON.parse(localStorage.getItem("rsnce-playlists")) || []; } catch (e) { playlists = []; }

function savePlaylists() {
    try { localStorage.setItem("rsnce-playlists", JSON.stringify(playlists)); } catch (e) {}
}

function indexOfSrc(src) {
    return songlist.findIndex(function (c) { return c.dataset.src === src; });
}

function countText(n) {
    return n + (n === 1 ? " song" : " songs");
}

// asks for a name, then creates an empty playlist
function createPlaylist() {
    const name = (prompt("Name your playlist:") || "").trim();
    if (!name) return null;
    playlists.push({ name: name, songs: [] });
    savePlaylists();
    renderPlaylists();
    return playlists.length - 1;
}

// the playlist cards shown in the Library
const playlistGrid = document.getElementById("playlist-grid");

function renderPlaylists() {
    playlistGrid.innerHTML = "";

    const create = document.createElement("div");
    create.className = "card create-card";
    create.dataset.category = "playlists";
    create.innerHTML = '<i class="bi bi-plus-lg"></i><p class="card-title">Create playlist</p>';
    create.addEventListener("click", createPlaylist);
    playlistGrid.appendChild(create);

    playlists.forEach(function (pl, i) {
        const first = pl.songs.length ? indexOfSrc(pl.songs[0]) : -1;

        const card = document.createElement("div");
        card.className = "card";
        card.dataset.category = "playlists";
        card.innerHTML = '<img alt=""><p class="card-title"></p><p class="card-sub"></p>';
        card.querySelector("img").src = first >= 0 ? songlist[first].dataset.img : "Default_img.png";
        card.querySelector(".card-title").textContent = pl.name;
        card.querySelector(".card-sub").textContent = countText(pl.songs.length);
        card.addEventListener("click", function () { openPlaylist(i); });
        playlistGrid.appendChild(card);
    });
}

// the + button and its menu on every song card
const menu = document.createElement("div");
menu.id = "pl-menu";
menu.hidden = true;
document.body.appendChild(menu);

function openMenu(btn, src) {
    menu.innerHTML = "<p>Add to playlist</p>";

    playlists.forEach(function (pl) {
        const has = pl.songs.includes(src);
        const item = document.createElement("button");
        item.textContent = pl.name + (has ? "  ✓" : "");
        item.addEventListener("click", function () {
            if (!has) {                       // add the song only if it is not there yet
                pl.songs.push(src);
                savePlaylists();
                renderPlaylists();
            }
            menu.hidden = true;
        });
        menu.appendChild(item);
    });

    const fresh = document.createElement("button");
    fresh.textContent = "+ New playlist";
    fresh.addEventListener("click", function () {
        const i = createPlaylist();
        if (i !== null) {
            playlists[i].songs.push(src);
            savePlaylists();
            renderPlaylists();
        }
        menu.hidden = true;
    });
    menu.appendChild(fresh);

    menu.hidden = false;
    const r = btn.getBoundingClientRect();
    menu.style.top = Math.max(8, Math.min(r.bottom + 4, window.innerHeight - menu.offsetHeight - 8)) + "px";
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + "px";
}

songlist.forEach(function (card) {
    const btn = document.createElement("button");
    btn.className = "add-btn";
    btn.setAttribute("aria-label", "Add to playlist");
    btn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    btn.addEventListener("click", function (e) {
        e.stopPropagation();                 // stops the song from playing when + is pressed
        openMenu(btn, card.dataset.src);
    });
    card.appendChild(btn);
});

// clicking anywhere else closes the menu
document.addEventListener("click", function (e) {
    if (!menu.contains(e.target)) menu.hidden = true;
});

// the page that opens for one playlist
let openPl = null;                           // the playlist that is open right now

function openPlaylist(i) {
    openPl = i;
    renderPlaylistView();
    showView("playlist");
    document.querySelector('.left-sidebar [data-view="library"]').classList.add("active");
}

function renderPlaylistView() {
    const pl = playlists[openPl];
    if (!pl) return;

    document.getElementById("pl-title").textContent = pl.name;
    document.getElementById("pl-count").textContent = countText(pl.songs.length);

    const box = document.getElementById("pl-songs");
    box.innerHTML = "";

    if (!pl.songs.length) {
        box.innerHTML = '<p class="subtitle">No songs yet. Hover a song in the Library and press + to add it.</p>';
        return;
    }

    pl.songs.forEach(function (src) {
        const idx = indexOfSrc(src);
        if (idx < 0) return;
        const song = songlist[idx];

        const row = document.createElement("div");
        row.className = "pl-row";
        row.innerHTML = '<img alt=""><div class="pl-info"><p class="pl-title"></p><p class="pl-artist"></p></div>' +
                        '<button class="pl-remove" aria-label="Remove from playlist"><i class="bi bi-x-lg"></i></button>';
        row.querySelector("img").src = song.dataset.img;
        row.querySelector(".pl-title").textContent = song.dataset.title;
        row.querySelector(".pl-artist").textContent = song.dataset.artist;

        row.addEventListener("click", function () { playPlaylist(idx); });

        row.querySelector(".pl-remove").addEventListener("click", function (e) {
            e.stopPropagation();
            pl.songs = pl.songs.filter(function (s) { return s !== src; });
            savePlaylists();
            renderPlaylists();
            renderPlaylistView();
        });

        box.appendChild(row);
    });
}

// plays a song from the open playlist and lines up only its songs
function playPlaylist(start) {
    const pl = playlists[openPl];
    const indexes = pl.songs
        .map(function (s) { return indexOfSrc(s); })
        .filter(function (i) { return i >= 0; });

    if (!indexes.length) return;
    queue = indexes;
    playsong(start === undefined ? indexes[0] : start);
}

document.getElementById("pl-play").addEventListener("click", function () { playPlaylist(); });

document.getElementById("pl-delete").addEventListener("click", function () {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    playlists.splice(openPl, 1);
    savePlaylists();
    renderPlaylists();
    showView("library");
});


renderPlaylists();

// Premium plans
const planButtons = document.querySelectorAll(".plan-btn");
let currentPlan = "free";
try { currentPlan = localStorage.getItem("rsnce-plan") || "free"; } catch (e) {}

function renderPlans() {
    planButtons.forEach(function (btn) {
        const isCurrent = btn.dataset.plan === currentPlan;
        btn.classList.toggle("subscribed", isCurrent);   // grey button for the plan you already have
        btn.disabled = isCurrent;

        if (isCurrent) {
            btn.textContent = "Your current plan";
        } else if (btn.dataset.plan === "free") {
            btn.textContent = "Switch to " + btn.dataset.name;
        } else {
            btn.textContent = "Get " + btn.dataset.name + " · " + btn.dataset.price;
        }
    });
}

planButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        if (btn.dataset.plan === currentPlan) return;

        const ok = confirm("Switch to " + btn.dataset.name + " (" + btn.dataset.price + ")?");
        if (!ok) return;

        currentPlan = btn.dataset.plan;
        try { localStorage.setItem("rsnce-plan", currentPlan); } catch (e) {}
        songsSinceAd = 0;                                      
        if (currentPlan === "premium") endAd(); else updateAdSkip();   // premium users see no ads
        renderPlans();
        applySettings();      // the theme switch follows the new plan
        updateThemeGate();
        refreshTheme();
        
    });
});

renderPlans();

document.querySelectorAll(".plan, .theme").forEach(function (el, i) {
    el.style.setProperty("--i", i % 4);
});

// Greeting on the Home page
const greetingEl = document.getElementById("greeting");
const UTC_OFFSET = 8; // the Philippines is 8 hours ahead of UTC

// the current hour (0-23) in that time zone
function currentHour() {    
    if (UTC_OFFSET === null) return new Date().getHours();
    return new Date(Date.now() + UTC_OFFSET * 3600000).getUTCHours(); // converts the time to Philippine time
}

function updateGreeting() {
    const h = currentHour();
    let text = "Good Evening";                              // from 6 PM to 4:59 AM
    if (h >= 5 && h < 12) text = "Good Morning";           // from 5 AM to 11:59 AM
    else if (h >= 12 && h < 18) text = "Good Afternoon";    // from 12 PM to 5:59 PM
    greetingEl.textContent = text + ", Resonator";
}

updateGreeting();
setInterval(updateGreeting, 60000); // checks the time again every minute


// |=-=-=-=-=-=-=-=-=-=-=-=- RIGHT SIDEBAR =-=-=-=-=-=-=-=-=-=-=-=-=-=|

// The Now Playing panel: show/hide button, lyrics, queue,
// recently played songs, scrolling titles and the music video.
const grid = document.querySelector(".app-grid");
const nowPlayingBtn = document.getElementById("now-playing-btn");
const phone = window.matchMedia("(max-width: 767px)");
const tablet = window.matchMedia("(max-width: 1023px)");

let sidebarOpen = false;     // the right sidebar starts hidden
let songStopped = true;      // true at the start, and again when the songs run out

// on desktop it is hidden when open, on tablet it is shown when open
function applySidebar() {
    grid.classList.toggle("right-toggled", tablet.matches ? sidebarOpen : !sidebarOpen);
    requestAnimationFrame(refreshMarquees);   // song titles can only be measured after the sidebar is shown
}

function setSidebar(open) {
    sidebarOpen = open;
    applySidebar();
}

// this button does nothing until a song has started
if (nowPlayingBtn) {
    nowPlayingBtn.addEventListener("click", function () {
        if (phone.matches || songStopped || adPlaying) return;
        setSidebar(!sidebarOpen);
    });
}

// keeps the same open/closed state when the window size changes
["(max-width: 767px)", "(max-width: 1023px)"].forEach(function (query) {
    window.matchMedia(query).addEventListener("change", applySidebar);
});

applySidebar();   // at the start it is hidden



// the lyrics of every song (shown in the right sidebar)
const lyricsBox = document.getElementById("lyrics-box");

const lyricsData = {
    "AllForOne.mp3": [
        { time: 9.3,  text: "Ooh" },

        //Verse 1
        { time: 16.3,  text: "Just look around and see, it's so incredible" },
        { time: 20,  text: "So many smiles in a sea of light" },
        { time: 23.3,  text: "Take one step with me and you'll be dazzled" },
        { time: 26.7,  text: "There's magic in the air tonight" },
        
        //Refrain
        { time: 30.1,  text: "The hours zoom, zoom, zoom, my heart goes boom, boom, boom" },
        { time: 34,  text: "The world is brighter because you believe in me" },
        { time: 37.6,  text: "Let's shout it loud, loud, loud, our time is right now" },
        { time: 40.5,  text: "We're on the edge of destiny" },

        //pre-chorus
        { time: 43.8,  text: "For a moment, I can dream with you" },
        { time: 47,  text: "Every miracle we hoped for might come true" },
        { time: 51,  text: "We come togеther, reaching out from far and wide" },
        { time: 54.6,  text: "And suddеnly, you're here by my side" },

        //Chorus
        { time: 58.7,  text: "When our voices and hearts unite, we're gonna shine bright" },
        { time: 63.5,  text: "Together, we're all for one (Let's sing), all for one" },
        { time: 67.3,  text: "The thrill of happiness is all around us" },
        { time: 69.7,  text: "Jump in, 'cause it's all for one (Let's sing), all for one" },
        { time: 74.3,  text: "We're on our way to good times, good vibes" },
        { time: 76.7,  text: "We'll treasure this day the rest of our lives (Hey)" },
        { time: 81,  text: "All that we waited for, the dream we're striving toward" },
        { time: 84.5,  text: "We're singing, all for one," },
        { time: 86.7,  text: "All for One" },

        //Verse 2
        { time: 87.7,  text: "Everything's in motion, get up and start the celebration" },
        { time: 91,  text: "Come see the wonders here beyond imagination" },
        { time: 94.5,  text: "We're joining hands for the world to see (Uh-huh)" },
        { time: 98.5,  text: "Feel the love and the energy" },

        //Refrain 2
        { time: 101.5,  text: "The hours zoom, zoom, zoom, my heart goes boom, boom, boom" },
        { time: 105.3,  text: "A dizzy whirlwind of dreams and reality" },
        { time: 108.7,  text: "Let's shout it loud, loud, loud, our time is right now" },
        { time: 112,  text: "We're here together, finally" },

        //Pre-chorus 2
        { time: 115.3,  text: "Every moment takes my breath away" },
        { time: 118.7,  text: "There's a feeling here that words cannot convey" },
        { time: 122.7,  text: "We hear the rhythm and we rise to meet the song" },
        { time: 125.7,  text: "And suddenly, our hearts beat as one" },

        //Chorus 2
        { time: 130.7,  text: "Every voice ringing loud and clear, so glad to be here" },
        { time: 134.7,  text: "Together, we're all for one (Let's sing), all for one" },
        { time: 138.7,  text: "We'll sing in harmony and we'll be happy" },
        { time: 141.7,  text: "Jump in, 'cause it's all for one (Let's sing), all for one" },
        { time: 145.5,  text: "Keep up the hype, it's good times, good vibes" },
        { time: 148.7,  text: "Remember this night the rest of our lives (Hey)" },
        { time: 152,  text: "Raise up your hands and sway, your light will lead our way" },
        { time: 155.7,  text: "We're shining, all for one," },
        { time: 158,  text: "All for One" },

        //Verse 3
        { time: 159.3,  text: "So, bring your memories, your joy and your hope" },
        { time: 162.3,  text: "We'll gather and we'll sing upon this endless road," },
        { time: 165.3,  text: "oh-oh" },
        { time: 166.5,  text: "Feel the music in your passionate soul" },
        { time: 169.5,  text: "We're here right now, so, let the good times roll," },
        { time: 172.3,  text: "oh-oh" },

        //Final Pre-chorus
        { time: 173.5,  text: "Every time that I'm with you" },
        { time: 175.7,  text: "I could swear it's like a wish is coming true" },
        { time: 180,  text: "So, I'll believe in you if you believe in me" },
        { time: 183.3,  text: "Together we can chase all our dreams" },
        { time: 187,  text: "One, Two, Three, Four, Five!\n\n" },
        { time: 188.7,  text: "(Yeeaaaaaaaaaaahh~)\nWhen our voices and hearts unite, we're gonna shine bright\n\n" },
        { time: 191.7,  text: "(yeah-yeah-yeaahhh)\nTogether we're all for one (Let's sing), all for one\n(yeeeaa~...)\n\n" },
        { time: 196,  text: "(~eaaahh~~...)\nThe thrill of happiness is all around us\n\n" },
        { time: 198.7,  text: "(...)\nJump in, 'cause it's all for one (Let's sing), all for one" },
        { time: 202.7,  text: "We're on our way to good times, good vibes" },
        { time: 205.7,  text: "We'll treasure this day the rest of our lives (Hey)" },
        { time: 209.7,  text: "All that we waited for, the dream we're striving toward" },
        { time: 213,  text: "We're singing, all for one," },
        { time: 215.5,  text: "ALL FOR ONE" },
    ],

    "fallenPetals.mp3": [
        //Intro
        { time: 0,  text: "(Da-ra-ri, da-ri, da-ri)"},
        { time: 3.7,  text: "(Da-da-da, da-da-da-da)"},
        { time: 6.5,  text: "(Da-da-da, da-da-da-da-da-da-da)"},
        
        //Verse 1
        { time: 12.3,  text: "Morning bells ring, blossom breeze sings"},
        { time: 18,  text: "Dancing shadows on my fingertips"},
        { time: 23.3,  text: "Pages turn slow, seasons we outgrow"},
        { time: 29.7,  text: "Footsteps echo where the petals blow"},

        //Chorus
        { time: 33.8,  text: "I paint the sky with yesterday's light"},
        { time: 37,  text: "Whispering wishes to satellites"},
        { time: 40.7,  text: "Will you catch them in the starlit tide?"},
        { time: 46.5,  text: "Tick-tock, petals fall"},
        { time: 49.5,  text: "Moments bloom, I recall"},
        { time: 52,  text: "Pink like dawn, soft like you"},
        { time: 55,  text: "Déjà vu, where are you?"},
        
        { time: 61,  text: "(music)"},
        
        //Verse 2
        { time: 68,  text: "Daylight fades, where the lost light bends"},
        { time: 74,  text: "Your shadow flickers in the afterglow"},
        { time: 80,  text: "Roads unwind, maps we failed to find"},
        { time: 86,  text: "Footsteps buried in thе melting snow (Melting snow)"},
        
        //Chorus
        { time: 90.7,  text: "I fold the night likе a letter unsent"},
        { time: 94,  text: "Sealed with starlight still unspent"},
        { time: 96.8,  text: "Will you read it where the seasons bend?"},
        { time: 103,  text: "Tick-tock, petals fall"},
        { time: 106,  text: "Moments bloom, I recall"},
        { time: 108.8,  text: "Pink like dawn, soft like you"},
        { time: 111,  text: "Déjà vu, where are you?"},

        { time: 117,  text: "(music)"},
        
        
    ],

    "SUPERNOVA.mp3": [
        //Intro
        { time: 1.3,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 3.7,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 6.3,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 9,  text: "(Woah-woah)"},

        //Refrain
        { time: 11.7,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 14.3,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 17,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 19.7,  text: "(Woah-woah)"},
        
        //Verse 1
        { time: 21.7,  text: "甘く" , romaji: "Amaku", en: "A sweet" },
        { time: 23.8,  text: "ほろ苦い夢", romaji: "horonigai yume", en: "and bittersweet dream" },
        { time: 26.5,  text: "「これでいい」か、「これがいい」か", romaji: "'Kore de ii' ka, 'Kore ga ii' ka", en: "'Is this good enough', or 'is this what I truly want?'" },
        { time: 29.7,  text: "折れかけたあの日", romaji: "Orekaketa ano hi", en: "On that day when I almost gave up" },
        { time: 32.3,  text: "ここに 間違いはなくて", romaji: "Koko ni machigai wa nakute", en: "There was no mistake in being here" },
        { time: 37,  text: "正解もなくて自分次第って", romaji: "Seikai mo nakute jibun shidaitte", en: "There was no right answer, it's all up to me" },
        { time: 40.2,  text: "怖くて仕方ないけど", romaji: "Kowakute shikatanai kedo", en: "That thought alone is terrifying" },

        //Pre-chorus
        { time: 43,  text: "「誰か」じゃない「君」と見たい \n景色は鮮明で (Yeah, yeah)", romaji: "'Dareka' janai 'kimi' to mitai\nKeshiki wa senmei de (Yeah, yeah)"
            , en: "I want to see it with you, not with someone" },
        { time: 48.3,  text: "それじゃあ (Yeah) ここで (Yeah)", romaji: "Sorejaa (Yeah), Koko de (Yeah)", en: "So then (Yeah), right here (Yeah)" },
        { time: 51,  text: "足踏みなんか", romaji: "Ashibumi nanka", en: "There's no time" },
        { time: 53,  text: "していられないじゃんっ", romaji: "shite irarenaijan", en: "to stand still!" },

        //Chorus
        { time: 56.2,  text: "(Oh, yeah) 無数の星の中", romaji: "(Oh, yeah) Musuu no hoshi no naka", en: "(Oh, yeah) Among the countless stars" },
        { time: 59,  text: "(Oh, yeah) 光は君がくれた", romaji: "(Oh, yeah) Hikari wa kimi ga kureta", en: "(Oh, yeah) The light you gave me" },
        { time: 61.5,  text: "(Oh, yeah, yeah, yeah, yeah, yeah, yeah) "},
        { time: 63.7,  text: "もっと", romaji: "Motto", en: "Even more" },
        { time: 64.5,  text: "(Yeah, yeah, yeah) 超えていけるさ", romaji: "(Yeah, yeah, yeah) Koete ikeru sa", en: "(Yeah, yeah, yeah) We can go beyond" },
        { time: 66.8,  text: "(Oh, yeah) SUPERNOVA 起こせ、今", romaji: "(Oh, yeah) SUPERNOVA okose, ima", en: "(Oh, yeah) Ignite the supernova now" },
        { time: 69.3,  text: "(Oh, yeah) 何度だって翔べる", romaji: "(Oh, yeah) Nando datte toberu", en: "(Oh, yeah) We can fly as many times as we want" },
        { time: 72,  text: "(Oh, yeah, yeah, yeah, yeah, yeah, yeah)"},
        { time: 74.3,  text: "これは紛れもなく僕らの軌跡、", romaji: "Kore wa magire mo naku bokura no kiseki,", en: "This is, without a doubt, our journey," },
        { time: 77.3,  text: "Hi Friends!!"},

        //Refrain
        { time: 80,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 82.8,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 85.5,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 88,  text: "(Woah-woah-woah)"},

        //Verse 2
        { time: 90.3,  text: "心", romaji: "Kokoro", en: "heart" },
        { time: 92.7,  text: "泣きじゃくる日でも", romaji: "nakijakuru hi demo", en: "Even on days when You're crying your eyes out" },
        { time: 95,  text: "いつだってここにおいで？", romaji: "Itsudatte koko ni oide ?", en: "Why don't you come here anytime?" },
        { time: 98.3,  text: "強がりはらしくないよっ!", romaji: "Tsuyogari wa rashikunai yo!", en: "Acting tough isn't like you!" },

        //Pre-chorus
        { time: 101.3,  text: "「ひとり」じゃない「君」もほら \n僕等、手取り合って (Yeah, yeah)", romaji: "'Hitori' janai 'kimi' mo hora\nBokura, te toriatte (Yeah, yeah)",
             en: "You're not alone, look\nLet's hold hands (Yeah, yeah)" },
        { time: 106.3,  text: "笑おう (Yeah) 叫ぼう (Yeah)", romaji: "Waraou (Yeah), Sakebou (Yeah)", en: "Let's laugh (Yeah), let's shout (Yeah)" },
        { time: 108.7,  text: "あの宇宙の向こうへ", romaji: "Ano sora no mukou e", en: "To the other side of the universe" },

        //Chorus
        { time: 114.3,  text: "(Oh, yeah) 無数の星の中", romaji: "(Oh, yeah) Musuu no hoshi no naka", en: "(Oh, yeah) Among the countless stars" },
        { time: 116.7,  text: "(Oh, yeah) 交わした約束も", romaji: "(Oh, yeah) Kawashita yakusoku mo", en: "(Oh, yeah) Even the promises we made" },
        { time: 119.5,  text: "(Oh, yeah, yeah, yeah, yeah, yeah, yeah)"},
        { time: 121.7,  text: "きっと", romaji: "Kitto", en: "Surely" },
        { time: 122.3,  text: "(Yeah, yeah, yeah) 叶えられるさ", romaji: "(Yeah, yeah, yeah) Kanaerareru sa", en: "(Yeah, yeah, yeah) It'll come true" },
        { time: 124.7,  text: "(Oh, yeah) SUPERNOVA 駆けろ、今", romaji: "(Oh, yeah) SUPERNOVA kakero, ima", en: "(Oh, yeah) Run with the supernova now" },
        { time: 127.3,  text: "(Oh, yеah) 誰一人欠かせない", romaji: "(Oh, yeah) Dare hitori kakasenai", en: "(Oh, yeah) No one is replaceable" },
        { time: 129.8,  text: "(Oh, yeah, yeah, yeah, yеah, yeah, yeah)"},
        { time: 132.3,  text: "あの日描いた夢の先まで、", romaji: "Ano hi egaita yume no saki made,", en: "To the end of the dream we had that day," },
        { time: 135.3,  text: "Hi Friends!!"},

        //Interlude
        { time: 138.8,  text: "Yeah"},
        { time: 141.8,  text: "(music)"},

        //Bridge
        { time: 147,  text: "こんな現在を愛せるように\n(こんな現在を愛せるように)", romaji: "Konna genzai o aiseruyou ni\n(Konna genzai o aiseruyou ni)",
             en: "So that we can learn to love this very moment\n(So that we can learn to love this very moment)" },
        { time: 152.7,  text: "君に向けて唄おう", romaji: "Kimi ni mukete utaou", en: "I'll sing this song for you" },
        { time: 155.5,  text: "心が叫んでる", romaji: "Kokoro ga sakenderu", en: "From the depths of my heart" },

        //Chorus
        { time: 157.9,  text: "(Oh, yeah) 無数の星の中", romaji: "(Oh, yeah) Musuu no hoshi no naka", en: "(Oh, yeah) Among the countless stars" },
        { time: 160.5,  text: "(Oh, yeah) 光は君がくれた", romaji: "(Oh, yeah) Hikari wa kimi ga kureta", en: "(Oh, yeah) The light you gave me" },
        { time: 163,  text: "(Oh, yeah, yeah, yeah, yeah, yeah, yeah)"},
        { time: 165,  text: "もっと", romaji: "Motto", en: "Even more" },
        { time: 165.7,  text: "(Yeah, yeah, yeah) 超えていけるさ", romaji: "(Yeah, yeah, yeah) Koete ikeru sa", en: "(Yeah, yeah, yeah) We can go beyond" },
        { time: 168.3,  text: "(Oh, yeah) SUPERNOVA 起こせ、今", romaji: "(Oh, yeah) SUPERNOVA okose, ima", en: "(Oh, yeah) Ignite the supernova now" },
        { time: 171,  text: "(Oh, yeah) 何度だって翔べる", romaji: "(Oh, yeah) Nando datte toberu", en: "(Oh, yeah) We can fly as many times as we want" },
        { time: 173.5,  text: "(Oh, yeah, yeah, yeah, yeah, yeah, yeah)"},
        { time: 175.8,  text: "これは紛れもなく僕らの軌跡", romaji: "Kore wa magire mo naku bokura no kiseki", en: "This is, without a doubt, the story of our journey." },

        //Post-chorus
        { time: 179,  text: "「普通」も「あたりまえ」も無い", romaji: "'Futsuu' mo 'atarimae' mo nai", en: "There is no such thing as “normal” or “ordinary”" },
        { time: 180.8,  text: "君が君らしく在れるように もっと", romaji: "Kimi ga kimirashiku areruyou ni motto", en: "So you can be yourself more" },
        { time: 184.3,  text: "(Yeah, yeah, yeah, yeah, yeah, yeah)"},
        { time: 186.3,  text: "ずっと", romaji: "Zutto", en: "Forever" },
        { time: 187,  text: "(Yeah, yeah, yeah) 届けよう", romaji: "(Yeah, yeah, yeah) Todokeyou", en: "(Yeah, yeah, yeah) Let's make it reach" },
        { time: 189.7,  text: "不思議と怖くはないんだ", romaji: "Fushigi to kowaku wa nainda", en: "Strangely enough, I'm not afraid" },
        { time: 191.7,  text: "綺麗事、絵空事でもない さあ、行こう", romaji: "Kireigoto, esoragoto demo nai saa, ikou", en: "It's not just pretty words or an empty dream, so let's go" },
        { time: 194.7,  text: "(Yeah, yeah, yeah, yeah, yeah, yeah)"},
        { time: 197,  text: "この物語は終わらない", romaji: "Kono monogatari wa owaranai", en: "This story will never end" },

        //Refrain
        { time: 201.3,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 204.3,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 206.8,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 209.3,  text: "(Woah-woah-woah)"},

        //Outro
        { time: 212.3,  text: "(Woah, oh, oh-oh-oh)"},
        { time: 214.7,  text: "(Woah, oh, oh-oh-oh)"},
    ],

    "TeamTomodachiCover.mp3": [
        //Intro
        { time: 0.5,  text:"(T-T-Team Tomodachi)"},

        //Refrain
        { time: 2.3,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 5.7,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 9,  text:"チーム友達、チーム友達 (Mmh, mmh, mmh)", romaji:"Chiimu tomodachi, chiimu tomodachi (Mmh, mmh, mmh)", en:"Team Friends, Team Friends (Mmh, mmh, mmh)"},
        { time: 12.2,  text:"チーム友達、(Uh) チーム友達 ", romaji:"Chiimu tomodachi, (Uh) chiimu tomodachi", en:"Team Friends, (Uh) Team Friends"},

        //Chorus
        { time: 15.5,  text:"チーム友達、  チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 18.8,  text:"俺たち何、え？  チーム友達", romaji:"Oretachi nani? E? Chiimu tomodachi", en:"What are we? Huh? Team Friends"},
        { time: 22,  text:"関西関東 西東\n(チーム友達、チーム友達)", romaji:"Kansai Kantou Nishihigashi\n(Chiimu tomodachi, chiimu tomodachi)", 
            en:"Kansai, Kanto, West, East\n(Team Friends, Team Friends)"},
        { time: 25.3,  text:"北南、チーム友達\n(チーム友達、チーム友達)", romaji:"Kitaminami, chiimu tomodachi\n(Chiimu tomodachi, chiimu tomodachi)", 
            en:"North, South, Team Friends\n(Team Friends, Team Friends)"},
        { time: 28.7,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 32,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 35.2,  text:"チーム、チーム、チーム友達\n(チーム友達、チーム友達)", romaji:"Chiimu, chiimu, chiimu tomodachi\n(Chiimu tomodachi, chiimu tomodachi)", 
            en:"Team-Team-Team Friends\n(チーム友達、チーム友達)"},
        { time: 38.3,  text:"俺たち何、え？  チーム友達 \n(ha-ha-ha-ha)", romaji:"Oretachi nani? E? Chiimu tomodachi \n(ha-ha-ha-ha)", en:"What are we? Huh? Team Friends\n(ha-ha-ha-ha)"},

        //Verse
        { time: 41.8,  text:"お好み焼き 食う鶴橋", romaji:"Okonomiyaki kuu Tsuruhashi", en:"Okonomiyaki at Tsuruhashi"},
        { time: 45.2,  text:"腹いっぱい飯は美味い", romaji:"Haraippai meshi wa umai", en:"Food tastes great when you're full."},
        { time: 48.3,  text:"一人じゃ寂しいし電話きたり", romaji:"Hitori ja sabishii shi denwa kitari", en:"Bеing alone makes me feel lonely, but I get calls"},
        { time: 51.5,  text:"かけ直した後すぐ行く会いに", romaji:"Kake naoshita ato sugu iku ai ni", en:"I'll go see you right after I call you back."},
        { time: 55,  text:"T-e-a-m  T-o-m-o-d-a-c-h-i"},
        { time: 61.6,  text:"T-e-a-m  T-o-m-o-d-a-c-h-i"},
        { time: 68.1,  text:"T-e-a-m  T-o-m-o-d-a-c-h-i\n(チーム友達、チーム友達、チーム友達、チーム友達)", romaji:"(Chiimu tomodachi, chiimu tomodachi, chiimu tomodachi, chiimu tomodachi)",
            en:"(Team Friends, Team Friends, Team Friends, Team Friends)"},
        { time: 74.7,  text:"チーム友達混ざり合い", romaji:"Chiimu tomodachi mazari ai", en:"Team Friend mixing together"},
        { time: 77.8,  text:"契り交わし飲んでる酒", romaji:"Chigirikawashi nonderu sake", en:"Making a pledge of friendship by drinking sake"},

        //Bridge
        { time: 80.7,  text:"契り(契り)、契り(契り)", romaji:"Chigiri (chigiri), chigiri (chigiri)", en:"Pledge (Pledge), Pledge (Pledge)"},
        { time: 84.2,  text:"契り(契り)、契り(契り)", romaji:"Chigiri (chigiri), chigiri (chigiri)", en:"Pledge (Pledge), Pledge (Pledge)"},
        { time: 87.5,  text:"契ろう (契ろう)、契ろう (契ろう)", romaji:"Chigiirou (chigiirou), chigiirou (chigiirou)", 
            en:"Let's Make a Pledge (Let's Make a Pledge),Let's Make a Pledge (Let's Make a Pledge)"},
        { time: 90.7,  text:"契ろう (契ろう)、契ろう (契ろう)", romaji:"Chigiirou (chigiirou), chigiirou (chigiirou)", 
            en:"Let's Make a Pledge (Let's Make a Pledge),Let's Make a Pledge (Let's Make a Pledge)"},
        { time: 94,  text:"契り(契り)、契り(契り)", romaji:"Chigiri (chigiri), chigiri (chigiri)", en:"Pledge (Pledge), Pledge (Pledge)"},
        { time: 97.3,  text:"契り(契り)、契り(契り)", romaji:"Chigiri (chigiri), chigiri (chigiri)", en:"Pledge (Pledge), Pledge (Pledge)"},
        { time: 100.6,  text:"契ろう (契ろう)、契ろう (契ろう)", romaji:"Chigiirou (chigiirou), chigiirou (chigiirou)", 
            en:"Let's Make a Pledge (Let's Make a Pledge),Let's Make a Pledge (Let's Make a Pledge)"},
        { time: 103.9,  text:"契ろう (契ろう)、契ろう (契ろう)", romaji:"Chigiirou (chigiirou), chigiirou (chigiirou)", 
            en:"Let's Make a Pledge (Let's Make a Pledge),Let's Make a Pledge (Let's Make a Pledge)"},


        //Chorus
        { time: 107.1,  text:"チ・チ・チーム友達、  チーム友達", romaji:"Chi-Chi-Chiimu tomodachi, chiimu tomodachi", en:"T-T-Team Friends, Team Friends"},
        { time: 110.8,  text:"俺たち何、え？  チーム友達", romaji:"Oretachi nani? E? Chiimu tomodachi", en:"What are we? Huh? Team Friends"},
        { time: 114.1,  text:"関西関東 西東\n(チーム友達、チーム友達)", romaji:"Kansai Kantou Nishihigashi\n(Chiimu tomodachi, chiimu tomodachi)", 
            en:"Kansai, Kanto, West, East\n(Team Friends, Team Friends)"},
        { time: 117.4,  text:"北南、チーム友達\n(チーム友達、チーム友達)", romaji:"Kitaminami, chiimu tomodachi\n(Chiimu tomodachi, chiimu tomodachi)", 
            en:"North, South, Team Friends\n(Team Friends, Team Friends)"},
        { time: 120.7,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 124,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 127.3,  text:"チーム、チーム、チーム友達\n(チーム友達、チーム友達)", romaji:"Chiimu, chiimu, chiimu tomodachi\n(Chiimu tomodachi, chiimu tomodachi)", 
            en:"Team-Team-Team Friends\n(チーム友達、チーム友達)"},
        { time: 130.6,  text:"俺たち何、え？  チーム友達 \n(ha-ha, ha-ha-ha-ha)", romaji:"Oretachi nani? E? Chiimu tomodachi \n(ha-ha, ha-ha-ha-ha)", 
            en:"What are we? Huh? Team Friends\n(ha-ha-ha-ha)"},

        //Refrain
        { time: 133.8,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 137.2,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 140.5,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},
        { time: 143.7,  text:"チーム友達、チーム友達", romaji:"Chiimu tomodachi, chiimu tomodachi", en:"Team Friends, Team Friends"},

        { time: 147.3,  text:"(Ehehehehe)"},
        { time: 148.3,  text:"(Hehehehm)"},

    ],

    "BreakingDimensions.mp3": [
        { time: 2.4,  text: "(Intro)" },
        
        //Verse 1
        { time: 14.21,  text: "Look up at the horizon together as one" },
        { time: 17.36,  text: "A star is on the rise and it's only begun" },
        { time: 20.73,  text: "The pivotal moment we're clamoring for" },
        { time: 23.86,  text: "An infinite future's at our door" },
        { time: 26.76,  text: "(Yeah) It's a timeless story with a new feel, not just allegory, it's real" },
        { time: 30.82,  text: "Wake up, Big dreams about to come true, that means it's time to break through" },
        { time: 34.4,  text: "Never knew that we'd make it so far but we're striving, thriving, here we are" },
        { time: 37.48,  text: "Achieving the impossible, we're virtually unstoppablе" },
        
        //Pre-chorus
        { time: 40.66,  text: "We can't sit still, we just keep moving" },
        { time: 43.68,  text: "Now evеrybody sing" },

        //Chorus
        { time: 46.7,  text: "We're making our way to the next dimension" },
        { time: 50.17,  text: "We'll reinvent the world that we live in" },
        { time: 53.2,  text: "We'll greet everyday with new intentions" },
        { time: 56.45,  text: "Break conventions, run right through" },
        { time: 59.4,  text: "(This is it!)\n Been smashing barriers left and right" },
        { time: 62.67,  text: "(That's our Myth!)\n Strong as we ever were, scaling heights" },
        { time: 65.85,  text: "(It's endless!)\n So get together, let's reunite" },
        { time: 69,  text: "Reach up, reach out, the future's bright" },

        //Verse 2
        { time: 72.9,  text: "We've been together for what feels like an eternity" },
        { time: 75.8,  text: "The times are changing, but we're ready for infinity, yeah" },
        { time: 79.72,  text: "Our stories align" },
        { time: 81.4,  text: "We're gonna go far when we combine" },
        { time: 84.39,  text: "So look at the horizon and then look beyond" },
        { time: 87.76,  text: "We'll marvel at the skies and the strength of our bond" },
        { time: 90.84,  text: "We're making a vow to the smiling stars" },
        { time: 94.2,  text: "A powerful moment that's all ours" },

        //Pre-chorus
        { time: 98.43,  text: "The seasons change, but we keep shining" },
        { time: 101.3,  text: "Now everybody sing (Keep it going)" },

        //Chorus
        { time: 104.8,  text: "We're making our way to the next dimension" },
        { time: 108,  text: "A million thrills in every direction" },
        { time: 110.9,  text: "We'll give every mile our full attention" },
        { time: 113.7,  text: "Breaking tension, breaking through" },
        { time: 116.8,  text: "(We won't miss!)\nWith endless energy stronger ties" },
        { time: 120.13,  text: "(We got this!)\n A perfect harmony we devise" },
        { time: 123.5,  text: "(We Promise!)\n So clap along with me (Time to rise!)" },
        { time: 126.7,  text: "The future's right before our eyes" },

        //Bridge
        { time: 130.8,  text: "A new dimension of freedom that we've found" },
        { time: 134.7,  text: "Yeah, we've made it" },
        { time: 136.87,  text: "We're breaking out of the mold, no longer bound" },
        { time: 140.9,  text: "We're unlimited" },
        { time: 142.6,  text: "We're gonna spring to life and break the chains, turn up the hype, can't be contained" },
        { time: 146.2,  text: "We're shaking up the status quo, no time to stop, we're good to go" },
        { time: 149.4,  text: "The whole wide world is listening" },
        { time: 152.59,  text: "So everybody sing" },

        //Chorus
        { time: 157.3,  text: "We're making our way to the next dimension\n(Aaaaahh~)" },
        { time: 160.8,  text: "We're living out the dreams we believe in\n(Wooaaahh~)" },
        { time: 164.1,  text: "Excitement beyond our comprehension" },
        { time: 166.84,  text: "There's no question we'll break through" },
        { time: 169.87,  text: "(Don't relent!)\n We'll keep aspiring to excel" },
        { time: 172.88,  text: "(It's Advent!)\n It's awe-inspiring, going well" },
        { time: 176,  text: "(Represent!)\n So light the fire and let's rebel!" },
        { time: 179.6,  text: "The future's brighter, we can tell" },
        { time: 182,  text: "(music)" },
    ],

    "UnstoppableIndianver.mp3": [
        { time: 0,  text: "(intro)" },

        { time: 17.5, text: "All smiles, I know what it takes to fool this town" },
        { time: 21, text: "I'll do it 'til the sun goes down"},
        { time: 24,text: "And all through the nighttime"},
        { time: 28.5, text: "Oh, yeah, I'll tell you what you wanna hear"},
        { time: 32, text: "Leave my sunglasses on while I shed a tear"},
        { time: 35, text: "It's never the right time"},

        { time: 39, text: "I put my armor on, show you how strong I am"},
        { time: 45, text: "I put my armor on, I'll show you that I am"},

        { time: 50, text: "I'm unstoppable"},
        { time: 53, text: "I'm a Porsche with no brakes"},
        { time: 56, text: "I'm invincible"},
        { time: 58.5, text: "I win every single game"},
        { time: 61.5, text: "I'm so powerful"},
        { time: 64, text: "I don't need batteries to play"},
        { time: 67, text: "I'm so confident"},
        { time: 69, text: "I'm unstoppable today"},

        { time: 73, text: "Unstoppable today"},
        { time: 75.7, text: "Unstoppable today"},
        { time: 78, text: "Unstoppable today"},
        { time: 80, text: "I'm unstoppable today"},

        { time: 85.7, text: "Break down, only alone I will cry out loud"},
        { time: 89.7, text: "You'll never see what's hiding out"},
        { time: 91, text: "Hiding out deep down"},
        { time: 96.7, text: "I know, I've heard that to let your feelings show"},
        { time: 100, text: "Is the only way to make friendships grow"},
        { time: 103, text: "But I'm too afraid now"},

        { time: 107.7, text: "I put my armor on, show you how strong I am"},
        { time: 112, text: "I put my armor on, I'll show you that I am"},

        { time: 118.7, text: "I'm unstoppable"},
        { time: 121.7, text: "I'm a Porsche with no brakes"},
        { time: 124, text: "I'm invincible"},
        { time: 126.5, text: "I win every single game"},
        { time: 129.5, text: "I'm so powerful"},
        { time: 132.5, text: "I don't need batteries to play"},
        { time: 135, text: "I'm so confident"},
        { time: 138, text: "I'm unstoppable today"},

        { time: 141, text: "Unstoppable today"},
        { time: 143, text: "Unstoppable today"},
        { time: 146, text: "Unstoppable today"},
        { time: 148.5, text: "I'm unstoppable today"},
        { time: 151.5, text: "Unstoppable today"},
        { time: 154.5, text: "Unstoppable today"},
        { time: 157, text: "Unstoppable today"},
        { time: 159.5, text: "I'm unstoppable today"},

        { time: 165, text: "I put my armor on, show you how strong I am"},
        { time: 170.5, text: "I put my armor on, I'll show you that I am"},
    ],
    "CSTM-TikTok.mp3": [
        { time: -1, text:"Giginya ompong menggerong Ranto Gudel Mendehem nyungsep"},
        { time: 3.7, text:"Thuyul gundhul ke sana ke sini mengempit gendul"},
        { time: 6.5, text:"Gendruwo thela-thelo tampak loyo"},
        { time: 8.8, text:"Jlangkong jalannya miring-miring eh dhoyong"},
        { time: 11.5, text:"Belum selesai menabuhNong ji nong ro"},
        { time: 14, text:"Pak Mloyo terguling ke Bengawan Solo"},
        { time: 16.7, text:"Dengan irama alunan nong ji nong ro"},
        { time: 19.7, text:"Pak Mloyo pulang jalannya geloyoran"},
        
        { time: 22, text:"Sengkuni leda-lede"},
        { time: 25.5, text:"Mimpin baris ngarep dhewe"},
        { time: 28.5, text:"Eh barisane menggok"},
        { time: 31, text:"Sengkuni kok malah ndheprok"},

        { time: 33.5,  text: "Ranto Gudel meminum arak bekonang"},
        { time: 36.8,  text: "Mengantar gadis pulang berdandan bidan"},
        { time: 38.8,  text: "Roknya putih, bajunya putih"},
        { time: 42,  text: "Serba putih, lebih daripada peri"},
        { time: 45,  text: "Tiba di pinggir kali"},
        { time: 46,  text: "Ranto Gudel diajak belok ke kiri"},
        { time: 49,  text: "Dhemit elek a'u tenan"},
        { time: 52,  text: "Ngumpat Ranto Gudel geram"},
        
        { time: 54.5,  text: "Ia marah terendam arak bekonang"},
        { time: 57.3,  text: "Hampir saja aku bercinta dengan setan"},
        { time: 60,  text: "Cinta manusia seperti Umbul Beking"},
        { time: 62,  text: "Dulu bening sekarang keruh"},
        { time: 64,  text: "Ranto Gudel dengan empat istrinya\n\nTak pernah abadi cintanya"},
        
        { time: 67,  text: "Sengkuni leda-lede"},
        { time: 70,  text: "Mimpin baris ngarep dhewe"},
        { time: 73,  text: "Eh barisane menggok"},
        { time: 76,  text: "Sengkuni kok malah ndheprok"},
        { time: 78.9,  text: "Nong, eh, nong ji nong ro"},
        { time: 81,  text: "Nong, eh nong ji nong ro"},
        { time: 84,  text: "Nong, eh, nong ji nong ro"},
        { time: 86,  text: "Nong, eh, nong ji nong ro"},
    ],
    "Human.mp3": [
        //intro
        { time: 2.46,  text: "(I'm only human)"},
        { time: 5.7,  text: "(I'm only, I'm only)"},
        { time: 8.7,  text: "(I'm only human, human)"},

        //verse 1
        { time: 13.57,  text: "Maybe I'm foolish, maybe I'm blind"},
        { time: 16.13,  text: "Thinkin' I can see through this and see what's behind"},
        { time: 19.9,  text: "Got no way to prove it, so maybe I'm lyin'"},

        //chorus
        { time: 24.7,  text: "But I'm only human after all"},
        { time: 28,  text: "I'm only human after all"},
        { time: 30.5,  text: "Don't put your blame on me"},
        { time: 34,  text: "Don't put your blame on me (Oh)"},

        //verse 2
        { time: 38.7,  text: "Take a look in the mirror and what do you see?"},
        { time: 42.68,  text: "Do you see it clearer or are you deceived"},
        { time: 47,  text: "In what you believe? (Oh)"},

        //chorus
        { time: 50.47,  text: "'Cause I'm only human after all"},
        { time: 53,  text: "You're only human after all"},
        { time: 56.38,  text: "Don't put the blame on me"},
        { time: 59.58,  text: "Don't put your blame on me"},

        //refrain
        { time: 63.68,  text: "(Oh) Some people got the real problems"},
        { time: 67.5,  text: "(Oh) Some people out of luck"},
        { time: 69.82,  text: "(Oh) Some people think I can solve them"},
        { time: 73.82,  text: "(Oh) Lord heavens above (Oh)"},

        //chorus
        { time: 75.93,  text: "I'm only human after all"},
        { time: 79,  text: "I'm only human after all"},
        { time: 81.7,  text: "Don't put the blame on me"},
        { time: 85,  text: "Don't put the blame on me"},

        //verse 3
        { time: 89.64,  text: "Don't ask my opinion, don't ask me to lie"},
        { time: 93,  text: "Then beg for forgiveness for making you cry"},
        { time: 98.18,  text: "For making you cry"},

        //chorus
        { time: 101.78,  text: "'Cause I'm only human after all"},
        { time: 104.31,  text: "I'm only human after all"},
        { time: 107.18,  text: "Don't put your blame on me"},
        { time: 110.82,  text: "Don't put the blame on me"},

        //refrain
        { time: 114.32,  text: "(Oh) Oh, some people got the real problems"},
        { time: 118.38,  text: "(Oh) Some people out of luck"},
        { time: 120.88,  text: "(Oh) Some people think I can solve them"},
        { time: 125,  text: "(Oh) Lord heavens above (Oh)"},

        //chorus
        { time: 127,  text: "I'm only human after all"},
        { time: 130.6,  text: "I'm only human after all"},
        { time: 133.56,  text: "Don't put the blame on me"},
        { time: 136,  text: "Don't put the blame on me (Oh)"},
        { time: 140,  text: "I'm only human, I make mistakes"},
        { time: 143.38,  text: "I'm only human, that's all it takes"},
        { time: 145.92,  text: "To put the blame on me"},
        { time: 149.42,  text: "Don't put the blame on me"},

        //bridge
        { time: 154.3,  text: "(Ooh) 'Cause I'm no prophet or Messiah"},
        { time: 159.98,  text: "(Ooh) You should go lookin' somewhere higher"},

        //chorus
        { time: 169.25,  text: "I'm only human after all"},
        { time: 171.7,  text: "I'm only human after all"},
        { time: 174.89,  text: "Don't put the blame on me"},
        { time: 177.94,  text: "Don't put the blame on me"},
        { time: 181,  text: "I'm only human, I do what I can"},
        { time: 184.7,  text: "I'm just a man, I do what I can"},
        { time: 187.27,  text: "Don't put the blame on me"},
        { time: 190.39,  text: "Don't put your blame on me"},
    ],

    "nightdancer.mp3": [
        //intro
        { time: 0.96,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo", en: "It's an unexceptional, ordinary night" },
        { time: 4.76,  text: "響めき 煌めきと君も", romaji:"Toyomeki kirameki to kimi mo (Oh)", en:"The noise, the sparkle, and you"},
        { time: 9.3,  text:"(music)"},

        //verse1
        { time: 24.81,  text: "まだ止まった 刻む針も", romaji:"Mada tomatta kizamu hari mo", en:"The clock hands are frozen again" },
        { time: 29.04,  text: "入り浸った 散らかる部屋も", romaji:"Iribitatta chirakaru heya mo", en:"The frequented, cluttered room" },
        { time: 33.12,  text: "変わらないね 思い出しては", romaji:"Kawaranai ne omoidashite wa", en:"Nothing changed, but as I look back" },
        { time: 37.27,  text: "二人 歳を重ねてた ah", romaji:"Futari toshi wo kasaneteta, ah", en:"We both had gotten older" },

        //verse2
        { time: 41.31,  text: "また止まった 落とす針を", romaji:"Mata tomatta otosu hari wo", en:"The music stops again, you drop the needle" },
        { time: 45.25,  text: "よく流した 聞き飽きるほど", romaji:"Yoku nagashita kiki akiru hodo", en:"We've replayed it so much, we nearly grow bored of it" },
        { time: 49.48,  text: "変わらないね 変わらないで", romaji:"Kawaranai ne kawaranaide", en:"Nothing changed, please don't change" },
        { time: 53.63,  text: "いられたのは 君だけか ah", romaji:"Irareta no wa kimi dake ka, ah", en:"You're the only one who's stayed" },

        //pre-chorus
        { time: 57.59,  text: "無駄話で はぐらかして", romaji:"Mudabanashi de hagurakashite", en:"We avoid the topic with small talk" },
        { time: 61.75,  text: "触れた先を ためらうように", romaji:"Fureta saki wo tamerau you ni", en:"We hesitate to touch the subject" },
        { time: 65.96,  text: "足踏みして ズレた針を余所に", romaji:"Ashibumi shite zureta hari wo yoso ni", en:"We stop to push the hands forward" },
        { time: 70.91,  text: "揃い始めてた 息が", romaji:"Soroi hajimeteta iki ga", en:"Our breaths start to sync" },

        //chorus
        { time: 74.68,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo", en:"It's an unexceptional, ordinary night" },
        { time: 78.77,  text: "響めき 煌めきと君も '踊ろう'", romaji:"Doyomeki kirameki to kimi mo 'odorou'", en:"Dance with the noise, the sparkle, and you" },
        { time: 83.09,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo, ah", en:"It's an average, boring night" },
        { time: 87.41,  text: "Ah 二人刻もう", romaji:"Futari kizamou", en:"But let's move forward together" },
        { time: 91.6, text:"(music)"},

        //verse3
        { time: 106.7,  text: "透き通った 白い肌も", romaji:"Sukitootta shiroi hada mo", en:"Your carefree smile" },
        { time: 110.92,  text: "その笑った 無邪気な顔も", romaji:"Sono waratta mujaki na kao mo", en:"Your carefree smile" },
        { time: 115.09,  text: "変わらないね 変わらないで", romaji:"Kawaranai ne kawaranaide", en:"Nothing changed, please don't change" },
        { time: 119.16,  text: "いられるのは 今だけか ah ah ah", romaji:"Irareru no wa ima dake ka, ah", en:"But this is only just for now" },

        //verse4
        { time: 124.02,  text: "見つめるほどに", romaji:"Mitsumeru hodo ni", en:"The more I stare" },
        { time: 126.13,  text: "溢れる メモリー", romaji:"Afureru memorii", en:"The more memories that overflow" },
        { time: 128.55,  text: "浮つく心に コーヒーを", romaji:"Uwatsuku kokoro ni koohii wo", en:"A cup of coffee for a wavering heart" },
        { time: 132.1,  text: "乱れた髪(ヘア)に 掠れたメロディー", romaji:"Midareta heya ni kasureta merodii", en:"A disheveled room, a scratchy melody" },
        { time: 136.81,  text: "混ざりあってよう もう一度", romaji:"Mazariatteyou mou ichido", en:"Let's blend together, one more time" },

        //chorus
        { time: 140.54,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo", en:"It's an unexceptional, ordinary night" },
        { time: 144.5,  text: "ときめき 色めきと君も '踊ろう'", romaji:"Tokimeki iromеki to kimi mo 'odorou'", en:"Dance with my beating heart, my elation, and you" },
        { time: 148.54,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo, ah", en:"It's an average, boring night" },
        { time: 152.92,  text: "Ah 二人刻もう", romaji:"Futari kizamou", en:"But let's move forward together" },

        //bridge
        { time: 156.77,  text: "夜は長い おぼつかない", romaji:"Yoru wa nagai obotsukanai", en:"The night is long and uncertain" },
        { time: 160.81,  text: "今にも止まりそうな ミュージック", romaji:"Ima ni mo tomarisou na myuujikku", en:"The music could stop at any moment" },
        { time: 164.73,  text: "君といたい 溺れてたい", romaji:"Kimi to itai oboretеtai", en:"I want to be with you, to drown with you" },
        { time: 169.02,  text: "明日がこなくたって もういいの", romaji:"Ashita ga konakutatte mou ii no", en:"I don't care if tomorrow never comes" },

        //chorus
        { time: 175.23,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo", en:"It's an unexceptional, ordinary night" },
        { time: 179.11,  text: "響めき 煌めきと君も '踊ろう'", romaji:"Doyomeki kirameki to kimi mo 'odorou'", en:"Dance with the noise, the sparkle, and you" },
        { time: 183.44,  text: "どうでもいいような 夜だけど ah", romaji:"Dou demo ii you na yoru da mkedo, ah", en:"It's an average, boring night" },
        { time: 190.48,  text: "Ah 愛して", romaji:"Ah, aishite", en:"Love me" },
        { time: 191.7,  text: "どうでもいいから 僕だけを", romaji:"Dou demo ii kara boku dake wo", en:"Who cares anymore, just look at me" },
        { time: 195.58,  text: "ふらつき よろめきながらも '踊ろう'", romaji:"Furatsuki yoromeki nagara mo 'odorou'", en:"Let's dance as we sway and stumble" },
        { time: 199.88,  text: "どうでもいいような 夜だけど", romaji:"Dou demo ii you na yoru dakedo, ah", en:"It's an unexceptional, ordinary night" },
        { time: 204.35,  text: "Ah 二人刻もう", romaji:"Futari kizamou", en:"But let's move forward together" },
        { time: 207.3,  text:"(music)" },
        
    ],

     "Overdose.mp3": [
        //intro
        { time: 0.50,  text: "(Dose, give me, give me)" },
        { time: 8.87,  text: "(Dose, give me, give me)" },

        //verse1
        { time: 17.05,  text: "本当は分かっていた", romaji:"Hontou wa wakatteita", en:"To be honest, I knew"},
        { time: 18.63,  text: "いけないことだったって, 分かっていたのに", romaji:"Ikenai koto datatte, wakatteita no ni", en:"I knew it was gonna be hopeless, but still"},
        { time: 21.23,  text: "この手をすり抜ける全部が愛に見えたの", romaji:"Kono te wo surinukeru zenbu ga ai ni mieta no", en:"Everything that slips through these hands looks like love"},
        { time: 25.25,  text: "確かめていた言葉が形になって, 揺れるだけ", romaji:"Tashikameteita kotoba ga katachi ni natte, yureru dake", en:"The words I made sure of take shape, only wavering"},

        //prechorus
        { time: 33.06,  text: "弾いて, 描いて きっと, それだけ", romaji:"Hajiite, kaite kitto, sore dake", en:"Strumming, drawing, only doing those for sure"},
        { time: 35.19,  text: "つまらないな, 正解の読み合わせ", romaji:"Tsumaranai na, seikai no yomiawase", en:"Isn't it boring, reading and comparing our answers"},
        { time: 37.71,  text: "あとちょっとで分かりかけていたのに", romaji:"Ato chotto de wakari kaketeita no ni", en:"Even though I was so close to figuring it out"},
        { time: 41.42,  text: "飲んで, 吐いて 全部忘れちゃえ", romaji:"Nonde, haite zenbu wasurechae", en:"Drinking, vomiting, forgetting everything"},
        { time: 43.3,  text: "水をまとった本心と鏡合わせ", romaji:"Mizu wo matotta honshin to kagami awase", en:"Looking at my true feelings that are clad in water, in the opposing mirrors"},
        { time: 45.85,  text: "見つめ, 会えたら", romaji:"Mitsume, aetara", en:"Once our eyes meet"},

        //chorus
        { time: 48.85,  text: "Overdose 君とふたり やるせない日々", romaji:"Overdose kimi to futari yarusenai hibi", en:"Overdose, you and me, the days that make me feel helpless"},
        { time: 53.63,  text: "解像度の悪い夢を見たい", romaji:"Kaizoudo no warui yume wo mitai", en:"I wanna dream of a blurred-out nightmare"},
        { time: 57.17,  text: "Overdose 君とふたり 甘いハッタリ", romaji:"Overdose kimi to futari amai hattari", en:"Overdosе, you and me A sweet bluff"},
        { time: 61.7,  text: "Don't stop it music, darling"},
        { time: 65.7,  text:"(music)"},

        //verse2
        { time: 74.02,  text: "本当に分かっている?", romaji:"Hontou ni wakatteiru?", en:"Did you really know?"},
        { time: 75.64,  text: "いけないことだったって, 分かっている?", romaji:"Ikenai koto datatte, wakatteiru?", en:"Did you really know that it was gonna be helpless?"},
        { time: 77.73,  text: "多分, 時間だけが過ぎていく問答で満ちていく", romaji:"Tabun, jikan dake ga sugite iku mondou dе michite iku", en:"Maybe only time’s just passing, filled with questions and answers"},
        { time: 82.3,  text: "言い訳する間もなく, 裸になってしまうだけ", romaji:"Iiwake suru ma mo naku, hadaka ni natte shimau dakе", en:"I’ve got no time to make excuses, I’ll just go naked"},

        //prechorus
        { time: 89.77,  text: "きっと, 溜まっていくんだ ずっと", romaji:"Kitto, tamatte ikun da zutto", en:"Surely, it’ll keep piling up, forever"},
        { time: 91.73,  text: "終わってしまえばいいと, ふっと", romaji:"Owate shimaeba ii to, futto", en:"It’d be nice if we could end this, abruptly"},
        { time: 93.65,  text: "傷んで腐っていく あの甘い果実のように 僕ら 壊れていく", romaji:"Itande kusatte iku, ano amai kajitsu no you ni bokura, kowarete iku", en:"Spoiling and rotting, just like that sweet fruit, we start to break"},
        { time: 97.79,  text: "だから踊って, 眠って 全部忘れちゃえ", romaji:"Dakara odotte, nemutte zenbu wasurechae", en:"That’s why I dance, sleep, and forget everything"},
        { time: 100.19,  text: "嘘を被ったあなたと隣り合わせ", romaji:"Uso wo kabutta anata to tonariawase", en:"Next to you, all dressed in lies"},
        { time: 102.82,  text: "見つめ, 会えたら", romaji:"Mitsume, aetara", en:"Once our eyes meet"},

        //chorus
        { time: 106.07,  text: "Overdose 君とふたり", romaji:"Overdose kimi to futari", en:"Overdose, me and you"},
        { time: 108.7,  text: "分かりたいのに", romaji:"Wakaritai no ni", en:"Even though I wanna understand"},
        { time: 110.55,  text: "変に間の悪い嘘が嫌い", romaji:"Hen ni ma no warui uso ga kirai", en:"I hate those strangely in-between lies"},
        { time: 114.05,  text: "Overdose 君とふたり", romaji:"Overdose kimi to futari", en:"Overdose, me and you"},
        { time: 116.86,  text: "分かりたいのに", romaji:"Wakaritai no ni", en:"Even though I wanna understand"},
        { time: 118.74,  text: "Two step from (hell) with me, darling (ah, ah, ah, oh yeah)"},
      
        //instrumental
        { time: 123.5,  text:"(music)"},

        //chorus
        { time: 140.5,  text: "Overdose 君とふたり", romaji:"Overdose kimi to futari", en:"Overdose, you and me,"},
        { time: 143.32,  text: "やるせない日々", romaji:"Yarusenai hibi", en:"The days that make me feel helpless"},
        { time: 145.11,  text: "解像度の悪い夢を見たい", romaji:"Kaizoudo no warui yume wo mitai", en:"I wanna dream of a blurred-out nightmare"},
        { time: 148.78,  text: "Overdose 君とふたり", romaji:"Overdose kimi to futari", en:"	Overdose, you and me"},
        { time: 151.47,  text: "甘いハッタリ", romaji:"Amai hattari", en:"a sweet bluff"},
        { time: 153.3,  text: "Don't stop it music, darling"},

        { time: 156.88,  text: "Overdose 君とふたり", romaji:"Overdose kimi to futari", en:"Overdose, me and you"},
        { time: 159.61,  text: "分からない", romaji:"Wakaranai", en:"I don’t understand"},
        { time: 160.7,  text: "けど, 変に間の悪い嘘でもいいから", romaji:"Kedo, hen ni ma no warui uso demo ii kara", en:"	But, even those strangely in-between lies’ll be just fine, so"},
        { time: 165.48,  text: "どう, 君とふたり 甘いハッタリ", romaji:"Dou, kimi to futari amai hattari", en:"What do you think, me and you, a sweet bluff"},
        { time: 169.63,  text: "Don't stop it music, darling"},

        //outro
        { time: 173.64,  text: "Dose, give me, give me"},
        { time: 181.83,  text: "Dose, give me, give me"},
        { time: 185.77,  text: "Don't stop it music, darling"},
     ],

     "UnfinishedJourney.mp3": [
        { time: 0, text:"(intro)"},

        //intro
        { time: 17.55, text:"The constellations in your eyes"},
        { time: 23.24, text:"That's where we're meant to be"},

        //verse1
        { time: 32.88, text:"Set off back on a long ride"},
        { time: 41.04, text:"Trailing the sketches of the sun"},
        { time: 45.11, text:"Fire of stars whispers afar"},

        //verse2
        { time: 50.17, text:"Racing hearts, stay unquiet"},
        { time: 56.92, text:"Looking into the guiding light"},
        { time: 61.02, text:"Searching for glow of better days"},
        { time: 66,  text: "(music)" },

        //prechorus
        { time: 71.95, text:"(I'll be there for you)"},
        { time: 74,  text: "(music)" },

        //chorus
        { time: 81.09, text:"Reaching for the stars"},
        { time: 85.67, text:"Ever-wander in galaxy (Explore the universe)"},
        { time: 89.89, text:"Your wound or scars (Or sorrow)"},
        { time: 94.08, text:"Are driving you to brightness from the dark"},

        //postchorus
        { time: 97.12, text:"Reaching for the stars"},
        { time: 101.62, text:"Ever-hover in boundlеss sky(I'll be there for you)"},
        { time: 105.98, text:"We won't be apart"},
        { time: 109.58, text:"As our passion's nevеr gon' change"},
        { time: 114,  text: "(music)" },

        //verse3
        { time: 131.2, text:"Frantic escape from the Voidworm"},
        { time: 137.18, text:"Drift through the storm"},
        { time: 141.13, text:"Into the unknown"},

        //verse4
        { time: 145.12, text:"(Ooh) Freshly rising sun"},
        { time: 149.27, text:"Revive the frozen down below"},
        { time: 153.02, text:"No matter how the world would change"},
        { time: 156.96, text:"Keep reaching for what's out of range"},
        { time: 161.8,  text: "(music)" },

        //prechorus
        { time: 168.12, text:"(I'll be there for you)"},
        { time: 170,  text: "(music)" },

        //chorus
        { time: 177.18, text:"Reaching for the stars"},
        { time: 181.57, text:"Stretching beyond the horizon (Anticipate the thrill)"},
        { time: 185.86, text:"And loose your guard (It won't hurt)"},
        { time: 189.92, text:"Just step forward, shaking off the doubts"},

        //postchorus
        { time: 192.97, text:"Reaching for the stars"},
        { time: 197.52, text:"Getting rid of our solitude (I'll be there for you)"},
        { time: 201.91, text:"We'd move from the dark (We won't stop)"},
        { time: 205.87, text:"For one day there'll be a dawn break"},
        { time: 210,  text: "(music)" },

        //outro
        { time: 218, text:"(Stars)"},
        { time: 222, text:"(Stars)"},
        { time: 224,  text: "(music)" }

     ],

     "Show-Ado.mp3": [
        //intro
        { time: 0.7, text:"(Nah-nah-nah-nah-nah, ready for my show)"},
        { time: 4.28, text:"Okay たちまち独壇場 listen, listen", romaji:"Okay, tachimachi dokudanjou Listen, listen", en:"Okay, one man show Listen, listen"},
        { time: 7.94, text:"(Nah-nah-nah-nah-nah, ready for my show)"},
        { time: 11.09, text:"傾け", romaji:"Kabuke", en:"Go crazy"},
        { time: 17.84, text:"振り切ろう (Giga, TeddyLoid)", romaji:"Furikirou (Giga, TeddyLoid)", en:"Let's shake it off (Giga, TeddyLoid)"},

        //verse1
        { time: 20.38, text:"Ha! ヤーヤーヤーヤーヤー 唱タイム", romaji:"Ha! Ya-ya-ya-ya-ya shou taimu", en:""},
        { time: 22.71, text:"天辺の御成り ほらおいで", romaji:"Teppen no onari hora oide", en:"Behold the summit's grand arrival, come over now"},
        { time: 25.76, text:"宵をコンプリートオーライ hell yeah, yeah, yeah, yeah", romaji:"Yoi wo konpuriito oorai hell yeah, yeah, yeah, yeah", en:"Complete the night, alright, hell yeah, yeah, yeah, yeah  "},
        { time: 29.75, text:"だんだんノリノリで超簡単 brah, brah, brah! Pow", romaji:"Dandan norinori de chou kantan brah, brah, brah! Pow", en:"Getting pumped up, it's super easy, brah, brah, brah! Pow"},
        { time: 32.96, text:"えも言われない ain't nobody stop (ha, ha)", romaji:"Emo iwarenai ain't nobody stop (Ha, ha)", en:"It's beyond words, ain't nobody stop (Ha, ha)"},

        //verse2
        { time: 36.63, text:"オイ 全土絢爛豪華 attention 騒ごうか", romaji:"Oh, zendo kenran gouka Attention sawagouka", en:"Oh, the realm shines in stunning splendor Attention! Let's make some noise"},
        { time: 40.55, text:"意思表示にもうじき衝撃の声高らか堂々登板", romaji:"Ishi hyouji ni mou jiki shougeki no koe takaraka doudou touban", en:"Soon, comes an impressive debut, expressing purpose with a voice of impact"},
        { time: 44.53, text:"もう伽藍洞は疾っくの疾う淘汰", romaji:"Mou garandou wa tokku no tou touta", en:"The empty shrine has long been eradicated"},
        { time: 48.22, text:"Ay 繚乱桜花 御出ましだ", romaji:"Ay, ryouran ouka odemashi da, ah", en:"Ay, cherry blossoms madly bloom, behold the grand arrival"},

        //prechorus
        { time: 51.74, text:"格好つけてるつもりは no, no", romaji:"Kakkou tsuketeru tsumori wa no, no", en:"I don't mean to show off, no, no"},
        { time: 55.4, text:"オートマティックに溢れちゃう本能", romaji:"Ootomatikku ni afurechau honnou", en:"It's automatic, natural instincts overflow"},
        { time: 58.6, text:"宣う断頭台の上で 燥げ華麗", romaji:"Notamau dantoudai no ue de hashage karei", en:"On top of a ironic guillotine, have a blast, gracefully"},
        { time: 64.32, text:"Da-rat-a-tat-a-tat, warning!"},

        //chorus
        { time: 66.12, text:"Nah-nah-nah-nah-nah, ready for my show"},
        { time: 69.03, text:"バンザイ 遊ぶ気に寿 shout it out, shout it out", romaji:"Banzai asobuge ni kotobuki Shout it out, shout it out", en:""},
        { time: 73.4, text:"Nah-nah-nah-nah-nah, ready for my show"},
        { time: 76.58, text:"はんなり 感情通りに八艘飛び", romaji:"Hannari kanjou doori ni hassou tobi", en:"Elegantly soaring, let emotions guide"},
        { time: 78.78, text:"Shout it out, shout it out (ooh)"},

        //postchorus
        { time: 81.35, text:"(Hey, uh) 食らっちゃいな", romaji:"(Hey, uh) Kuracchai na", en:"(Hey, uh) Eat it up"},
        { time: 84.7, text:"(Hey, ha) rat-a-tat-tat-tat"},
        { time: 87.43, text:"(Pull up) hey, uh, brah, brah, pow"},
        { time: 90.94, text:"満開 総員一気にとびきり jump around", romaji:"Mankai souin ikki ni tobikiri jump around", en:"Full bloom, all at once with full force, jump around"},

        //verse3
        { time: 95.16, text:"Look at me now"},
        { time: 95.49, text:"皮膚を破りそうな程に", romaji:"Hifu wo yaburisou na hodo ni haneru shinzou", en:"Passionately intense specification"},
        { time: 97.78, text:"跳ねる心臓くらい激情的仕様 (exotic vox)", romaji:"Kurai gekijouteki shiyou (Exotic vox)", en:"Almost like a heart pounding fiercely through the skin (Exotic vox)"},
        { time: 101.8, text:"イニミニマニモ ご来場からのご来光", romaji:"Ini mini mani mo goraijou kara no goraikou", en:"Eeny-meeny-miny-moe the view of the sunrise upon a presence"},
        { time: 103.99, text:"かくれんぼしてるその気持ち解放", romaji:"Kakurenbo shiteru sono kimochi kaihou", en:"Set free the elusive feeling that's been playing hide and seek"},
        { time: 105.86, text:"（理性アディオス）", romaji:"(Risei adiosu)", en:"(Adios rationality)"},
        { time: 106.44, text:"しゃかりきじみちゃう (ay, ay, ay, ay)", romaji:"Shakariki jimichau (Ayy, ayy, ayy, ayy)", en:"Becoming reckless (Ay, ay, ay)"},

        //verse4
        { time: 109.89, text:"蛇腹刃蛇尾 騙る二枚刃", romaji:"Jabarabadabi kataru nimaiba", en:"Jabarabadabi a dual-faced deception"},
        { time: 111.49, text:"野心家嫉妬するようなジュース", romaji:"Yashinka shitto suru you na juusu", en:"The ambitious one, got the juice it makes me jealous"},
        { time: 113.23, text:"たぶらかすな かっとなっちゃ嫌", romaji:"Taburakasu nakatto naccha iya", en:"Don't play tricks, don't loose your temper"},
        { time: 115.1, text:"カルマに至る前に揺蕩うわ", romaji:"Karuma ni itaru mae ni tayutau wa", en:"Before reaching karma, let me wander and sway"},
        { time: 117.06, text:"蛇腹刃蛇尾 騙る二枚刃", romaji:"Jabarabadabi kataru nimaiba", en:"Jabarabadabi a dual-faced deception"},
        { time: 118.99, text:"野心家 嫉妬するようなジュース", romaji:"Yashinka shitto suru you na juusu", en:"The ambitious one, got the juice it makes me jealous"},
        { time: 120.47, text:"たぶらかすな かっとなっちゃ嫌", romaji:"Taburakasu nakatto naccha iya", en:"Don't play tricks, don't loose your temper"},
        { time: 122.59, text:"十色のバタフライ (no escape)", romaji:"Toiro no batafurai (No escape)", en:"Colorful butterfly (No escape)"},

        //verse4
        { time: 126.84, text:"ご存じの通り 騒々しい鼓動に", romaji:"Gozonji no doori souzoushii kodou ni", en:"You see, I can't stop anymore"},
        { time: 130.2, text:"絆されてもう止まれない ay", romaji:"Hodasarete mou tomarenai", en:"Bounded by the noisy heartbeat"},
        { time: 133.82, text:"衝動に塗装し描いた daybreak", romaji:"Shoudou ni tosou shi egaita daybreak", en:"Daybreak painted with impulsive hues"},
        { time: 139.09, text:"肺貫通 低音狂", romaji:"Hai kantsuu teionkyou", en:"Maddening basstones piercing through the lungs"},

        //prechorus
        { time: 140.61, text:"(Nah-nah-nah-nah-nah, ready for my show)"},
        { time: 143.82, text:"異例の危険度 比類なき活気充満", romaji:"Irei no kiken do hirui naki kakki juuman", en:"Exceptional danger, boundless energy fills the air"},
        { time: 147.9, text:"(Nah-nah-nah-nah-nah, ready for my show)"},
        { time: 151.13, text:"いちかばちか 鳴呼", romaji:"Ichika bachika aa", en:"It's all or nothing, ahh"},

        //chorus
        { time: 155.16, text:"Nah-nah-nah-nah-nah, ready for my show"},
        { time: 158.1, text:"バンザイ 遊ぶ気に寿 shout it out, shout it out", romaji:"Banzai asobuge ni kotobuki Shout it out, shout it out", en:"Hooray, rejoice in the spirit of delight Shout it out, shout it out"},
        { time: 162.62, text:"Nah-nah-nah-nah-nah, ready for my show"},
        { time: 165.52, text:"喝采 巻き起こすために stay", romaji:"Kassai makiokosu tame ni stay", en:"To bring applause, stay"},
        { time: 169.95, text:"一切合切忘れて shout it out", romaji:"Issai gassai wasurete shout it out", en:"Forget everything, shout it out"},

        //postchorus
        { time: 174.1, text:"Ay, yeah, woah"},
        { time: 177.28, text:"右に左 まとめて rat-a-tat-a-tat (pull up)", romaji:"Migi ni hidari matomete rat-a-tat-a-tat (Pull up)", en:"Right and left, all together, rat-a-tat-a-tat (Pull up)"},
        { time: 181.2, text:"思いっ切り一気に (clap, clap, clap)", romaji:"Omoikkiri ikki ni (Clap, clap, clap)", en:"With all your might, altogether (Clap, clap, clap)"},
        { time: 183.69, text:"なにはともあれ ご唱和あれ", romaji:"Nani wa tomoare goshou wa are", en:"Whatever it may be, let's chant together"},
        { time: 186.05, text:"Shout it out, shout it out"},
     ],

     "BigDawgs.mp3": [
        //Intro
        { time: 5.69, text:"Uh, yeah, uh, yeah"},
        { time: 8.2, text:"Uh, yeah, uh, yeah "},
        { time: 10.9, text:"Uh, yeah, uh, yeah "},
        { time: 13.4, text:"Uh, yeah, uh, yeah "},

        //Verse 1
        { time: 16.26, text:"Wait a minute (Uh), get it how you live it (Uh)"},
        { time: 18.28, text:"Ten toes in when we standin' on business"},
        { time: 20.8, text:"I'm a big stepper, underground methods"},
        { time: 23.9, text:"Top notch hoes get the most, not the lesser (Most, not the lesser)"},
        { time: 26.93, text:"Straight terror, product of your errors"},
        { time: 29.51, text:"Pushing culture baby, got that product you can't measure\n(Product you can't measure)"},
        { time: 32.24, text:"Trendsetter, the one who gеts her wetter "},
        { time: 34.66, text:"Swеrving' while I'm bumpin' Project Pat, Yeah "},
        { time: 36.05, text:"Yeah, rollin' through the city with the big dogs "},
        { time: 39, text:"Fuck the laws, lawyer with me, we ain't gotta call"},
        { time: 41.3, text:"Celly on silent, but the product end up hella loud "},
        { time: 44.2,text:"That's how you make the money pile for everyone involved"},
        { time: 46.9, text:"But if you don′t deserve a cut then we gon' cut them off (Cut them off)"},
        { time: 49.56, text:"My barber got me looking proper every single time "},
        { time: 52.31, text:"Fresh fade getting faded on that top grade "},
        { time: 54.37, text:"You ain′t walkin' out alive smoking what we on "},
        { time: 57.05, text:"And you know I gotta pour it for the ones who gone (Gone)"},
        { time: 60.3, text:"RIP it′s in your memory we carry on "},
        { time: 63.1, text:"When I die they will not bury me, now what I want "},
        { time: 65.21, text:"Burn my body, pour my ashes in a river y'all "},
        { time: 68.3, text:"That's how we knowing that the flow about to carry on "},
        { time: 70.8, text:"See immortality′s a fallacy, I prove ′em wrong "},
        { time: 73.26, text:"The Sourthern family gon' carry me to way beyond "},
        { time: 76.3, text:"Anything you′ve ever known, anything you've done "},

        //Chorus
        { time: 79, text:"They ask me, 'How you get like this? "},
        { time: 81, text:"How you live like this? (What? what? what?)"},
        { time: 82.3, text:"Why you worried ′bout it ho?"},
        { time: 83.62, text:"Get up off my dick (Off my dick)"},
        { time: 84.9, text:"Get up out the way (Out the way)"},
        { time: 86, text:"What you think this is? (Think this is?)"},
        { time: 87.78, text:"We ain't worried ′bout it ho, watch me skrrt the whip "},
        { time: 89.68, text:"They ask me, 'How you get like this? (What? what?)"},
        { time: 91.78, text:"How you live like this? (What? what?)"},
        { time: 92.9, text:"why you worried 'bout it ho"},
        { time: 94, text:"Get up off my dick (Off my dick)"},
        { time: 95.18, text:"Get up out the way (Out the way)"},
        { time: 96.56, text:"What you think this is? (Think this is?)"},
        { time: 98.22, text:"We ain't worried ′bout it ho, watch me skrrt the whip, yeah "},

        //Verse 2
        { time: 100.85, text:"Yeah, swerving, moving to the money like it′s urgent "},
        { time: 104.08, text:"Hands on guy so I'm in it like a surgeon (Like a surgeon)"},
        { time: 106.9, text:"Uh, the skin colour like the bourbon "},
        { time: 109.2, text:"A worldwide sign that we face close curtains (Close curtains)"},
        { time: 111.9, text:"Out here yo, nothing′s ever certain "},
        { time: 114.78, text:"Only thing that's promised is that promises are broken (Promises are broken)"},
        { time: 117.87, text:"Yeah, so we finding ways to cope then "},
        { time: 119.84, text:"Only thing I′m breaking is her back with the motions(Whoo)"},
        { time: 123.52, text:"Yeah, baby girl bring out the goodies "},
        { time: 125.17, text:"Snuck it in inside her hoodie, now we turnin' up to boogie (Yeah)"},
        { time: 129, text:"In school I used to fight the bullies, now I′m fighting with the law "},
        { time: 131.94, text:"Guess some things don't leave you fully (Yessir)"},
        { time: 133.89, text:"They try and push me then they try and pull me"},
        { time: 136, text:"Bet I will not budge, if you doubt it then just call my bookie "},
        { time: 139.66, text:"And my bookie taking bet"},
        { time: 141.4, text:"Prophesize a profit when you know what's coming next like ooh "},

        //Outro
        { time: 145.26, text:"Yeah, baby girl bring out the goodies "},
        { time: 147.62, text:"Snuck it in inside her hoodie, now we turnin′ up to boogie (Yeah)"},
        { time: 152.65, text:"In school I used to fight the bullies, now I′m fighting with the law"},
        { time: 156.37, text:"Guess some things don't leave you fully "},
        { time: 159.19, text:"They try and push me then they try and pull me"},
        { time: 161.75, text:"Bet I will not budge, if you doubt it then just call my bookie "},
        { time: 166.68, text:"And my bookie taking bet"},
        { time: 168.82, text:"Prophesize a profit when you know what′s coming next like uh "},
        { time: 173.36, text:"Money on my mind, we gon' run it up"},
        { time: 176.84, text:"See what you can find, baby push your luck "},
        { time: 180.28, text:"We been on the grind, we been gettin′ up "},
        { time: 183.67, text:"We ain't got the time for you fucking bums "},
        { time: 187.26, text:"Money on my mind, we gon′ run it up "},
     ],

     "GodZilla.mp3": [
        //intro
        { time: 0.05, text:"Ugh, you're a monster"},

        //verse1
        { time: 2.22, text:"I can swallow a bottle of alcohol and I'll feel like Godzilla"},
        { time: 6.32, text:"Better hit the deck like the card dealer"},
        { time: 8.28, text:"My whole squad's in here, walking around the party"},
        { time: 10.49, text:"A cross between a zombie apocalypse and B-Bobby 'The Brain' Heenan"},
        { time: 14.7, text:"which is probably the Same reason I wrestle with mania"},
        { time: 16.93, text:"Shady's in this bitch, I'm posse'd up Consider it to cross me a costly mistake"},
        { time: 20.37, text:"If they sleepin' on me, the hoes better get insomnia"},
        { time: 23.16, text:"ADHD, Hydroxycut Pass the Courvoisier (Hey, hey)"},
        { time: 26.46, text:"In AA with an AK, melee, finna set it like a playdate"},
        { time: 29.42, text:"Better vacate, retreat like a vacay, mayday (Ayy)"},
        { time: 31.58, text:"This beat is cray-cray, Ray J, H-A-H-A-H-A"},
        { time: 34.28, text:"Laughing all the way to the bank, I spray flames They cannot tame or placate the"},

        //chorus
        { time: 37.16, text:"Monster You get in my way, I'ma feed you to the monster (Yeah)"},
        { time: 40.54, text:"I'm normal during the day, but at night, turn to a monster (Yeah)"},
        { time: 43.53, text:"When the moon shines like Ice Road Truckers"},
        { time: 46.34, text:"I look like a villain outta those blockbusters"},
        { time: 49.37, text:"Godzilla, fire spitter, monster"},
        { time: 51.45, text:"Blood on the dance floor, and on the Louis V carpet"},
        { time: 54.49, text:"Fire, Godzilla, fire, monster"},
        { time: 57.38, text:"Blood on the dance floor, and on the Louis V carpet"},

        //vers2
        { time: 59.43, text:"I'm just a product of Slick Rick and Onyx, told 'em lick the balls"},
        { time: 62.26, text:"Had 'em just appalled, did so many things that pissed 'em off"},
        { time: 64.31, text:"It's impossible to list 'em all"},
        { time: 65.97, text:"And in the midst of all this, I'm in a mental hospital with a crystal ball"},
        { time: 68.78, text:"Tryna see, will I still be like this tomorrow?"},
        { time: 70.21, text:"Risperdal, voices whisper"},
        { time: 71.37, text:"My fist is balled back up against the wall, pencil drawn"},
        { time: 73.5, text:"This is just the song to go ballistic on"},
        { time: 75.35, text:"You just pulled a pistol on the guy with a missile launcher"},
        { time: 77.54, text:"I'm just a Loch Ness, the mythological"},
        { time: 79.75, text:"Quick to tell a bitch screw off like a fifth of vodka"},
        { time: 81.87, text:"When you twist the top of the bottle, I'm a"},

        //chorus
        { time: 83.37, text:"Monster, you get in my way, I'ma feed you to the monster (yeah)"},
        { time: 86.84, text:"I'm normal durin' the day, but at night, turn to a monster (yeah)"},
        { time: 89.77, text:"When the moon shines like Ice Road Truckers"},
        { time: 92.67, text:"I look like a villain outta those blockbusters"},
        { time: 95.68, text:"Godzilla, fire spitter, monster"},
        { time: 97.73, text:"Blood on the dance floor, and on the Louis V carpet"},
        { time: 100.53, text:"Fire, Godzilla, fire, monster"},
        { time: 103.48, text:"Blood on the dance floor, and on the Louis V carpet"},

        //verse3
        { time: 105.66, text:"If you never gave a damn, raise your hand"},
        { time: 108.32, text:"'Cause I'm about to set trip, vacation plans"},
        { time: 111.27, text:"I'm on point like my index is, so all you will ever get is"},
        { time: 114.52, text:"The motherfuckin' finger (finger), prostate exam ('xam)"},
        { time: 117.36, text:"How can I have all these fans and perspire? Like a liar's pants, I'm on fire"},
        { time: 120.3, text:"And I got no plans to retire, and I'm still the man you admire"},
        { time: 123.37, text:"These chicks are spazzin' out, I only get more handsome and flyer"},
        { time: 126.13, text:"I got 'em passin' out like what you do when you hand someone flyers"},
        { time: 129.06, text:"And what goes around comes around just like the blades on the chainsaw"},
        { time: 131.76, text:"'Cause I caught the flack, but my dollars stacked right off the bat like a baseball"},
        { time: 134.62, text:"Like Kid Ink, bitch, I got 'em racks with so much ease that they call me Diddy"},
        { time: 138.19, text:"'Cause I make bands and I call gettin' cheese a cakewalk (cheesecake, yeah)"},
        { time: 141.03, text:"Bitch, I'm a player, I'm too motherfuckin' stingy for Cher"},
        { time: 143.62, text:"Won't even lend you an ear, ain't even pretendin' to care"},
        { time: 145.78, text:"But I tell a bitch I'll marry her if she'll bury her"},
        { time: 147.52, text:"Face in my genital area, the original Richard Ramirez"},
        { time: 149.83, text:"Cristhian Rivera, 'cause my lyrics never sit well, so they wanna give me the chair"},
        { time: 152.64, text:"Like a paraplegic, and it's scary, call it Hari Kari"},
        { time: 155.03, text:"'Cause e'ry Tom and Dick and Harry carry a Merriam motherfuckin' dictionary on 'em"},
        { time: 158.09, text:"Swearin' up and down they can spit, this shit's hilarious"},
        { time: 159.99, text:"It's time to put these bitches in the obituary column"},
        { time: 161.79, text:"We wouldn't see eye to eye with a starin' problem"},
        { time: 163.47, text:"Get the shaft like a steerin' column (monster)"},
        { time: 165.46, text:"Trigger-happy, pack heat, but it's black ink"},
        { time: 166.67, text:"Evil half of the Bad Meets, evil, that means take a back seat"},
        { time: 168.72, text:"Take it back to Fat Beats with a maxi single"},
        { time: 170.34, text:"Look at my rap sheet, what attracts these people"},
        { time: 171.72, text:"Is my 'Gangsta Bitch' like Apache with a catchy jingle"},
        { time: 173.77, text:"I stack chips, you barely got a half-eaten Cheeto"},
        { time: 177.28, text:"Fill 'em with the venom and eliminate 'em, other words, I Minute Maid 'em"},
        { time: 179.2, text:"I don't wanna hurt 'em, but I did, I'm in a fit of rage, I'm murderin' again, nobody will evade"},
        { time: 181.64, text:"I'm finna kill 'em and dump all their fuckin' bodies in the lake"},
        { time: 183, text:"Obliteratin' everythin', incinerate a renegade"},
        { time: 184.47, text:"I'm here to make anybody who want it with the pen afraid"},
        { time: 185.96, text:"But don't nobody want it, but they're gonna get it anyway"},
        { time: 187.37, text:"'Cause I'm beginnin' to feel like I'm mentally ill"},
        { time: 188.77, text:"I'm Attila, kill or be killed, I'm a killer bee, the vanilla gorilla"},
        { time: 190.43, text:"You bringin' the killer within me outta me"},
        { time: 191.5, text:"You don't wanna be the enemy of the demon who entered me"},
        { time: 193.13, text:"And be on the receivin' end of me, what stupidity it'd be"},
        { time: 194.7, text:"Every bit of me's the epitome of a spitter"},
        { time: 195.82, text:"When I'm in the vicinity, motherfucker, you better duck"},
        { time: 197.43, text:"Or you finna be dead the minute you run into me"},
        { time: 198.44, text:"A hunnid percent of you is a fifth of a percent of me"},
        { time: 200.04, text:"I'm 'bout to fuckin' finish you, bitch, I'm unfadable"},
        { time: 201.21, text:"You wanna battle, I'm available, I'm blowin' up like an inflatable"},
        { time: 203.06, text:"I'm undebatable, I'm unavoidable, I'm unevadable"},
        { time: 204.68, text:"I'm on the toilet bowl, I got a trailer full of money"},
        { time: 206.06, text:"And I'm paid in full, I'm not afraid to pull a-"},

        //outro
        { time: 207.39, text:"Man, stop, look what I'm plannin', haha"},
     ]
}

let currentLyrics = [];
let activeLine = -1;

// the line being sung stays at the top of the box (it used to sit in the middle)
function scrollLyricToTop(line, smooth) {
    if (!line) return;
    const top = Math.max(0, line.offsetTop - 12);
    if (smooth) lyricsBox.scrollTo({ top: top, behavior: "smooth" });
    else lyricsBox.scrollTop = top;
}
let trMode = 0;       // 0 = original words, 1 = romaji, 2 = English translation
const trBtn   = document.getElementById("tr-btn");
const trLabel = document.getElementById("tr-label");

// lines such as "(music)" show a music icon instead of words
const MUSIC_ONLY = /^\(\s*(music|intro|interlude|instrumental)\s*\)$/i;

function loadLyrics(src) {
    currentLyrics = lyricsData[src] || [];
    activeLine = -1;
    trMode = 0;                              // each new song starts with the original words
    lyricsBox.innerHTML = "";

    if (!currentLyrics.length) {
        lyricsBox.appendChild(emptyNote("No lyrics available for this song."));
        updateTranslateUI();
        return;
    }

    // 
    currentLyrics.forEach(function (line) {
        const p = document.createElement("p");
        p.className = "lyric-line";

        if (MUSIC_ONLY.test(line.text.trim())) {
            p.classList.add("music-line");
            p.innerHTML = '<i class="bi bi-music-note-beamed"></i>'; // used for the parts with no words
        } else {
            const main = document.createElement("span");   // the main line of the words
            main.className = "lyric-main";
            main.textContent = line.text;

            const sub = document.createElement("small");   // the translation under it
            sub.className = "lyric-sub";

            p.appendChild(main);
            p.appendChild(sub);
        }
        lyricsBox.appendChild(p);
    });

    applyTranslation();
}

// shows the lyrics in the chosen language mode
function applyTranslation() {
    const lines = lyricsBox.querySelectorAll(".lyric-line");

    currentLyrics.forEach(function (line, i) {
        const p = lines[i];
        if (!p || p.classList.contains("music-line")) return;
        const main = p.querySelector(".lyric-main");
        const sub  = p.querySelector(".lyric-sub");

        if (trMode === 1 && line.romaji) {          // romaji under the original words
            main.textContent = line.text;
            sub.textContent = line.romaji;
        } else if (trMode === 2 && line.en) {       // English under the original words
            main.textContent = line.text;
            sub.textContent = line.en;
        } else {                                    // original words only
            main.textContent = line.text;
            sub.textContent = "";
        }
    });
    updateTranslateUI();
}

// the translate button only appears when a translation exists
function updateTranslateUI() {
    const hasTranslation = currentLyrics.some(function (l) { return l.romaji || l.en; });
    trBtn.hidden = !hasTranslation;
    trBtn.classList.toggle("active", trMode > 0);
    trLabel.textContent = ["", "Romaji", "English"][trMode];
    trBtn.title = ["Translate lyrics", "Showing romaji (click for English)", "Showing English (click to turn off)"][trMode];
}

// each press switches: original, romaji, English, then back
trBtn.addEventListener("click", function () {
    trMode = (trMode + 1) % 3;
    applyTranslation();

    // the lines changed height, so bring the line being sung back to the top
    const line = lyricsBox.querySelectorAll(".lyric-line")[activeLine];
    if (line) scrollLyricToTop(line, false);
});

// lights up the line that is being sung right now
player.addEventListener("timeupdate", function () {
    if (!currentLyrics.length) return;

    let index = -1;
    for (let i = 0; i < currentLyrics.length; i++) {
        if (currentLyrics[i].time > player.currentTime) break;
        index = i;
    }
    if (index === activeLine) return;      // still the same line
    activeLine = index;

    const lines = lyricsBox.querySelectorAll(".lyric-line");
    lines.forEach(function (p, i) {
        p.classList.toggle("active", i === index);
    });

    // scrolls only the lyrics, not the whole sidebar
    if (index >= 0) {
        const line = lines[index];
        scrollLyricToTop(line, true);
    }
});


// Queue and Recently Played lists
const queueList = document.getElementById("queue-list");
const recentList = document.getElementById("recent-list");

let recent = [];
try { recent = JSON.parse(localStorage.getItem("rsnce-recent")) || []; } catch (e) { recent = []; }

// builds one clickable song row
function makeRow(idx, onClick) {
    const song = songlist[idx];
    const row = document.createElement("div");
    row.className = "pl-row";
    row.innerHTML = '<img alt=""><div class="pl-info"><p class="pl-title"></p><p class="pl-artist"></p></div>';
    row.querySelector("img").src = song.dataset.img;
    setMarquee(row.querySelector(".pl-title"), song.dataset.title);
    setMarquee(row.querySelector(".pl-artist"), song.dataset.artist);
    row.addEventListener("click", onClick);
    return row;
}

function emptyNote(text) {
    const p = document.createElement("p");
    p.className = "side-empty";
    p.textContent = text;
    return p;
}

// --- Remembers the 10 most recently played songs,
function addRecent(index) {
    const src = songlist[index].dataset.src; 
    recent = recent.filter(function (s) { return s !== src; }); // No duplicate songs, and the newest comes first
    recent.unshift(src);
    recent = recent.slice(0, 10); // keep only the most recent 10 songs
    try { localStorage.setItem("rsnce-recent", JSON.stringify(recent)); } catch (e) {}
}

function renderRecent() {
    recentList.innerHTML = "";
    const nowSrc = player.getAttribute("src");

    const items = recent
        .filter(function (s) {return s !== nowSrc; }) // Excludes the currently playing song from the recent list
        .map(function (s) {return indexOfSrc(s); })
        .filter(function (i) { return i >= 0; });

    if (!items.length) {
        recentList.appendChild(emptyNote("Songs you play will show up here."));
        return;
    }

    items.forEach(function (idx) {
        recentList.appendChild(makeRow(idx, function () {
            if (!queue.includes(idx)) queue = allSongsQueue(); //keep the current queue if the song is not in it
            playsong(idx);   
        }));
    });
}


// --- Queue: shows the songs that will play next, in order ---
function renderQueue() {
    queueList.innerHTML = "";

    if (!queue.length) {
        queueList.appendChild(emptyNote("Play a song to see what's next."));
        return;
    }

    if (shuffleOn) {
        queueList.appendChild(emptyNote("Shuffle is on, so next song is picked at random"));
        return;
    }
    

    const pos = queue.indexOf(currentindex);
    const upcoming = [];
    for (let k = 1; k < queue.length && upcoming.length < 8; k++) {
        upcoming.push(queue[(pos + k + queue.length) % queue.length]); // wraps around to the start
    }

    if (!upcoming.length) {
        queueList.appendChild(emptyNote("This is the only song in the queue."));
        return; // it is the only song in the queue
    }

    if (pos === queue.length - 1) {
        queueList.appendChild(emptyNote(repeatMode === 1
            ? "End of the queue. It starts over from the beginning."
            : "That's the last song in the queue.")); // it is the last song
        return;
    }

    upcoming.forEach(function (idx) {
        queueList.appendChild(makeRow(idx, function () { playsong(idx); })); // the queue stays the same 
    });
}

// puts the title in a box and checks whether it is too wide to fit
// Scrolling titles for names that are too long for their box
function setMarquee(el, text) {
    el.textContent = "";
    const span = document.createElement("span");
    span.className = "marquee";
    span.textContent = text;
    el.appendChild(span);
    requestAnimationFrame(function () { checkMarquee(span); }); // wait until it is on the page
}

function checkMarquee(span) {
    const box = span.closest("p");
    if (!box) return;                     // the title was replaced before this ran
    span.classList.remove("scrolling");
    box.classList.remove("marquee-box");
    if (!box.clientWidth) return;

    const overflow = span.offsetWidth - box.clientWidth;
    if (overflow > 1) {
        span.style.setProperty("--shift", -(overflow + 12) + "px");
        span.style.setProperty("--dur", (overflow / 30 + 3) + "s");
        span.classList.add("scrolling");
        box.classList.add("marquee-box");
    }
}

function refreshMarquees() {
    document.querySelectorAll(".marquee").forEach(checkMarquee);
}

window.addEventListener("resize", refreshMarquees);

// Music video in the right sidebar
const npVideo = document.getElementById("np-video");
const npImg = document.getElementById("np-img");
const mvToggle = document.getElementById("mv-toggle");
let showVideo = false;                       // true while the video is showing

function setVideoMode(on) {
    showVideo = on;
    npVideo.hidden = !on;
    npImg.hidden = on;
    mvToggle.innerHTML = on ? '<i class="bi bi-image-fill"></i>' : '<i class="bi bi-camera-video-fill"></i>';
    const label = on ? "Show cover image" : "Show music video";
    mvToggle.title = label;
    mvToggle.setAttribute("aria-label", label);
    if (on) syncVideo(true); else npVideo.pause();
}

// loads the song's video, or hides the video button if it has none
function loadVideo(src) {
    if (!src) {
        npVideo.pause();
        npVideo.removeAttribute("src");
        npVideo.load();
        mvToggle.hidden = true;
        setVideoMode(false);
        return;
    }
    npVideo.src = src;
    mvToggle.hidden = false;
    setVideoMode(showVideo);                 // keeps video mode if you were already watching
}

// the music is the clock, so the video follows it
function syncVideo(force) {
    if (!showVideo || !npVideo.getAttribute("src")) return;
    if (force || Math.abs(npVideo.currentTime - player.currentTime) > 0.3) {
        npVideo.currentTime = player.currentTime;
    }
    if (player.paused) {
        if (!npVideo.paused) npVideo.pause();
    } else if (npVideo.paused) {
        npVideo.play().catch(function () {});
    }
}

mvToggle.addEventListener("click", function () { setVideoMode(!showVideo); });
player.addEventListener("play", function () { syncVideo(true); });
player.addEventListener("pause", function () { syncVideo(false); });
player.addEventListener("seeked", function () { syncVideo(true); });
player.addEventListener("timeupdate", function () { syncVideo(false); });

// |=-=-=-=-=-=-=-=-=-=-= FOOTER / PLAYER =-=-=-=-=-=-=-=-=-=-=-=-=-=-|
// (The bottom bar: play and pause, next and previous, shuffle and repeat,
// progress bar, volume, the full-screen view and the ads.)

// Play and pause
playBtn.addEventListener("click", function () {
    if (adPlaying) return;
    if (!player.src) return;                 // no song is loaded yet
    if (player.paused) {
        player.play();
        playBtn.textContent = "⏸";
    } else {
        player.pause();
        playBtn.textContent = "▶";
    }
});

// when a song starts, the right sidebar opens
player.addEventListener("play", function () {
    if (songStopped) {
        songStopped = false;
        setSidebar(true);
    }
});


// Next song button
document.getElementById("next-btn").addEventListener("click", function () {
    if (!songlist.length) return;
    if (!queue.length) queue = allSongsQueue();
    playsong(nextIndex());
});

// Previous song button
document.getElementById("prev-btn").addEventListener("click", function () {
    if (!songlist.length) return;
    if (!queue.length) queue = allSongsQueue();
    playsong(previousIndex());
});

// Shuffle and repeat
const shuffleBtn = document.getElementById("shuffle-btn");
const repeatBtn = document.getElementById("repeat-btn");
let shuffleOn = false;
let repeatMode = 0;                          // 0 = off, 1 = repeat all, 2 = repeat one

shuffleBtn.addEventListener("click", function () { setShuffle(!shuffleOn); });
repeatBtn.addEventListener("click", function () { setRepeat((repeatMode + 1) % 3); });

// used by both the player buttons and the Settings page
function setShuffle(on) {
    shuffleOn = on;
    shuffleBtn.classList.toggle("active", on);
    document.getElementById("set-shuffle").checked = on;
    renderQueue(); // updates the Queue list
}

function setRepeat(mode) {
    repeatMode = mode;
    repeatBtn.classList.toggle("active", mode > 0);
    repeatBtn.innerHTML = mode === 2
        ? '<i class="bi bi-repeat-1"></i>'
        : '<i class="bi bi-repeat"></i>';
    document.getElementById("set-repeat").value = String(mode);
    renderQueue();
}

// what happens when a song ends
player.addEventListener("ended", function () {
    if (repeatMode === 2) { playsong(currentindex); return; }

    if (!settings.autoplay) {                 // Autoplay switched off in Settings
        playBtn.textContent = "▶";
        songStopped = true;
        setSidebar(false);
        return;
    }

    const isLast = queue.indexOf(currentindex) === queue.length - 1;
    if (queue.length && !(isLast && repeatMode === 0 && !shuffleOn)) {
        playsong(nextIndex());
    } else {
        playBtn.textContent = "▶";           // the songs are finished
        songStopped = true;                  
        setSidebar(false); 
    }
});

// Progress bar and time labels
const seekBar = document.getElementById("seek-bar");
const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");

function formatTime(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
}

player.addEventListener("loadedmetadata", function () {
    totalTimeEl.textContent = formatTime(player.duration);
});

player.addEventListener("timeupdate", function () {
    if (!player.duration) return;
    const pct = (player.currentTime / player.duration) * 100;
    seekBar.value = pct;
    seekBar.style.setProperty("--progress", pct + "%");
    currentTimeEl.textContent = formatTime(player.currentTime);
});

// dragging the bar jumps to that part of the song
seekBar.addEventListener("input", function () {
    if (!player.duration || adPlaying) return;
    player.currentTime = (seekBar.value / 100) * player.duration;
});


const volumeBar = document.getElementById("volume-bar");
const muteBtn = document.getElementById("mute-btn");
let lastVolume = 1;                          // remembered so unmute can bring it back

function updateVolumeUI() {
    const level = player.muted ? 0 : player.volume;
    volumeBar.value = level;
    volumeBar.style.setProperty("--volume", (level * 100) + "%");

    let icon = "bi-volume-up-fill";
    if (level === 0) icon = "bi-volume-mute-fill";
    else if (level < 0.5) icon = "bi-volume-down-fill";
    muteBtn.innerHTML = '<i class="bi ' + icon + '"></i>';
}

volumeBar.addEventListener("input", function () {
    player.volume = Number(volumeBar.value);
    player.muted = player.volume === 0;
    if (player.volume > 0) lastVolume = player.volume;
});

muteBtn.addEventListener("click", function () {
    if (player.muted || player.volume === 0) {
        player.muted = false;
        player.volume = lastVolume;
    } else {
        lastVolume = player.volume;
        player.muted = true;
    }
});

player.addEventListener("volumechange", updateVolumeUI);
updateVolumeUI();


const fullPlayer   = document.getElementById("full-player");
const footerPlayer = document.querySelector("footer.player");
const fsClose      = document.getElementById("fs-close");

// the parts that move into the full-screen view
// (they are the same parts, so everything keeps working)
const fsParts = [
    { el: document.querySelector(".np-media"),      slot: document.getElementById("fs-media")    }, // image / video
    { el: document.getElementById("ad-box"),        slot: document.getElementById("fs-media")    }, // adverts
    { el: document.getElementById("lyrics-box"),    slot: document.getElementById("fs-lyrics")   }, // lyrics
    { el: document.querySelector(".controls"),      slot: document.getElementById("fs-controls") }, // buttons + progress bar
    { el: document.getElementById("tr-btn"),     slot: document.getElementById("fs-lyrics")   } // translate button
];

// remembers where each part came from so it can be put back
fsParts.forEach(function (p) {
    p.home = p.el.parentNode;
    p.next = p.el.nextSibling;
});

function openFullPlayer() {
    fsParts.forEach(function (p) { p.slot.appendChild(p.el); });   // moves the parts in
    fullPlayer.classList.add("open");
    fullPlayer.scrollTop = 0; 
    fullPlayer.setAttribute("aria-hidden", "false");

    syncVideo(true);   // moving a video pauses it, so this starts it again with the music

    // scrolls the lyrics to the line being sung now
    requestAnimationFrame(function () {
        const line = lyricsBox.querySelectorAll(".lyric-line")[activeLine];
        if (line) scrollLyricToTop(line, false);
    });
    fsClose.focus();
}

function closeFullPlayer() {
    fullPlayer.classList.remove("open");
    fullPlayer.setAttribute("aria-hidden", "true");
    fsParts.forEach(function (p) { p.home.insertBefore(p.el, p.next); });   // puts the parts back
    syncVideo(true);
    requestAnimationFrame(refreshMarquees);
}

// one click on the footer opens the full-screen view (buttons and sliders still work as usual)
footerPlayer.addEventListener("click", function (e) {
    if (e.target.closest("button, input, a")) return;
    openFullPlayer();
});

fsClose.addEventListener("click", closeFullPlayer);

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && fullPlayer.classList.contains("open")) closeFullPlayer();
});

const AD_EVERY   = 2;      // how many songs play before an ad
const SKIP_AFTER = 5;      // seconds before the skip button works (Student plan)

//----ADVERTISEMENT -----
const AD_DEFAULT_LOGO = "Resonance.Logo.png";   // used when an ad has no logo

// video file, name and logo (the logo is optional)
const adVideos = [
    { src: "Advert_1.mp4", name: "https://www.coca-cola.com",  logo: "Logo_Ads1.png"},                          
    { src: "Advert_2.mp4", name: "Resonance Premium", logo: "Resonance.Logo.png" },
    { src: "Advert_3.mp4", name: "https://www.order.burgerking.com", logo: "Logo_Ads4.png" },
    { src: "Advert_4.mp4", name: "Resonance Premium", logo: "Resonance.Logo.png" },
    { src: "Advert_5.mp4", name: "https://www.gyunyu.com", logo: "Logo_Ads5.jpeg" },
    { src: "Advert_6.mp4", name: "Biolink VCO Hot oil and Shampoo", logo: "Logo_Ads6.jpg" },
    { src: "Advert_7.mp4", name: "https://www.snickers.com", logo: "Logo_Ads7.png" },
    { src: "Advert_8.mp4", name: "https://www.doritos.com", logo: "Logo_Ads8.jpeg" },
    { src: "Advert_9.mp4", name: "Cotton Balls", logo: "Logo_Ads3.jpeg" },
    { src: "Advert_10.mp4", name: "https://www.5gum.com", logo: "Logo_Ads10.png" },
    { src: "Advert_11.mp4", name: "https://naturespring.com", logo: "Logo_Ads11.png" }
];

const adBox        = document.getElementById("ad-box");
const adVideo      = document.getElementById("ad-video");
const adSkip       = document.getElementById("ad-skip");
const rightSidebar = document.querySelector(".right-sidebar");

let songsSinceAd = 0;      // songs played since the last ad
let adIndex = 0;           // which ad plays next (they take turns)
let adPlaying = false;
let afterAd = null;        // what to do after the ad (start the waiting song)
let adOpenedFullScreen = false;

const playerImg = document.getElementById("player-img");

// the footer shows the ad's name and logo
function showAdInFooter(ad) {
    playerImg.onerror = function () {              // if the logo is missing, use the default one
        playerImg.onerror = null;
        playerImg.src = AD_DEFAULT_LOGO;
    };
    playerImg.src = ad.logo || AD_DEFAULT_LOGO;
    pop(playerImg);
    setMarquee(document.getElementById("player-title"), "Advertisement");
    setMarquee(document.getElementById("player-artist"), ad.name || "");

    document.getElementById("fs-title").textContent  = "Advertisement";   
    document.getElementById("fs-artist").textContent = ad.name || "";
}

// Free and Student plans see ads, Premium never does
// phones skip this because the right sidebar is hidden there
function adsEnabled() {
    return (currentPlan === "free" || currentPlan === "student")
        && adVideos.length > 0;
}


function playAd(done) {
    adPlaying = true;
    afterAd = done;

    player.pause();                                // stops the music
    playBtn.textContent = "▶";

    songStopped = false;
    setSidebar(true);                              // on desktop the right sidebar opens and stays open
    rightSidebar.classList.add("ad-active");
    fullPlayer.classList.add("ad-active");         // the full-screen view shows the ad instead of the cover
    adBox.hidden = false;
    fullPlayer.classList.remove("has-song-theme");   // ads will use the normal background
    fullPlayer.classList.remove("song-color");

    const ad = adVideos[adIndex];
    adIndex = (adIndex + 1) % adVideos.length;
    adVideo.src = ad.src;
    showAdInFooter(ad);
    loadLyrics(null);                              // no lyrics while the ad plays

    // on tablets and phones the ad opens in full screen
    if (tablet.matches && !fullPlayer.classList.contains("open")) {
        adOpenedFullScreen = true;
        openFullPlayer();
    }

    adVideo.volume = player.volume;
    adVideo.muted = player.muted;
    adVideo.play().catch(endAd);                   // if the browser blocks it, carry on

    updateAdSkip();
}

function endAd() {
    if (!adPlaying) return;
    adPlaying = false;
    playerImg.onerror = null;

    adVideo.pause();
    adVideo.removeAttribute("src");
    adVideo.load();                                // lets go of the video file
    adBox.hidden = true;
    adSkip.hidden = true;
    rightSidebar.classList.remove("ad-active");
    fullPlayer.classList.remove("ad-active");

    if (adOpenedFullScreen) {                      // closes the full screen the ad opened
        adOpenedFullScreen = false;
        closeFullPlayer();
    }

    const next = afterAd;
    afterAd = null;
    if (next) next();                              // now plays the waiting song
}

// Free plan: no skip button. Student plan: skip after a few seconds.
function updateAdSkip() {
    if (!adPlaying) return;
    if (currentPlan !== "student") { adSkip.hidden = true; return; }

    adSkip.hidden = false;
    const wait = Math.ceil(SKIP_AFTER - adVideo.currentTime);
    adSkip.disabled = wait > 0;
    adSkip.textContent = wait > 0 ? "Skip in " + wait + "s" : "Skip ad";
}

adVideo.addEventListener("timeupdate", updateAdSkip);
adVideo.addEventListener("ended", endAd);
adVideo.addEventListener("error", endAd);          // if the file is broken, carry on

// if the ad gets paused (for example by moving to full screen), play it again
adVideo.addEventListener("pause", function () {
    if (adPlaying && !adVideo.ended) adVideo.play().catch(function () {});
});

adSkip.addEventListener("click", function () {
    if (currentPlan === "student" && !adSkip.disabled) endAd();
});

// the ad uses the same volume and mute as the music
player.addEventListener("volumechange", function () {
    adVideo.volume = player.volume;
    adVideo.muted = player.muted;
});

// |=-=-=-=-=-=-=-=-=-=-=-= SETTINGS PAGE =-=-=-=-=-=-=-=-=-=-=-=-=|
const LYRIC_SCALES = { sm: 0.82, md: 1, lg: 1.24 };
const PLAN_NAMES = { free: "Resonance Free", student: "Sentinel (Student)", premium: "Arbiter+" };

// puts every control on the page in step with what is saved
function applySettings() {
    document.body.classList.toggle("reduce-motion", !settings.motion);
    document.documentElement.style.setProperty("--lyric-scale", LYRIC_SCALES[settings.lyricSize] || 1);

    document.getElementById("set-motion").checked = settings.motion;
    document.getElementById("set-colorsync").checked = settings.colorsync;
    document.getElementById("set-autoplay").checked = settings.autoplay;
    document.getElementById("set-lyricsize").value = settings.lyricSize;

    const arbiter = currentPlan === "premium";
    const themeToggle = document.getElementById("set-themebg");
    themeToggle.checked = settings.themebg && arbiter;
    themeToggle.disabled = !arbiter;
    themeToggle.closest(".set-row").classList.toggle("set-locked", !arbiter);
    document.getElementById("set-themebg-desc").textContent = arbiter
        ? "Full-screen artwork behind the player. Tablet and desktop only."
        : "Included with Arbiter+. Tablet and desktop only.";

    document.getElementById("set-shuffle").checked = shuffleOn;
    document.getElementById("set-repeat").value = String(repeatMode);
    document.getElementById("set-plan-desc").textContent =
        "You are currently on the " + (PLAN_NAMES[currentPlan] || PLAN_NAMES.free) + " plan.";
}

// ---- the Home page theme previews are locked below Arbiter+ ----
const themesGrid = document.querySelector(".themes");
const themesLock = document.getElementById("themes-lock");
const themesNote = document.getElementById("themes-note");

function updateThemeGate() {
    if (!themesGrid) return;
    const locked = currentPlan !== "premium";
    themesGrid.classList.toggle("locked", locked);
    themesLock.hidden = !locked;
    themesNote.textContent = locked
        ? "Arbiter+ members can use themes on tablet and desktop."
        : "Themes are unlocked for your Arbiter+ account on tablet and desktop.";
}

if (themesGrid) {
    document.getElementById("themes-lock-btn").addEventListener("click", function () {
        showView("premium");
        history.replaceState(null, "", "#premium");
    });
    themesGrid.querySelectorAll(".theme").forEach(function (card) {
        card.addEventListener("click", function () {
            if (currentPlan !== "premium") showView("premium");
        });
    });
}

// the gear in the top bar opens this page
document.getElementById("settings-btn").addEventListener("click", function () {
    showView("settings");
    history.replaceState(null, "", "#settings");
});

// one switch, saved as soon as it changes
function bindToggle(id, key, after) {
    const el = document.getElementById(id);
    el.addEventListener("change", function () {
        settings[key] = el.checked;
        saveSettings();
        applySettings();
        if (after) after();
    });
}

bindToggle("set-motion", "motion");
bindToggle("set-colorsync", "colorsync", refreshTheme);
bindToggle("set-themebg", "themebg", refreshTheme);
bindToggle("set-autoplay", "autoplay");

document.getElementById("set-lyricsize").addEventListener("change", function () {
    settings.lyricSize = this.value;
    saveSettings();
    applySettings();
});

document.getElementById("set-shuffle").addEventListener("change", function () { setShuffle(this.checked); });
document.getElementById("set-repeat").addEventListener("change", function () { setRepeat(Number(this.value)); });

document.getElementById("set-plan-btn").addEventListener("click", function () {
    showView("premium");
    history.replaceState(null, "", "#premium");
});

// themes are desktop/tablet only, so re-check when the screen size changes
[phone, tablet].forEach(function (mq) { mq.addEventListener("change", refreshTheme); });


// ---------- START THE APP ----------
// Runs once at the end, after everything above is ready.
renderQueue();
renderRecent();
loadLyrics(null);     // shows the no-lyrics message before any song plays
applySettings();      // restores the saved settings
updateThemeGate();    // locks or unlocks the theme previews

// ||=================== MOST IMPORTANT FUNCTIONS ===========================||
// These functions are kept at the very bottom on purpose:
// they choose which song plays and actually start it.
function allSongsQueue() {
    return songlist.map(function (_, n) { return n; });
}

function pop(el) {
    el.classList.remove("pop");
    void el.offsetWidth;          // restarts the pop animation
    el.classList.add("pop");
}

// ---------- SONG THEMES (full-screen player background) ----------
// (capital letters matter when you upload to GitHub Pages).
const songThemes = {
    "nightdancer.mp3": "Song-theme_NightDancer.png",
    "AllForOne.mp3":   "Song-theme_AllForOne.jpg",
    "GodZilla.mp3":     "Song-theme_Godzilla.png",
    "fallenPetals.mp3": "Song-theme_FallenPetals.png",
    "Overdose.mp3":  "Song-theme_Overdose.png",
    "Bling-Bang-Bang-Born.mp3": "Song-theme_BlingBangBangBorn.png",
    "Show-Ado.mp3": "Song-theme_Show.Ado.png",
    "Human.mp3":  "Song-theme_Human.png",
    "SUPERNOVA.mp3": "Song-theme_Supernova.png",
    "IreallyWantToStayAtYourHouse.mp3": "Song-theme_Cyberpunk.png",
    "BangBangBang.mp3": "Song-theme_BangBangBang.webp",
    "BiiG.mp3": "Song-theme_BiiG.webp",
    "GoldTriumph.mp3": "Song-theme_GoldTriumph.png",
    "ImThinkingMiku.mp3": "Song-theme_Miku.png",
    "Inferno-FireForce.mp3": "Song-theme_Inferno.png",
    "LegendCharger.mp3": "Song-theme_LegendChanger.png",
    "MagicalCureLoveShot!.mp3": "Song-theme_MagicalCureLoveShot.png",
    "RacingIntoTheNight.mp3": "Song-theme_RacingIntoTheNight.png",
    "UmapyoiLegend.mp3": "Song-theme_UmapyoiLegend.png",
    "UnfinishedJourney.mp3": "Song-theme_UnfinishedJourney.png",
    "TeamTomodachiCover.mp3": "Song-theme_TeamTomodachi.png",
    
};

let currentCard = null;      // the song that is playing right now
const colorCache = {};       // song picture -> main colour, so it is only read once

// Themes are an Arbiter+ feature and only exist on tablet and desktop.
function themesOn() {
    return currentPlan === "premium" && settings.themebg && !phone.matches;
}

// Matching the background to the artwork is free, but also tablet/desktop only.
function colorsOn() {
    return settings.colorsync && !phone.matches;
}

// used when the plan, a setting or the screen size changes
function refreshTheme() {
    if (currentCard) applySongTheme(currentCard);
}

// reads the main colour of a song picture with a tiny canvas
function extractColor(src, done) {
    const img = new Image();
    img.onload = function () {
        try {
            const c = document.createElement("canvas");
            c.width = c.height = 24;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, 24, 24);
            const d = ctx.getImageData(0, 0, 24, 24).data;
            let r = 0, g = 0, b = 0, n = 0;

            for (let i = 0; i < d.length; i += 4) {
                if (d[i + 3] < 128) continue;
                const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
                if (lum < 22 || lum > 238) continue;      // ignore near-black and near-white pixels
                r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
            }

            if (n) { r /= n; g /= n; b /= n; } else { r = g = b = 32; }

            // keep the tint dark enough for the white lyrics and titles to stay readable
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            if (lum > 105) {
                const k = 105 / lum;
                r *= k; g *= k; b *= k;
            }

            done("rgb(" + Math.round(r) + ", " + Math.round(g) + ", " + Math.round(b) + ")");
        } catch (e) {
            done("rgb(10, 16, 32)");                 // canvas blocked (no local server)
        }
    };
    img.onerror = function () { done("rgb(10, 16, 32)"); };
    img.src = src;
}

// tints the full-screen player when there is no theme picture to show
function applySongColor(card) {
    const themed = themesOn() && songThemes[card.dataset.src];
    if (!colorsOn() || themed) {
        fullPlayer.classList.remove("song-color");
        return;
    }

    const key = card.dataset.img;
    if (colorCache[key]) {
        fullPlayer.style.setProperty("--fs-color", colorCache[key]);
        fullPlayer.classList.add("song-color");
        return;
    }

    fullPlayer.classList.remove("song-color");       // no stale tint while the colour is read
    extractColor(key, function (color) {
        colorCache[key] = color;
        if (currentCard !== card) return;             // the song changed meanwhile
        fullPlayer.style.setProperty("--fs-color", color);
        fullPlayer.classList.add("song-color");
    });
}

// Gives the full-screen player the picture of the song that just started.
function applySongTheme(card) {
    currentCard = card;
    const picture = themesOn() ? songThemes[card.dataset.src] : null;   // empty when the song has no theme

    if (!picture) {
        // No theme for this song -> remove ours, the colour background takes over
        fullPlayer.classList.remove("has-song-theme");
        fullPlayer.style.removeProperty("--fs-theme");
    } else {
        // Has a theme -> hand the picture to the CSS, then switch the rule on
        fullPlayer.style.setProperty("--fs-theme", 'url("' + picture + '")');
        fullPlayer.classList.add("has-song-theme");
    }

    applySongColor(card);
}


function startSong(index) {
    currentindex = index;
    const card = songlist[index];

    player.src = card.dataset.src;
    player.play();
    playBtn.textContent = "⏸";

    // the footer
    setMarquee(document.getElementById("player-title"), card.dataset.title);
    setMarquee(document.getElementById("player-artist"), "By " + card.dataset.artist);
    document.getElementById("player-img").src = card.dataset.img;
    pop(document.getElementById("player-img"));

    // the right sidebar
    setMarquee(document.getElementById("np-title"), card.dataset.title);
    setMarquee(document.getElementById("np-artist"), card.dataset.artist);
    document.getElementById("np-img").src = card.dataset.img;
    pop(document.getElementById("np-img")); 

    // the full-screen view
    document.getElementById("fs-title").textContent = card.dataset.title;
    document.getElementById("fs-artist").textContent = card.dataset.artist;
    applySongTheme(card);   // swap the full-screen background for this song

    addRecent(index);
    renderQueue(); // updates the Queue list
    renderRecent(); // updates the Recently Played list
    loadLyrics(card.dataset.src); // shows the lyrics
    loadVideo(card.dataset.video); // shows the video if the song has one
    
}   

// picks the next song: random if shuffle is on, otherwise in order
function nextIndex() {
    if (shuffleOn && queue.length > 1) {
        let r;
        do { r = queue[Math.floor(Math.random() * queue.length)]; } while (r === currentindex);
        return r;
    }
    const pos = queue.indexOf(currentindex);
    return queue[(pos + 1) % queue.length];
}

function previousIndex() {
    const pos = queue.indexOf(currentindex);
    if (pos < 0) return queue[0];
    return queue[(pos - 1 + queue.length) % queue.length];
}

// every song starts here, and sometimes an ad plays first
function playsong(index) {
    if (adPlaying) return;                         // ignore clicks while an ad is playing

    if (adsEnabled() && songsSinceAd >= AD_EVERY) {
        playAd(function () {
            songsSinceAd = 1;                      // the waiting song counts as the first one
            startSong(index);
        });
        return;
    }
    songsSinceAd++;
    startSong(index);
}

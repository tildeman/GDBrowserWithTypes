# GDBrowser with types

![Repo size](https://img.shields.io/github/repo-size/tildeman/GDBrowserWithTypes)

Originally intended as a small side project while working on [binalyi](https://github.com/tildeman/binalyi), it quickly became an attempt of me tidying up code. While the end result is far from perfect (god, those templates are awful), they are much better categorized.

## How do I run this?
If you're just here to use GDBrowser locally because the site is down or outdated or blocked or restricted or god knows what, this is the only part you really need to read


To run GDBrowser locally:
1) Install [node.js](https://nodejs.org/en/download/) if you don't already have it
2) Clone/download this repository
3) Open cmd/powershell/terminal in the main folder (with `package.json`)
4) Type `npm i` to flood your hard drive with code that's 99% useless
5) Type `npm run buildDeps` to flood your hard drive even more with a bundled glob
6) Type `npm run build` to transpile all the code into something node.js can actually understand
7) Type `npm run dev` to run the web server
8) GDBrowser is now running locally at http://localhost:2000

If you want to disable rate limits, ip forwarding, etc. you can do so by modifying `settings.js`. Doing this is probably a good idea if you feel like obliterating Rob's servers for some reason. (please don't)

## Using this for a GDPS?

I mean, sure. Why not.

As this is nothing more than a side project, yes, you can add your own server into your own magical little fork by adding it to **servers.json**. Simply add a new object to the array with the following information:

| Identifier       | Description                                                                                                                |
|------------------|----------------------------------------------------------------------------------------------------------------------------|
| `name`           | The display name of the server                                                                                             |
| `link`           | The server's website URL (unrelated to the actual endpoint)                                                                |
| `author`         | The creator(s) of the server                                                                                               |
| `authorLink`     | The URL to open when clicking on the creator's name                                                                        |
| `id`             | An ID for the server, also used as the subdomain (e.g. `something` would become `something.gdbrowser.com`)                 |
| `endpoint`       | The actual endpoint to ~~spam~~ send requests to (e.g. `http://boomlings.com/database/` - make sure it ends with a slash!) |


There's also a few optional values for fine-tuning. I'll add more over time

| Identifier          | Description                                                                                                                                | Type                     |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|
| `timestampSuffix`   | A string to append at the end of timestamps. Vanilla GD uses " ago"                                                                        | `string`                 |
| `demonList`         | The URL of the server's Demon List API, if it has one (e.g. `http://pointercrate.com/` - make sure it ends with a slash!)                  | `string`                 |
| `disabled`          | An array of menu buttons to "disable" (mappacks, gauntlets, daily, weekly, etc). They appear greyed out but are still clickable.           | `string[]`               |
| `pinned`            | "Pins" the server to the top of the GDPS list. It appears above all unpinned servers and is not placed in alphabetical order.              | `boolean`                |
| `onePointNine`      | Makes a bunch of fancy changes to better fit 1.9 servers. (removes orbs/diamonds, hides some pointless buttons, etc)                       | `boolean`                |
| `weeklyLeaderboard` | Enables the lost but not forgotten Weekly Leaderboard, for servers that still milk it                                                      | `boolean`                |
| `substitutions`     | A list of parameter substitutions, because some servers rename/obfuscate them. (e.g. `{ "levelID": "oiuyhxp4w9I" }`)                       | `Record<string, string>` |
| `overrides`         | A list of endpoint substitutions, because some servers use renamed or older versions. (e.g. `{ "getGJLevels21": "dorabaeChooseLevel42" }`) | `Record<string, string>` |

If you're looking to add your own GDPS to the official GDBrowser website, fill out [this quick form](https://forms.gle/kncuRqyKykQX42QD7) and hope that Colon will add it. Make sure that your server is relatively large and active if you want it included.

## Folders

GDBrowser has a lot of folders. [you don't need citation it's obvious through `/src`]

For this random side project, I intend to break all the rules of categorization and just go for what works the best. In the end I have more folders than I really need to, but I hope that the resulting code is more readable.

Most folders contain exactly what you'd expect, but here's some in-depth info in case you're in the dark.

### API

This is where all the backend stuff happens! Yipee!

If you've studied web applications before, this is a list of controllers.

They're all fairly similar. Fetch something, parse the response, and serve it in a crisp and non-intimidating JSON. This is probably what you came for.

### Assets (in `/static`)

Assets! Assets everywhere!

All the GD stuff was ripped straight from the GD spritesheets via [Absolute's texture splitter hack](https://youtu.be/pYQgIyNhow8). If you want a nice categorized version, [I've done all the dirty work for you.](https://www.mediafire.com/file/4d99bw1zhwcl507/textures.zip/file)

I'd explain what's in all the subfolders but it's pretty obvious. I tried my best to organize everything nicely.

### Classes

What's a class you ask? Good question.

I guess the best way to put it is uh... **representations** of stuff???

`Level.ts` and `Player.ts` parse the server's disgusting response and sends back a nice object with all the relevant info.

`UserCache.ts` handles caching and in-memory storage for common requests.

### Lib

This is where most of the plain server-side utility functions are. Some of them are combined into groups with a namespace.

`xor.ts` used to be a class, but it didn't serve concepts that are suitable for a full class. I moved it to a namespace in `/lib` as a result.

### Middleware

If you're unfamiliar with middleware, they are helper functions for use in other middleware or controllers in `/api`.

`handleTimeouts.ts` does what you'd expect, handle the case when the response is timed out.

`packageValues.ts` wraps useful functions and properties into one, digestible bundle for most API requests.

I didn't plan to add this folder, but I don't want `index.ts` to be cluttered, either.

### Misc

Inevitable misc folder

When you're working on a project the size and scale of GDBrowser, there has to be several one-off fragments that aren't enough on their own but don't go well with other files. Mostly JSON files and some modules and scripts.

**Level Analysis Stuff (in `/analysis`)**

| Name                     | Description                                                                                                                                                          |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `blocks.json`            | The object IDs in the different 'families' of blocks                                                                                                                 |
| `colorProperties.json`   | Color channel cheatsheet                                                                                                                                             |
| `initialProperties.json` | Level settings cheatsheet                                                                                                                                            |
| `objectProperties.json`  | Object property cheatsheet. Low budget version of [AlFas' one](https://github.com/AlFasGD/GDAPI/blob/master/GDAPI/GDAPI/Enumerations/GeometryDash/ObjectProperty.cs) |
| `objects.json`           | IDs for portals, orbs, triggers, and misc stuff                                                                                                                      |

**Everything Else**

| Name                    | Description                                                                                                           |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `achievements.json`     | List of all GD/meltdown/subzero/etc achievements. `parseAchievementPlist.ts` automatically creates this file          |
| `achievementTypes.json` | An object containing different categories of achievements (stars, shards, vault, etc) and how to identify them        |
| `credits.json`          | Credits! (shown on the homepage)                                                                                      |
| `dragscroll.ts`         | Used on several pages for drag scrolling                                                                              |
| `global.ts`             | Excecuted on most pages. Used for the 'page isn't wide enough' message, back button, icons, and a few other things    |
| `music.json`            | An array of the official GD tracks (name, artist)                                                                     |
| `sampleIcons.json`      | A pool of icons, one of which will randomly appear when visiting the icon kit. Syntax is [Name, ID, Col1, Col2, Glow] |
| `secretStuff.json`      | GJP goes here, needed for level leaderboards. A sample is included for convenience.                                   |

### Scripts

These are a collection of modules for use on individual webpages. `comments.ts` loads comments for the commments page. `filters.ts` remembers your filters the next time you search on GDBrowser. I separated these from the respective HTML for two reasons:

1) Type-checking code works better when the files are detached from HTML.
2) These files are imported as ES6 modules, and they are designed not to pollute the global namespace. Keeping them detached makes usage of imports and exports much more convenient.

### Routes

When you go on a link, the web server has to know what you're looking for. It does this by checking the URI of the webpage, and then looking for what you expect should show up on that page. For example, if you're looking for levels, you go to the right page (`/search`), and the routing does all of that for you.

The original repository didn't have this folder; the routes were all packaged in `index.ts` and added the `app` parameter to controllers for some app-wide routines. This hurted code coupling.

This does seem a lot like ravioli code, but it may aid in readability.

### Templates

This is the "views" part in the MVC model if you're familiar with that. I will call them templates to help make it easier to understand.

These are the "new" templates that are made to replace the contents in `/html`, notably those about levels and profiles.

The original version of GDBrowser uses raw HTML files for webpages. While the resulting code does work (kinda), it is very prone to errors and bugs that may affect quality of usage. Some of their limitations are:
- Most of these HTML files did not include a `<!DOCTYPE html>`, which meant browsers interpreted those pages in a special mode called "Quirks mode". This was how webpages were displayed back in ancient browsers (Netscape Navigator 4 & Internet Explorer 5, as some examples). When these pages are displayed under "No-quirks mode" (or "Standards mode", as this is how browsers display standards-compliant HTML5/CSS3), some of the HTML/CSS properties (like `height`) work differently, breaking the page.
- They didn't conform to the HTML standard. Images still used the `height` property incorrectly, and `<script>` tags included the unnecessary `type` attribute `text/javascript` for non-ES scripts.
- Some of them could not retrieve values on their own and require server-side processing. This meant taking the raw HTML, filling out all of the placeholder values, and then putting it on display. This resulted in awful glitches when those properties are nonexistent (See the info tab in [GDBrowser's page on Project J](https://gdbrowser.com/1908735)).

These templates (written in [Pug](https://pugjs.org)) are designed to address those limitations by doing the following:
- Conform as much as possible to the HTML standards and Pug styling guidelines.
- Use conditions and mix-ins that replace the preprocessing functions that manually replace placeholder values server-side. Instead of embedding unknown stuff into HTML files and hope it doesn't break, the preprocessing is now handled entirely by the template engine.

### Types

Last but not least, the type declarations for common GDBrowser features. (icons, leaderboards - even level analysis results!)

As a JS/TS developer, sometimes you want some sort of pattern for the infinite amount of possible structures objects can take; TypeScript implements those features by allowing you to write your own object structures and type-check your code with them during development. This has a few benefits:

1) You spend less time debugging for runtime errors.
2) You can avoid having to define whole classes for simple data structures.
3) These type declarations are stripped from the output, so you don't have to worry about the extra code footprint.

## RAQ (Rarely Asked Questions)

**Q**: What on Earth is GDBrowser?

**A**: Basically a website to browse some of Geometry Dash's online features. It's incorrect to say that it can browse "all features" (as written in the description of the original repository), as things might change significantly in update 2.2.



**Q**: Why don't you write normal `.js` files? Why `.ts`?

**A**: TypeScript (and IntelliSense) work much better on `.ts` files. They may aid in catching errors early in development (also that's the whole point of this repository).



**Q**: Some of the buttons/icons/UI elements don't match up with the original GDBrowser.

**A**: This is a side effect of how browsers handle webpages. Since the original GDBrowser templates were written without a `<!DOCTYPE html>`, this causes the browser to implement quirks that affect webpage rendering. While transitioning the templates to HTML5, I had to sacrifice some of the formatting details; this resulted in bugs and glitches.



**Q**: What happens when 2.2 releases?

**A**: I may have to bring back the "Coming Soon" page for missing 2.2 features. They will be added to GDBrowser given enough time. I'll also be checking upstream to see if Colon adds those features before I do.



**Q**: I don't see much difference in the overall usage.

**A**: The application does not attempt to drastically modify any existing user interfaces. Most of the "improvements" are done over the backend.



**Q**: What about those shiny new JS runtimes (Deno, Bun, etc.)?

**A**: This project was originally written for Node.js, and the ecosystem surrounding it is more stable and reliable than that of some other JS/TS runtimes. Brand-new projects from me without Node-specific dependencies may use them, but I'll never know for sure.



**Q**: Why don't you credit yourself here?

**A**: It's not worth it.

## Roadmap

- [ ] Complete all the TODOs (14).
- [ ] Implement 2.2 features once the release is out.
- [ ] Write JSDoc for all the types and interfaces in code.
- [ ] Fix glaring visual errors.

---

happy gdbrowsing and god bless.
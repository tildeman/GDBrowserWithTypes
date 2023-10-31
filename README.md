# GDBrowser with types

Originally intended as a small side project while working on [binalyi](https://github.com/tildeman/binalyi), it quickly became an attempt of me tidying up code. While the end result is far from perfect (god, those templates are awful), they are much better categorized.

## How do I run this?
If you're just here to use GDBrowser locally because the site is down or outdated or blocked or restricted or god knows what, this is the only part you really need to read


To run GDBrowser locally:
1) Install [node.js](https://nodejs.org/en/download/) if you don't already have it
2) Clone/download this repository
3) Open cmd/powershell/terminal in the main folder (with index.js)
4) Type `npm i` to flood your hard drive with code that's 99% useless
5) Type `npm run build` to transpile all the code into something node.js can actually understand.
6) Type `cd out && node index` to run the web server
7) GDBrowser is now running locally at http://localhost:2000

If you want to disable rate limits, ip forwarding, etc you can do so by modifying `settings.js`. Doing this is probably a good idea if you feel like obliterating Rob's servers for some reason. (please don't)

## Using this for a GDPS?

I mean, sure. Why not.

As this is nothing more than a side project. Yes, you can add your own server into your own magical little fork by adding it to **servers.json**. Simply add a new object to the array with the following information:

| identifier       | description                  |
|:----------------:|:-----------------------------:|
| `name`           | The display name of the server |
| `link`           | The server's website URL (unrelated to the actual endpoint) |
| `author`         | The creator(s) of the server |
| `authorLink`     |  The URL to open when clicking on the creator's name |
| `id`             | An ID for the server, also used as the subdomain (e.g. `something` would become `something.gdbrowser.com`) |
| `endpoint`       | The actual endpoint to ~~spam~~ send requests to (e.g. `http://boomlings.com/database/` - make sure it ends with a slash!) |


There's also a few optional values for fine-tuning. I'll add more over time

| identifier       | description                   | type |
|:----------------:|:-----------------------------:|:----:|
| `timestampSuffix` | A string to append at the end of timestamps. Vanilla GD uses " ago" | string |
| `demonList` | The URL of the server's Demon List API, if it has one (e.g. `http://pointercrate.com/` - make sure it ends with a slash!) | string |
| `disabled` | An array of menu buttons to "disable" (mappacks, gauntlets, daily, weekly, etc). They appear greyed out but are still clickable. | array |
| `pinned` | "Pins" the server to the top of the GDPS list. It appears above all unpinned servers and is not placed in alphabetical order. | bool |
| `onePointNine` | Makes a bunch of fancy changes to better fit 1.9 servers. (removes orbs/diamonds, hides some pointless buttons, etc) | bool |
| `weeklyLeaderboard` | Enables the lost but not forgotten Weekly Leaderboard, for servers that still milk it | bool |
| `substitutions` | A list of parameter substitutions, because some servers rename/obfuscate them. (e.g. `{ "levelID": "oiuyhxp4w9I" }`) | `Record<string, string>` |
| `overrides` | A list of endpoint substitutions, because some servers use renamed or older versions. (e.g. `{ "getGJLevels21": "dorabaeChooseLevel42" }`) | `Record<string, string>` |

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

I guess the best way to put it is uh... **representations** of data capsules that do things???

`Level.ts` and `Player.ts` parse the server's disgusting response and sends back a nice object with all the relevant info.

`UserCache.ts` handles caching and in-memory storage for common requests.

### HTML (in `/static`)

These are old remains of the original GDBrowser where HTML code is manipulated directly through servers. These are prone to bugs and are what pushed me for a complete rewrite. Currently unused.

### Lib

I put plain old reusable functions there in order to avoid the usage of fancier classes that require initialization and all that stuff.

`xor.ts` used to be a class, but I converted it into a collection of separate functions for the sake of clarity.

### Middleware

I didn't plan to add this folder, but I don't want `index.ts` to be cluttered, either. It basically contains helper functions for use in most files in `/api`.

### Misc

Inevitable misc folder

When you're working on a project the size and scale of GDBrowser, there has to be several one-off fragments that aren't enough on their own but don't go well with other files. Mostly JSON files and some modules and scripts.

**Level Analysis Stuff (in `/analysis`)**
  
| name | description |
|:----:|:-----------:|
| `blocks.json` | The object IDs in the different 'families' of blocks |
| `colorProperties.json` | Color channel cheatsheet |
| `initialProperties.json` | Level settings cheatsheet |
| `objectProperties.json` | Object property cheatsheet. Low budget version of [AlFas' one](https://github.com/AlFasGD/GDAPI/blob/master/GDAPI/GDAPI/Enumerations/GeometryDash/ObjectProperty.cs) |
| `objects.json` | IDs for portals, orbs, triggers, and misc stuff |

**Everything Else**

| name | description |
|:----:|:-----------:|
| `achievements.json` | List of all GD/meltdown/subzero/etc achievements. `parseAchievementPlist.js` automatically creates this file |
| `achievementTypes.json` | An object containing different categories of achievements (stars, shards, vault, etc) and how to identify them |
| `credits.json` | Credits! (shown on the homepage) | 
| `dragscroll.js` | Used on several pages for drag scrolling |
| `global.js` | Excecuted on most pages. Used for the 'page isn't wide enough' message, back button, icons, and a few other things |
| `music.json` | An array of the official GD tracks (name, artist) |
| `sampleIcons.json` | A pool of icons, one of which will randomly appear when visiting the icon kit. Syntax is [Name, ID, Col1, Col2, Glow] |
| `secretStuff.json` | GJP goes here, needed for level leaderboards. Not included in the repo for obvious reasons |

### Page scripts

These are a collection of modules for use on individual webpages. `comments.ts` loads comments for the commments page. `filters.ts` remembers your filters the next time you visit GDBrowser. I separated these from the respective HTML for two reasons:

1) Type-checking code works better when the files are detached from HTML.
2) These files are imported as ES6 modules, and they are designed not to pollute the global namespace. Keeping them detached makes usage of imports and exports much more convenient.

### Routes

When you go on a link, the web server has to know what you're looking for. It does this by checking the URI of the webpage, and then looking for what you expect should show up on that page.

For example, if you're looking for levels, you go to the right page (`/search`), and the routing does all of that for you.

This does seem a lot like ravioli code, but it may aid in readability.

### Templates

This is the "views" part in the MVC model if you're familiar with that. I will call them templates to help make it easier to understand.

These are the "new" templates that are made to replace the contents in `/html`, notably those about levels and profiles.

A lot of them have conditions and mix-ins that replace the preprocessing functions that manually replace placeholder values server-side. Instead of embedding unknown stuff into HTML files and hope it doesn't break (GDBrowser does glitch out sometimes for earlier levels), now the preprocessing is all handled by the template engine.

## RAQ (Rarely Asked Questions)

Q: What on earth is GDBrowser?

A: Basically a website to browse some of Geometry Dash's online features.


Q: Why don't you write normal `.js` files? Why `.ts`?

A: TypeScripts (and IntelliSense) works much better on `.ts` files. They may aid in catching errors early in development.


Q: Some of the buttons/icons/UI elements don't match up with the original GDBrowser.

A: This is a side effect of how browsers handle webpages. Since the original GDBrowser templates were written without a `<!DOCTYPE html>`, this causes the browser to implement quirks that affect webpage rendering. While transitioning the templates to HTML5, I had to sacrifice some of the formatting details; this resulted in bugs and glitches.


Q: What happens when 2.2 releases?

A: I may have to bring back the "Coming Soon" page for missing 2.2 features. They will be added to GDBrowser given enough time. I'll also be checking upstream to see if Colon adds those features before I do.


Q: I don't see much difference in the overall usage.

A: The application does not attempt to drastically modify any existing user interfaces. Most of the "improvements" are done over the backend.

## Roadmap

[ ] Complete all the TODOs (36).
[ ] Implement 2.2 features once the release is out.
[ ] Write JSDoc for all the types and interfaces in code.
[ ] Fix glaring formatting errors.

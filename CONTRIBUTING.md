# Contributing

This is what most people aren't looking for. However, it may contain valuable information.

## Code conventions

First and foremost, code conventions.

The original GDBrowser had some questionable styling conventions. The point of this document when it comes to coding conventions is to ensure that:
1. The code style looks consistent across all files
2. Readability is maintained

That is why I have a few coding rules for contributors looking to submit their pull requests into the default (`typescript`) branch:

### General syntax

Always append the end of an action with a semicolon for TypeScript files.

**OK**
```typescript
action();
```

**NOT OK** (no semicolon)
```typescript
action()
```

**NOT OK** (multiple semicolons)
```typescript
action();;;
```

Indentation is handled with the tab character; this means no spaces. By default, the size of a normal tab character is 4 characters.

**OK**
```typescript
	indented_action();
```

**NOT OK** (spacing for indentation)
```typescript
  indented_action();
```

### Operators & variable declarations

Add one space for every side of the operator. Between the value and the ending semicolon there is no spacing.

**OK**
```typescript
const a = 5;
```

**OK**
```typescript
const c = a * 14;
```

**NOT OK** (no spacing)
```typescript
const a=5;
```

**NOT OK** (too much spacing)
```typescript
const a    =  4 *  5;
```

**NOT OK** (no spacing between the value and the semicolon)
```typescript
const a = 5 / 2    ;
```

Prefer `const` declarations wherever possible.

**OK**
```typescript
const oneTwoThree = 1 * 2 * 3;
```

**OK**
```typescript
let oneTwoFour = 1 * 2 * 3;
oneTwoFour = 1 + 2 + 3;
```

**OK** (avoid this!)
```typescript
let oneTwoThree = 1 * 2 * 3; // readonly value
```

Both single-quoted (`'`) and double-quoted (`"`) are allowed. Prefer double quotes for new code.

**OK**
```typescript
const str1 = 'single'; // avoid using this in new code
const str2 = "double";
```

You can also use backticks (`\``) and triple backticks (`\`\`\``) for formatted and multiline strings. Make sure that all of them end with a semicolon.

**OK**
```typescript
const multiline = ```
this is a multiline string!
```;
const formatted = `and this ${multiline} is formatted and multiline!`;
```

Accessing methods is done by the dot (`.`) operator. Put no spacing between them.

**OK**
```typescript
const car = "string".replace("1", "2").replace("3", "4");
```

**NOT OK** (too many spaces)
```typescript
const car = "string"   .replace("1", "2")      .replace("3", "4");
```

If the code becomes too long, truncate it before the dot operator. The whole part after truncation is indented one level.

**OK**
```typescript
const car = "string"
	.replace("1", "2")
	.replace("3", "4");
```

**NOT OK** (not enough indentation)
```typescript
const car = "string"
.replace("1", "2")
.replace("3", "4");
```

**NOT OK** (too much indentation)
```typescript
const car = "string"
		.replace("1", "2")
		.replace("3", "4");
```

**NOT OK** (varying indentation)
```typescript
const car = "string"
	.replace("1", "2")
		.replace("3", "4");
```

List elements are separated with `, ` (a comma, and then a single space). There should not be spacing between values and list brackets.

**OK**
```typescript
const leaf = [1, "string", false];
```

**NOT OK** (too many spaces)
```typescript
const leaf = [1,    "string",   false]  ;
```

**NOT OK** (too few spaces)
```typescript
const leaf = [1,"string",false];
```

**NOT OK** (spacing between list brackets and values)
```typescript
const leaf = [ 1, "string",  false ];
```

You can transfer the code into multiple lines, if needed. All the elements must not belong to the lines with brackets. The opening bracket is on the same line as the definition. Make sure the closing bracket is on the same level as the statement itself.

**OK**
```typescript
const leaf = [
	1,
	"string",
	false
];
```

**NOT OK**
```typescript
const leaf = [1,
	"string",
	false];
```

For inline objects, add spacing between the brackets. Avoid using quotes for keys unless necessary. Keys are separated from values with `: ` (a colon and a single space after).

**OK**
```typescript
const leaf = { first: 1, second: "string", "third-and-fourth": false };
```

**OK** (avoid this!)
```typescript
const leaf = { "first": 1, "second": "string", "third-and-fourth": false };
```

**NOT OK** (insufficient spacing)
```typescript
const leaf = {first: 1, second: "string", "third-and-fourth": false};
```

**NOT OK** (insufficient spacing)
```typescript
const leaf = { first:1, second:"string", "third-and-fourth":false };
```

**NOT OK** (too many spaces)
```typescript
const leaf = {   first:      1,    second:   "string",   "third-and-fourth":   false  };
```

### Blocks

All of the code blocks in curly brackets `{}` are in separate lines and are separate from the brackets. The statement before the opening bracket is on the same line.

Add exactly one space between the statement, the clause and the opening bracket.

Inline predicates are prohibited, unless the predicate can be written in one action, in which case the curly brackets must be omitted.

**OK**
```typescript
if (he_is_dead) {
	return statement;
}
```

**OK**
```typescript
if (he_is_dead) {
	handle_stuff();
	return statement;
}
else {
	handle_other_stuff();
	return value;
}
```

**OK**
```typescript
if (he_is_dead) return statement;
```

**NOT OK** (opening bracket not on the same line as the statement)
```typescript
while (he_isnt_dead)
{
	handle_other_stuff();
	continue;
}
```

**NOT OK** (do not attach another statement after a closing bracket)
```typescript
if (he_isnt_dead) {
	handle_other_stuff();
	return value;
} else {
	handle_stuff();
	return statement;
}
```

**NOT OK** (too many spaces)
```typescript
if    (he_isnt_dead)    {
	handle_other_stuff();
	return value;
}
else                    {
	handle_stuff();
	return statement;
}
```

**NOT OK** (do not write inline predicates)
```typescript
if (he_is_dead) { handle_stuff(); return statement; }
```

**NOT OK** (avoid curly bracket if it's a one-action predicate)
```typescript
if (he_is_dead) { return statement; }
```

For `for` loops, add one space after each of the statement's semicolons

**OK**
```typescript
for (let i = 0; i < n; i++) {
	console.log(i);
}
```

**NOT OK** (add spaces after semicolons)
```typescript
for (let i = 0;i < n;i++) {
	console.log(i);
}
```

**NOT OK** (too many spaces)
```typescript
for (let i = 0;   i < n;   i++) {
	console.log(i);
}
```

For functions, there should be no spacing between the name and the parameter list.

The parameter list has type declarations separated by `: ` (a colon and a single space) and a `, ` between other parameters (a comma and a single space). No spacing is permitted between the parameters and the parentheses.

The return type (if present) come right after the closing parenthesis, no spacing allowed. The type should come after `: ` (a colon and a single space)

**OK**
```typescript
function peach(eat: (a: number, b: number) => string, laek: number): void {
	eat(1, laek - 1);
}
```

**NOT OK** (spaces between the function name and the parameter list)
```typescript
function peach   (eat: (a: number, b: number) => string, laek: number): void {
	eat(1, laek - 1);
}
```

**NOT OK** (spaces between the parentheses and the parameters)
```typescript
function peach(   eat: (a: number, b: number) => string, laek: number   ): void {
	eat(1, laek - 1);
}
```

**NOT OK** (spaces between the closing parenthesis and the return type)
```typescript
function peach(eat: (a: number, b: number) => string, laek: number)  :   void {
	eat(1, laek - 1);
}
```

Anonymous long-form functions don't have spaces between the parameter list and the keyword itself.

**OK**
```typescript
const peach = function(eat: (a: number, b: number) => string, laek: number): void {
	eat(1, laek - 1);
}
```

**NOT OK** (spaces between the `function` keyword and the parameter list)
```typescript
const peach = function   (eat: (a: number, b: number) => string, laek: number): void {
	eat(1, laek - 1);
}
```

Anonymous short-form functions can either have one untyped parameter or a list of parameters (typed or untyped)

**OK**
```typescript
const feet = bare => bare + 1;
```

**OK**
```typescript
const feet = bare => {
	return bare + 1;
}
```

**OK**
```typescript
const feet = (bare: number, foot: number) => {
	return bare + foot;
}
```

### Pug styling

There's not much to say about this, so I'll keep it as a list of guidelines:
1) `style` attributes have an object type instead of a string type.
2) Prefer shorthands for ID and class names. (`img#identity.class`) instead of (`img(id="identity", class="class")`)
3) Omit the `div` keyword for `div` tags with classes or IDs.
4) Use pipes for inline tags.
5) Always include a `doctype html` at the beginning of the file.

## How to submit issues/PRs

As the upstream repo is archived and closed for issues, you can submit issues in the issues tab in this repository instead. I'll be happy to provide assistance.

If your request is about a missing 2.2 feature in GDBrowser, it's better to wait until the feature is ready. I have a limited amount of time to spend on this project.
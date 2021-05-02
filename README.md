# pratt-parser-blog-code

This project started as an implementation of a lexer and Pratt parser for a simple language.

It also creates a CodeMirror mode, `myMode`, that provides syntax highliting based on the lexer, and linting for parsing errors.

For more details, see this [blog post on the Desmos engineering blog](https://engineering.desmos.com/articles/pratt-parser).

We turned this into the proof of concept for a Maybe-Undefined or Definitely (MUD) type to be added to Desmos' Computation Layer.

So, in addition to the lexer and Pratt parser, we added capabilities for functions, variables, conditional expressions, and many
more types. We also added type checking, constant checking and evaluation, and MUD checking for the proof of concept.

# Setup

Clone the repo, then run

```
npm install
node fuse.js
```

Then open http://localhost:4444/

# Notes

If you wish to add negative numbers, make sure to use parentheses around the negative number, or it will not parse correctly.

The keywords `WHEN` and `OTHERWISE` can only be used inside conditional expression and will be parsed into Choose Nodes.

Functions will only parse if they are included in the list of built-in functions, which are as follows:
- Sink(any type): the argument can be of any type but must either defined or error checked in a conditional expression
- InputN(): represents a maybe-undefined source of input in number form
- InputB(): represents a maybe-undefined source of input in boolean form
- Inverse(number): computes the inverse a number as long as the argument is not 0
- Sqrt(number): computes the square root of a number as long as the argument is not negative
- IsDefined(any type): the argument can be of any type, returns a boolean

Variables must be lowercase.

Each call to InputN() or InputB() represents a new source of possibly undefined input.



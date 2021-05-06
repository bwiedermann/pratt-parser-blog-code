# pratt-parser-blog-code

This project implements a lexer and Pratt parser for a simple language.

It also creates a CodeMirror mode, `myMode`, that provides syntax highliting based on the lexer, and linting for parsing errors.

For more details, see this [blog post on the Desmos engineering blog](https://engineering.desmos.com/articles/pratt-parser).

Hopefully this will serve as a nice starting point for anyone interested in building a web-based language. Enjoy!

# Online

You can play with the parser online [on the github page](https://desmosinc.github.io/pratt-parser-blog-code/)

# Setup

Clone the repo, then run

```
npm install
node fuse.js
```

Then open http://localhost:4444/

# Notes

We added a new type ConstantNumber which are different from Number types. The ConstantNumber type will be used within the iteration node type.

We also created a new IterationNode type that can be used with the syntax [start end step]

New functions are as follows:

IsConstantOperation(): a simple recursive function in the typechecker to see if a binary operation includes any non-constant numbers.
RandomChoice(ConstantNumber): an example function that is not eligible for iteration as it is not a ConstantNumber. Mainly used for testing.

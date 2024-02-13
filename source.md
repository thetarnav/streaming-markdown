# Streaming Markdown

*Provides reactive primitives for implementing transition effects on a group of elements, or your own `<Transition**>` and `<TransitionGroup>` components.*

`println("Hello, **Worl

just **bold** things

*italic **bold** italic*
**bold *italic* bold**

- [`createSwitchTransition`](#createSwitchTransition) - *Create an element transition *interface for* switching **between** single elements.*
- [`createListTransition`](#createListTransition) - Create an element list transition interface for changes to the list of elements.

*abc **def *ghi* jkl** mno*

## Installation

```bash
npm install @solid-primitives/transition-group
# or
yarn add @solid-primitives/transition-group
# or
pnpm add @solid-primitives/transition-group
```

## `createSwitchTransition`

Create an element transition interface for switching between single elements.
It can be used to implement own transition effect, *or a custom `<Transition>`-like component*.

### How to use it

It will observe the source and return a signal with array of elements to be rendered (current one and exiting ones).
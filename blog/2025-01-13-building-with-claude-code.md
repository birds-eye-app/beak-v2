---
slug: building-with-claude-code
title: Building a Personal Site with Claude Code
authors: [dtmeadows]
tags: [development, ai, docusaurus]
---

# Building a Personal Site with Claude Code

:::info

Note: this first post here was entirely written by Claude... as was the site. Please read all of it with a grain of salt and lots of side eye for the developer and creator who was too lazy to put his own words down to paper. I did give it a lot of bullet points as prompts... and a few cycles of edits to get it to try and stop bragging about it self so much.

:::

I rebuilt my personal site using [Claude Code](https://claude.ai/code). Here's how we went from a Frankenstein React setup to a Docusaurus site, with Claude handling most of the implementation.

<!-- truncate -->

## The Starting Point

Before this rebuild, I was hosting my birding apps ([Chirped](https://beak-v2.onrender.com/chirped) and [Birds Eye](https://beak-v2.onrender.com/birds-eye)) on separate pages with custom React routing. It was functional, but it was a "Frankenstein" setup—bits and pieces stitched together over time without much thought to architecture.

The trigger for this rebuild was wanting to add a blog. My first thought was "let's use Docusaurus!" In retrospect, using a documentation framework for a personal site with two interactive apps and a photo gallery is probably overkill. But it gave me a chance to experiment with Claude Code.

## The Claude Code Experience

Claude Code handled the migration from my old setup, implemented new features, and dealt with styling and component architecture. Here's what worked well and what didn't:

### What Worked Really Well

**Migration and Integration**: Claude migrated my existing Chirped and Birds Eye applications into the new Docusaurus structure. It preserved functionality and adapted everything to work with Docusaurus's routing and theming system.

**Feature Implementation**: Claude successfully implemented several features:
- Dark/light mode toggle with a custom slider component
- Responsive photo gallery with auto-advancing slides
- Video previews with proper autoplay handling
- Custom footer with social links and theme switching
- Complete theme integration across all components

**Implementation Process**: Most requests could be described in plain language and Claude would implement them correctly. The build process rarely broke, and when it did, Claude caught and fixed issues.

### Where Claude Struggled

That said, there were definitely some quirks and limitations:

**Visual Design Decisions**: Claude can't "see" the website, so visual tweaks required back-and-forth iteration. Things like spacing, color choices, and layout decisions often needed human input to get right.

**Persistent Small Issues**: Some problems were oddly persistent. For example:
- The moon icon in the dark mode switcher never quite looked right (we ended up simplifying it)
- Claude was convinced that Safari wouldn't support autoplaying videos and kept trying to add controls, even when I explicitly said the videos should autoplay

**Complex Animations**: Image transitions proved challenging. I requested a photo gallery where images would fade/dissolve into each other. Claude tried multiple approaches but couldn't get the timing and state management right. Eventually, we used simple static transitions instead.

## The Result

The end result includes:
- Clean, responsive design with dark/light mode support
- Auto-advancing photo gallery showcasing my birding photos
- Both interactive apps working within the Docusaurus framework
- A working blog (like this post!)
- Custom footer with social links and theme controls

The entire homepage has no traditional navigation—just a photo gallery, project previews, and minimal footer. It's much cleaner than what I had before.

## Thoughts on AI-Assisted Development

This project provided insight into AI-assisted development. The ability to describe features in natural language and have them implemented correctly most of the time is useful. But there are still limitations where human oversight is needed.

**The Sweet Spot**: Claude Code excels at taking well-defined requirements and implementing them with good architectural decisions. It's particularly strong at integrating existing code and handling framework-specific patterns.

**The Gaps**: Visual design, complex state management, and nuanced user experience decisions still benefit heavily from human oversight. And sometimes Claude just gets stuck on ideas that don't quite work.

**The Process**: The most effective approach was treating Claude as a developer who can implement features reliably but needs clear direction and occasional course corrections.

Would I use Claude Code for future projects? Yes. The productivity gains are significant, and it's helpful to collaborate with an AI that understands code architecture and can implement features. Just don't expect it to handle everything perfectly on the first try.

---

*This site is hosted at [beak-v2.onrender.com](https://beak-v2.onrender.com) and the full source code is available on [GitHub](https://github.com/birds-eye-app/beak-v2).*
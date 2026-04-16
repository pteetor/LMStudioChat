# Plan for Incorporating Skills

This document outlines the architectural approach to incorporating skills from the `.gemini/skills/` directory into the TypeScript LLM agent, mapped to concepts familiar to a C/C++ developer.

### 1. Discovery and File Loading (The "Initialization" Phase)
Just like reading configuration files or dynamically loading modules in C++, the agent needs to load these skills into memory at startup.
*   **The Approach:** Use the ADK's `load_skill_from_dir()` function to automatically scan the `.gemini/skills/` directory and parse the `SKILL.md` files. This replaces the need to manually walk the file system.
*   **TypeScript Concept:** Instead of manually writing asynchronous I/O logic using Node.js's `fs` (File System) module (which would be akin to using `<filesystem>` or `dirent.h` in C++), we call this library-provided function to handle the boilerplate.

### 2. Data Representation (The "Struct" Phase)
Once the skills are loaded, they must be held in memory in a structured way.
*   **The Approach:** The `load_skill_from_dir()` function will return pre-parsed data structures representing each loaded skill (e.g., containing the skill's name, description, and instructions).
*   **TypeScript Concept:** Instead of defining our own custom `interface` (which acts much like a `struct` in C/C++ to define the shape of the data), we will rely on the type definitions exported by the ADK. This ensures compiler-enforced type safety that naturally aligns with the rest of the ADK ecosystem.

### 3. Agent Integration (The "Runtime" Phase)
Having the skills in memory doesn't do anything until the LLM knows about them. We have to "inject" these skills into the agent's context.
*   **The Approach:** When initializing the ADK agent, we pass the array of loaded skill objects directly into the agent's configuration. The ADK internally manages appending the necessary information to the agent's System Prompt (the foundational "rules of engagement"), effectively telling the agent: *"You now have these skills, and here is how you use them."*

### 4. Tool Mapping (The "Function Pointers" Phase)
If skills require the agent to perform real-world actions (like making an HTTP request to get Evanston's weather, or writing a bookmark to a database), the markdown instructions alone aren't enough.
*   **The Approach:** Define actual TypeScript functions (Tools) that perform the real-world actions described in the skills. Then, register these tools with the ADK alongside the loaded skills.
*   **TypeScript Concept:** Conceptually similar to passing an array of function pointers or virtual methods to a system. The LLM specifies the function it wants to call and its parameters, and the ADK routes that request to the TypeScript function, executes it, and returns the result.

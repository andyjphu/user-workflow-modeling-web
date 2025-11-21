// fsm.ts
export const states = [
    "code_editor_editing",
    "coding_in_editor",
    "terminal_activity",
];
  
export const transitions = [
    { trigger: "open_terminal", source: "coding_in_editor", dest: "terminal_activity" },
    { trigger: "switch_back",  source: "terminal_activity", dest: "coding_in_editor" },
];

export type FSMStateId = string;

export interface FSMTransition {
  trigger: string;
  source: FSMStateId;
  dest: FSMStateId;
}

export const states: FSMStateId[] = [
  "code_editor_editing",
  "coding_in_editor",
  "terminal_activity",
  "new_project",
  "project_setup",
  "preview_website",
  "responsive_design",
  "prepare_learning",
  "collaboration_and_debugging",
  "open_new_tab",
  "using_code_editor_features",
  "pseudo_element_styling",
  "designing",
  "review_design",
  "previewing_changes",
  "coding",
  "styles_refinement",
  "testing_design",
  "file_opened"
];
  
export const transitions: FSMTransition[] = [
  { trigger: "open_terminal", source: "coding_in_editor", dest: "terminal_activity" },
  { trigger: "switch_back", source: "terminal_activity", dest: "coding_in_editor" },
];

# Development Workflow Guide

## Overview

This document explains the development workflow system we've established to maintain consistency, quality, and context across all development work.

## Core Components

### 1. **Project Overview** (`docs/PROJECT_OVERVIEW.md`)
- **Purpose**: Single source of truth about what the app is, what it does, recent changes, and future plans
- **When to update**: Before starting work (to understand context) and after completing work (to document changes)
- **Sections**:
  - What the App Is
  - Core Functionality (Today) 
  - Recent Changes / Known Issues
  - Future Improvements / Ideas
  - Architectural Notes
  - Reference Material

### 2. **Rule Files** (`.cursor/rules/*.mdc`)
- **Purpose**: Automated reminders and guidelines that surface in Cursor
- **Current Rules**:
  - `project_overview.mdc` - Ensures project overview stays updated
  - `maintainable_code.mdc` - Enforces code quality standards
  - `rule_maintenance.mdc` - Captures effective working methods
  - `todo_lists.mdc` - Manages feature checklists

### 3. **Todo Lists** (`docs/todo/*.md`)
- **Purpose**: Living checklists for each feature or significant piece of work
- **Format**: Markdown with checkboxes, organized by phases
- **Lifecycle**: Created at branch start, updated during work, archived when complete

### 4. **Git Hook** (`.git/hooks/pre-commit`)
- **Purpose**: Gentle reminder to update documentation when committing code changes
- **Behavior**: Non-blocking, just shows a reminder message

## Daily Workflow

### Starting New Work

1. **Read Context** 📖
   - Skim `docs/PROJECT_OVERVIEW.md` sections 1-4
   - Note how your change might impact other areas

2. **Create Todo List** ✅
   - Create `docs/todo/<feature-name>.md` with initial checklist
   - Break work into logical phases (Planning, Implementation, Testing, etc.)

3. **Create Branch** 🌿
   ```bash
   git checkout -b feature/onboarding-tour
   ```

### During Development

4. **Update Todo List** 📝
   - Check off completed items
   - Add new items if scope grows
   - Reference the checklist in commit messages

5. **Follow Code Quality Rules** 🔧
   - Keep functions small (≤40 lines)
   - Refactor when touching existing code
   - Use clear, descriptive names
   - Separate concerns properly

### Completing Work

6. **Update Documentation** 📚
   - Update `docs/PROJECT_OVERVIEW.md` with changes
   - Create/update rule files if new patterns emerged
   - Complete all todo list items

7. **Commit & Push** 🚀
   ```bash
   git add .
   git commit -m "feat: implement onboarding tour

   - Added react-joyride integration
   - Created tour configuration for key features
   - Added tour state management
   - Updated PROJECT_OVERVIEW.md with new functionality
   
   Checklist: docs/todo/onboarding-tour.md"
   ```

8. **Clean Up** 🧹
   - Move completed todo list to `docs/todo/completed/`
   - Update PROJECT_OVERVIEW.md with final summary

## Rule Enforcement

### Automatic Reminders
- **Cursor**: Shows relevant rules when editing files
- **Git Hook**: Reminds about documentation updates
- **Todo Lists**: Track progress and ensure nothing is missed

### Manual Checks
- **PR Reviews**: Check that documentation is updated
- **Code Quality**: Ensure maintainable code standards
- **Rule Updates**: Capture new effective patterns

## Benefits

### For You
- **Context**: Always know why you're doing something
- **Progress**: Clear tracking of what's left to do
- **Quality**: Consistent code standards across the project

### For the Team
- **Onboarding**: New developers can quickly understand the project
- **Consistency**: Shared standards and practices
- **Knowledge**: Effective patterns are captured and reused

### For the Project
- **Maintainability**: Easy to understand and modify
- **Documentation**: Always up-to-date and accurate
- **Evolution**: Continuous improvement of practices

## Getting Started

1. **This Setup**: The workflow system is now in place
2. **Next Feature**: Create a branch for the onboarding tour
3. **Follow the Process**: Use the workflow for all future work

## Questions?

If you have questions about the workflow or want to suggest improvements, update this document or create a new rule file to capture the insight!

---

*This workflow is designed to be lightweight but comprehensive - it should help, not hinder your development process.* 
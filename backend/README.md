# ECP Project - Student Guide

Welcome to the ECP Project! This README will help you get started, follow our conventions, and contribute effectively. Please read carefully and refer back as needed.

---


## Pull Request Template

When creating a pull request, use the template in `PULL_REQUEST_TEMPLATE.md` located in this folder. Copy its contents and fill it out for your PR.

---

## General Conventions
- **Work on your own branch**: Breaking the main branch affects everyone.
- **Label your pull requests**: Use Jira ticket and team tag.
- **Follow naming conventions**: See below.

## Branch Naming
Branches follow this format:
```
type/TEAMTAG-JiraID_Description
```
Types:
- `feat/` (feature)
- `bug/` (bugfix)
- `doc/` (documentation)
- `conf/` (configuration)

Example:
```
git checkout -b feat/Service-PROF-123_Add_Appointment_API
```

## Setup
1. Create a GitHub account
2. Download Git: https://git-scm.com/downloads
3. Clone the repo:
   ```
   git clone https://github.com/ProfroidDev/Profroid.git
   ```
4. Add upstream remote:
   ```
   git remote add upstream https://github.com/ProfroidDev/Profroid.git
   git remote -v
   ```

## Story Workflow
1. Start from `master`:
   ```
   git checkout master
   git fetch origin master
   git reset --hard origin/master
   ```
2. Create a new branch:
   ```
   git switch -c YOUR-BRANCH-NAME
   ```
3. Stage and commit changes:
   ```
   git add .
   git commit -m "Short description"
   ```
4. Push your branch:
   ```
   git push
   ```
5. Open a pull request on GitHub, fill out the template, and request reviews.
6. Two approvals are required before merging.

## Merge Conflicts / Updating Your Branch
1. Fetch and rebase:
   ```
   git fetch origin master
   git rebase origin/master
   ```
2. Resolve conflicts, then:
   ```
   git add .
   git rebase --continue
   git push --force-with-lease
   ```

## Here is an example of workflow 


## Example Workflow

Follow these steps to keep your branch up to date and resolve conflicts:


1. **Make sure you have no local changes pending:**
   ```
   git status
   ```


2. **Update your local main branch (fast-forward only; no accidental merge commits):**
   ```
   git checkout master
   git fetch origin
   git pull --ff-only origin master   # or: git reset --hard origin/master
   ```


3. **Rebase your feature branch on the updated main:**
   ```
   git checkout feat/EMP-PROF-21_Add_Appointment
   git rebase origin/master
   ```


    If there are conflicts:
    - Fix the files
    - Stage the fixed files:

       ```
       git add <fixed files>
       ```

    - Continue the rebase:

       ```
       git rebase --continue
       ```

    - Repeat as needed until all conflicts are resolved


4. **Push your updated feature branch (this does NOT touch origin/main):**
   Use `--force-with-lease` only because rebase rewrites your branch’s history.
   ```
   git push --force-with-lease origin feat/EMP-PROF-28_Get_Employee
   ```

## Useful Git Commands
- See changes: `git status`
- Diff: `git diff HEAD .`
- List remotes: `git remote -v`
- List branches: `git branch`
- Reset to main: `git fetch origin main; git reset --hard origin/main`
- Rebase: `git fetch origin main; git rebase origin/main`
- Switch branch: `git checkout BRANCH-NAME`
- Create branch: `git checkout -b BRANCH-NAME`
- Stage all: `git add .`
- Unstage all: `git reset HEAD .`
- Commit: `git commit -m "Message"`
- Push: `git push`
- Force push: `git push --force`
- Cherry-pick: `git cherry-pick <commitId>`
- Stash: `git stash`
- Pop stash: `git stash pop`

## SSH Keys
If using SSH keys, run:
```
ssh-add
```
Enter your passphrase when prompted. If using a custom key name:
```
ssh-add ~/.ssh/myprivatekeyname
```

---


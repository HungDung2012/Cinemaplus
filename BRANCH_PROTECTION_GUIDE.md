# 🔒 GitHub Branch Protection Setup Guide

## Để setup branch protection như các dự án thực tế:

### 1. Vào GitHub Repository Settings
1. Chọn **Settings** → **Branches** 
2. Click **Add rule**

### 2. Branch Protection Rule cho `main`:
```
Branch name pattern: main

☑️ Require a pull request before merging
  ☑️ Require approvals (tối thiểu 1-2 people)
  ☑️ Dismiss stale reviews when new commits are pushed
  ☑️ Require review from code owners

☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
  Search for status checks:
    - test (from our workflow)
    - build-and-deploy

☑️ Require conversation resolution before merging

☑️ Restrict pushes that create files larger than 100MB

☑️ Do not allow bypassing the above settings
```

### 3. Setup CODEOWNERS file:
```
# Auto-assign reviewers
* @your-username
*.java @backend-team-lead
*.tsx @frontend-team-lead
```

## Workflow sau khi setup:
1. Developer tạo feature branch: `git checkout -b feature/pagination`
2. Code và commit: `git commit -m "Add pagination"`
3. Push: `git push origin feature/pagination`
4. Tạo Pull Request từ GitHub
5. CI/CD chạy tests tự động
6. Team review code
7. Sau khi approve → Merge vào main
8. Auto deploy to production (sau khi tests pass)
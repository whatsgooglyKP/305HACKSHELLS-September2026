How to Open Miami Dade from PowerShell: 

  Open PowerShell and use either of the following commands:

  #### Option A: Resume the most recent conversation (Fastest)

    agy -c

  (or agy --continue)
  This immediately loads your last conversation right where you left off.

  #### Option B: Resume this specific conversation by ID

  If you start other sessions in between, you can resume this exact conversation at any time by using its
  Conversation ID:

    agy --conversation 313158d1-e721-4e73-b785-864aa3332454
  ──────
  │ Tip
  │ Working Directory: Before running agy -c, navigate to your project directory in PowerShell so Antigravity has the
  │ right local workspace context:
  │
  │   cd "C:\Users\pinar\Documents\ocps singlemom financial stability agent"
  │   agy -c
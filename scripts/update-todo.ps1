# PowerShell Script for Automated ToDo.md Updates
# This script scans git commit messages and updates task statuses in ToDo.md

param(
    [string]$ToDoPath = "../ToDo.md",
    [switch]$DryRun
)

# Function to parse commit messages for task status updates
function Update-ToDoStatus {
    param($ToDoContent, $CommitMessage)

    $updatedContent = $ToDoContent

    # Patterns for status updates in commit messages
    if ($CommitMessage -match "(?i)complete|finish|end (\w+)") {
        $task = $matches[1]
        $updatedContent = $updatedContent -replace "(\*\*Status:\*\* )(In Progress|Not Started|On Hold)(.*?$task.*?Status:\*\* )([^\|]+)", '$1Completed$3Completed'
    } elseif ($CommitMessage -match "(?i)start|begin (\w+)") {
        $task = $matches[1]
        $updatedContent = $updatedContent -replace "(\*\*Status:\*\* )(Not Started)(.*?$task.*?Status:\*\* )([^\|]+)", '$1In Progress$3In Progress'
    }

    return $updatedContent
}

# Get recent commits
$commits = git log --oneline -10

try {
    if ($DryRun) {
        Write-Host "DRY RUN - Would update ToDo.md with the following changes:"
        foreach ($commit in $commits) {
            Write-Host "Processing commit: $commit"
        }
    } else {
        $content = Get-Content $ToDoPath -Raw

        foreach ($commit in $commits) {
            $content = Update-ToDoStatus -ToDoContent $content -CommitMessage $commit
        }

        $content | Set-Content $ToDoPath -Encoding UTF8
        Write-Host "ToDo.md updated successfully!"
    }
} catch {
    Write-Error "Failed to update ToDo.md: $_"
}

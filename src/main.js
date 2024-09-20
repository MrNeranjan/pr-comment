//;

const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const prNumber = core.getInput('pr-number', { required: true })
    const token = core.getInput('token', { required: true })

    const octokit = github.getOctokit(token)

    const { data: changeFiles } = await octokit.pull.listFiles({
      owner,
      repo,
      pull_number: prNumber
    })

    let diffData = {
      added: 0,
      modified: 0,
      removed: 0
    }

    diffData = changeFiles.reduce((acc, file) => {
      acc.added = file.additions
      acc.modified = file.changes
      acc.removed = file.deletions
    }, diffData)

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `## PR Summary
       - **Added:** ${diffData.added}
       - **Modified:** ${diffData.modified}
       - **Removed:** ${diffData.removed}
       `
    })

    for (const file of changeFiles) {
      const fileExtension = file.filename.split('.').pop()

      let label = ''
      switch (fileExtension) {
        case 'md':
          label = 'markdown'
          break

        case 'yml':
          label = 'yaml'
          break
        case 'yaml':
          label = 'yaml'
          break
        case 'js':
          label = 'javascript'
          break
        case 'css':
          label = 'css'
          break
        case 'html':
          label = 'html'
          break
        default:
          label = 'other'
      }
      await octokit.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label]
      })
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

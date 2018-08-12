#!/usr/local/bin/node

// <bitbar.title>Starred Gitlab CI</bitbar.title>
// <bitbar.version>v1.0</bitbar.version>
// <bitbar.author>David Konsumer</bitbar.author>
// <bitbar.author.github>konsumer</bitbar.author.github>
// <bitbar.desc>Show CI status of your started projects</bitbar.desc>
// <bitbar.dependencies>node</bitbar.dependencies>

const https = require('https')
const querystring = require('querystring')

const { GITLAB_KEY } = process.env

if (!GITLAB_KEY) {
  throw new Error('GITLAB_KEY not set in environment.')
}

const emojis = {
  'created': '💤',
  'pending': '💤',
  'running': '🚀',
  'failed': '❗',
  'success': '✔️',
  'skipped': '🚀',
  'manual': '👊',
  'canceled': '✖'
}

const api = (endpoint, args) => new Promise((resolve, reject) => {
  const url = `https://gitlab.com/api/v4/${endpoint}?private_token=${GITLAB_KEY}${args ? '&' + querystring.stringify(args) : ''}`
  https.get(url, res => {
    res.setEncoding('utf8')
    let body = ''
    res.on('data', data => {
      body += data
    })
    res.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(e)
        console.log('ERROR', url, body)
      }
    })
    res.on('error', err => {
      reject(err)
    })
  })
})

const run = async () => {
  const projects = await api('projects', {
    membership: true,
    sort: 'desc',
    order_by: 'updated_at',
    starred: true
  })
  const pipelines = await Promise.all(
    projects.map(p => api(`projects/${p.id}/pipelines`))
  )
  await Promise.all(
    projects.map(async (project, p) => {
      project.pipelines = await Promise.all(pipelines[p].map(pipe => {
        return api(`projects/${project.id}/pipelines/${pipe.id}`)
      }))
    })
  )

  const sortedprojects = projects.map(project => {
    return {
      id: project.id,
      name: project.name,
      pipelines: project.pipelines
        .map(pipe => {
          return {
            id: pipe.id,
            started_at: pipe.started_at,
            finished_at: pipe.finished_at,
            user: pipe.user.username,
            status: pipe.status,
            duration: pipe.duration,
            tag: pipe.tag,
            icon: emojis[pipe.status] || '💀'
          }
        })
        .sort((a, b) => (
          (a.finished_at === b.finished_at)
            ? 0
            : a.finished_at < b.finished_at ? -1 : 1
        ))
    }
  })

  console.log(sortedprojects.map(project => {
    const pipe = project.pipelines && project.pipelines.length && project.pipelines[project.pipelines.length - 1]
    if (pipe) {
      return `${pipe.icon} ${project.name}`
    }
  }).join(' - '))
}
run()

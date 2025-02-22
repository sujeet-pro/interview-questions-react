import ejs from 'ejs'
import { writeFileSync, readFileSync } from 'node:fs'
import { getApps } from './get-apps'
import { resolve } from 'node:path'
import { DIR_APPS, DIR_PROJECT, DIR_TEMPLATE } from './constants'
import { toTitleCase } from './file-names.utils'

function renderEjs(templateFilePath: string, outputFilePath: string, data: Record<string, unknown>) {
  try {
    console.log(`Rendering ${templateFilePath} to ${outputFilePath}`)

    // Read and compile template
    const template = readFileSync(templateFilePath, 'utf-8')
    const compiledTemplate = ejs.compile(template, {
      filename: templateFilePath,
      cache: true, // Enable caching for better performance
      async: false, // Explicitly set sync mode
    })

    // Render template with data
    const content = compiledTemplate(data)

    // Write output file
    writeFileSync(outputFilePath, content, { encoding: 'utf-8' })
  } catch (error) {
    throw new Error(`Failed to render EJS template: ${error}`)
  }
}

export function updateHtml(appName: string) {
  // Validate input
  if (!appName?.trim()) {
    throw new Error('App name cannot be empty')
  }

  // Define app types and their properties
  const appFolderNames = getApps()

  // Create apps array with consistent structure
  const apps = appFolderNames.map(folderName => ({
    name: toTitleCase(folderName),
    href: folderName === 'main' ? process.env.VITE_SITE_BASE : `${process.env.VITE_SITE_BASE}apps/${folderName}/`,
    folderName,
    folderPath: folderName === 'main' ? resolve(DIR_PROJECT) : resolve(DIR_APPS, folderName),
  }))

  // Get target app
  const currentApp = apps.find(app => app.folderName === appName)
  if (!currentApp) {
    throw new Error(`App "${appName}" not found`)
  }

  // Render template with organized data
  const templateData = {
    app: currentApp,
    apps: apps.filter(app => app.folderName !== currentApp.folderName && app.folderName !== 'main'),
  }

  const templatePath = resolve(DIR_TEMPLATE, 'index.ejs')
  const outputPath = resolve(currentApp.folderPath, 'index.html')
  renderEjs(templatePath, outputPath, templateData)
}

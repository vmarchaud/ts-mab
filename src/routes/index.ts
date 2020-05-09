import path from 'path'
import { generateRoutes, RoutesConfig, SwaggerConfig, generateSwaggerSpec } from '@rlvt/tsoa'
import express from 'express'
import fs from 'fs'
import settings from '../../config'

const srcPath = path.resolve(__dirname, '../')
const ouputPath = path.resolve(__dirname)

export default async function () {
  const swaggerOptions: SwaggerConfig = {
    basePath: '/',
    entryFile: `${srcPath}/index.ts`,
    specVersion: 3,
    outputDirectory: ouputPath,
    controllerPathGlobs: [
      `${srcPath}/controllers/*.ts`
    ],
    name: settings.SERVICE_NAME,
    version: process.env.VERSION || 'unknown',
    yaml: true,
    specMerging: 'recursive'
  }

  const routeOptions: RoutesConfig = {
    basePath: '/',
    entryFile: `${srcPath}/index.ts`,
    routesDir: path.resolve(__dirname)
  }

  // Codegen
  const compilerOptions = {
    baseUrl: path.resolve(srcPath, '../')
  }

  // Note, in CI, to avoid generate for each test
  // we generate before launching any tests, so we don't want to generate again
  if (process.env.NO_GENERATE === undefined) {
    await Promise.all([
      generateSwaggerSpec(swaggerOptions, routeOptions, compilerOptions),
      generateRoutes(routeOptions, swaggerOptions, compilerOptions)
    ])
    const routes = path.resolve(ouputPath, 'routes.ts')
    await fs.promises.writeFile(
      routes,
      fs.readFileSync(routes).toString().replace(/from 'tsoa'/, "from '@rlvt/tsoa'")
    )
  }

  // Router
  const router = express.Router()
  require('./routes').RegisterRoutes(router)
  return router
}

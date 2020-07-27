#!/usr/bin/env node
const alticons = require('../../../build/data.json')
const fse = require('fs-extra')
const { join, resolve } = require('path')

const srcDir = resolve(__dirname, '../src/__generated__')
const iconsFile = join(srcDir, 'icons.js')
const typesFile = join(srcDir, 'icons.d.ts')

const GENERATED_HEADER = '/* THIS FILE IS GENERATED. DO NOT EDIT IT. */'

function pascalCase(str) {
  return str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())
}

const icons = Object.entries(alticons)
  .map(([key, alticon]) => {
    const name = `${pascalCase(key)}Icon`
    const code = `function ${name}(props) {
  const svgDataByHeight = ${JSON.stringify(alticon.heights)}
  return <svg {...getSvgProps({...props, svgDataByHeight})} />
}

${name}.defaultProps = {
  className: 'alticon',
  size: 16,
  verticalAlign: 'text-bottom'
}
`

    return {
      key,
      name,
      alticon,
      code,
    }
  })
  .sort((a, b) => a.key.localeCompare(b.key))

function writeIcons(file) {
  const count = icons.length
  const code = `${GENERATED_HEADER}
import React from 'react'
import getSvgProps from '../get-svg-props'

${icons.map(({ code }) => code).join('\n')}

export {
  ${icons.map(({ name }) => name).join(',\n  ')}
}`
  return fse.writeFile(file, code, 'utf8').then(() => {
    console.warn('wrote %s with %d exports', file, count)
    return icons
  })
}

function writeTypes(file) {
  const count = icons.length
  const code = `${GENERATED_HEADER}
import * as React from 'react'
interface IconProps {
  'aria-label'?: string
  className?: string
  size?: number
  verticalAlign?: 'middle' | 'text-bottom' | 'text-top' | 'top' | 'unset'
}
type Icon = React.FC<IconProps>
${icons.map(({ name }) => `declare const ${name}: Icon`).join('\n')}
export {
  Icon,
  IconProps,
  ${icons.map(({ name }) => name).join(',\n  ')}
}`
  return fse.writeFile(file, code, 'utf8').then(() => {
    console.warn('wrote %s with %d exports', file, count)
    return icons
  })
}

fse
  .mkdirs(srcDir)
  .then(() => writeIcons(iconsFile))
  .then(() => writeTypes(typesFile))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

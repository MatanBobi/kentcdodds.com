import * as React from 'react'
import {Octokit} from '@octokit/rest'
import {json} from '@remix-run/data'
import {useMatches} from '@remix-run/react'
import {MdxPage} from 'types'
import * as mdxBundler from 'mdx-bundler/client'
import {compileMdx} from '../utils/compile-mdx.server'
import {downloadMdxFileOrDirectory} from '../utils/github.server'
import {AnchorOrLink} from '../shared'

async function loadMdxPage({
  octokit,
  rootDir,
  slug,
}: {
  octokit: Octokit
  rootDir: string
  slug: string
}) {
  const pageFiles = await downloadMdxFileOrDirectory(
    octokit,
    `${rootDir}/${slug}`,
  )

  const result = await compileMdx(slug, pageFiles)
  if (!result) return json(null, {status: 404})
  const {code, frontmatter} = result
  return json({slug, code, frontmatter})
}

function mdxPageMeta({data}: {data: MdxPage | null}) {
  if (data) {
    return data.frontmatter.meta
  } else {
    return {
      title: 'Not found',
      description:
        'You landed on a page that Kody the Coding Koala could not find 🐨😢',
    }
  }
}

/**
 * This should be rendered within a useMemo
 * @param code the code to get the component from
 * @returns the component
 */
function getMdxComponent(code: string) {
  const Component = mdxBundler.getMDXComponent(code)
  function KCDMdxComponent({
    components,
    ...rest
  }: Parameters<typeof Component>['0']) {
    return <Component component={{a: AnchorOrLink, ...components}} {...rest} />
  }
  return KCDMdxComponent
}

function FourOhFour() {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const pathname = last?.pathname

  return (
    <>
      <header>
        <h1>404 oh no</h1>
      </header>
      <main>
        {`Oh no, you found a page that's missing stuff... "${pathname}" is not a page on kentcdodds.com. So sorry...`}
      </main>
    </>
  )
}

export {loadMdxPage, mdxPageMeta, FourOhFour, getMdxComponent}
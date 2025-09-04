import type * as types from 'notion-types'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import cs from 'classnames'
import * as React from 'react'
import { Search, useNotionContext } from 'react-notion-x'

import { isSearchEnabled } from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'

function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <div
      className={cs('breadcrumb', 'button', !hasMounted && styles.hidden)}
      onClick={onToggleTheme}
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </div>
  )
}

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components } = useNotionContext()

  // Force custom TempusMail-style navbar regardless of navigationStyle

  return (
    <header className='notion-header'>
      <div className={styles.tempusHeader}>
        <div className={styles.tempusHeaderInner}>
          <div className={styles.brand}>
            <components.Link href='/' className={styles.logoWrap}>
              <img src='/TempusMail.svg' alt='TempusMail' className={styles.logo} />
              <span className={styles.brandText}>TEMPUSMAIL</span>
            </components.Link>
          </div>

          <div className={styles.headerActions}>
            {isSearchEnabled && <Search block={block} title={null} />}
            <ToggleThemeButton />

            <components.Link href='/premium' className={styles.premiumButton}>
              Premium
            </components.Link>
          </div>
        </div>
      </div>
    </header>
  )
}
